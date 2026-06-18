# Phase 3: Service & Job Ecosystem - Detailed Sprint Plan

**Duration:** 8 weeks | **Focus:** Milestone-based escrow, bid system, Stripe Connect payouts

---

## 📊 Sprint Overview

| Sprint     | Duration | Focus Area                   | Key Deliverables                                     |
| ---------- | -------- | ---------------------------- | ---------------------------------------------------- |
| Sprint 3.1 | Week 1-3 | Milestone-Based Escrow       | Contract model, escrow holding, milestone release    |
| Sprint 3.2 | Week 4-5 | Enhanced Bid/Proposal System | Proposal management, client selection, notifications |
| Sprint 3.3 | Week 6-8 | Stripe Connect Integration   | Seller onboarding, payout system, earnings dashboard |

---

## 🏃 Sprint 3.1: Milestone-Based Escrow (Week 1-3)

### Objective

Implement a contract system where clients pay for jobs in stages, with funds held in escrow and released upon milestone completion.

### Current State Analysis

**Existing Job System:**

- ✅ Job CRUD (create, read, update, delete)
- ✅ Proposal submission
- ✅ Basic status management (`open`, `closed`)
- ❌ No payment integration
- ❌ No milestone tracking
- ❌ No escrow system

### Tasks Breakdown

#### Week 1: Database Schema & Models

| Day | Task                               | Agent               | Deliverable             |
| --- | ---------------------------------- | ------------------- | ----------------------- |
| 1   | Design Contract & Milestone schema | @database-optimizer | Schema design doc       |
| 2   | Create Prisma migration            | @database-optimizer | `schema.prisma` updates |
| 3   | Add EscrowTransaction model        | @database-optimizer | Transaction tracking    |
| 4   | Create Contract controller         | @backend-architect  | `contractController.js` |
| 5   | Write unit tests for models        | @api-tester         | Model tests             |

#### Week 2: Escrow Service & Stripe Integration

| Day | Task                             | Agent              | Deliverable           |
| --- | -------------------------------- | ------------------ | --------------------- |
| 6   | Create Escrow service            | @backend-architect | `escrowService.js`    |
| 7   | Integrate Stripe Payment Intents | @backend-architect | Payment flow          |
| 8   | Implement milestone funding      | @backend-architect | Fund holding logic    |
| 9   | Add milestone release flow       | @backend-architect | Release with approval |
| 10  | Write escrow tests               | @api-tester        | Escrow flow tests     |

#### Week 3: API & Frontend

| Day | Task                          | Agent               | Deliverable           |
| --- | ----------------------------- | ------------------- | --------------------- |
| 11  | Create Contract routes        | @backend-architect  | `routes/contracts.js` |
| 12  | Build Contract detail page    | @frontend-developer | `ContractDetail.tsx`  |
| 13  | Build Milestone management UI | @frontend-developer | Milestone components  |
| 14  | Add dispute resolution flow   | @backend-architect  | Dispute endpoints     |
| 15  | E2E testing                   | @api-tester         | Full flow tests       |

### Database Schema Changes

```prisma
// backend/prisma/schema.prisma

// Add to existing models
model User {
  // ... existing fields
  contractsAsClient Contract[] @relation("ClientContracts")
  contractsAsFreelancer Contract[] @relation("FreelancerContracts")
  escrowTransactions EscrowTransaction[]
  payouts Payout[]
}

model Job {
  // ... existing fields
  contract Contract?
}

// New models
model Contract {
  id String @id @default(uuid())
  jobId String @unique
  clientId String
  freelancerId String
  totalAmount Float
  currency String @default("usd")
  status String @default("pending") // pending, active, completed, disputed, cancelled
  stripePaymentIntentId String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  completedAt DateTime?

  job Job @relation(fields: [jobId], references: [id])
  client User @relation("ClientContracts", fields: [clientId], references: [id])
  freelancer User @relation("FreelancerContracts", fields: [freelancerId], references: [id])
  milestones Milestone[]
  escrowTransactions EscrowTransaction[]

  @@map("contracts")
}

model Milestone {
  id String @id @default(uuid())
  contractId String
  title String
  description String
  amount Float
  status String @default("pending") // pending, funded, submitted, approved, released, disputed
  dueDate DateTime?
  fundedAt DateTime?
  submittedAt DateTime?
  approvedAt DateTime?
  releasedAt DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  contract Contract @relation(fields: [contractId], references: [id])
  submissions MilestoneSubmission[]

  @@map("milestones")
}

model MilestoneSubmission {
  id String @id @default(uuid())
  milestoneId String
  freelancerId String
  message String
  attachments String[] // URLs to files
  submittedAt DateTime @default(now())
  clientFeedback String?
  feedbackAt DateTime?

  milestone Milestone @relation(fields: [milestoneId], references: [id])

  @@map("milestone_submissions")
}

model EscrowTransaction {
  id String @id @default(uuid())
  contractId String
  milestoneId String?
  userId String
  type String // fund, release, refund, dispute_hold
  amount Float
  currency String @default("usd")
  stripePaymentIntentId String?
  stripeTransferId String?
  status String @default("pending") // pending, completed, failed
  metadata Json?
  createdAt DateTime @default(now())

  contract Contract @relation(fields: [contractId], references: [id])
  user User @relation(fields: [userId], references: [id])

  @@map("escrow_transactions")
}

model Payout {
  id String @id @default(uuid())
  userId String
  amount Float
  currency String @default("usd")
  stripeTransferId String?
  status String @default("pending") // pending, processing, paid, failed
  failureReason String?
  createdAt DateTime @default(now())
  paidAt DateTime?

  user User @relation(fields: [userId], references: [id])

  @@map("payouts")
}
```

### Backend Service Implementation

```javascript
// backend/src/services/escrowService.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Platform fee percentage (5%)
const PLATFORM_FEE_PERCENT = 0.05;

class EscrowService {
  /**
   * Create a contract with milestones
   */
  async createContract(jobId, clientId, freelancerId, milestones) {
    // Verify job exists and belongs to client
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job || job.clientId !== clientId) {
      throw new Error('Job not found or not authorized');
    }

    // Verify freelancer was selected (proposal accepted)
    const proposal = await prisma.proposal.findFirst({
      where: { jobId, freelancerId, status: 'accepted' },
    });
    if (!proposal) {
      throw new Error('No accepted proposal found for this freelancer');
    }

    // Calculate total amount
    const totalAmount = milestones.reduce((sum, m) => sum + m.amount, 0);

    // Create contract with milestones
    const contract = await prisma.contract.create({
      data: {
        jobId,
        clientId,
        freelancerId,
        totalAmount,
        status: 'pending',
        milestones: {
          create: milestones.map((m, index) => ({
            title: m.title,
            description: m.description,
            amount: m.amount,
            dueDate: m.dueDate ? new Date(m.dueDate) : null,
            status: 'pending',
          })),
        },
      },
      include: {
        milestones: true,
        job: true,
      },
    });

    return contract;
  }

  /**
   * Fund a milestone (client pays into escrow)
   */
  async fundMilestone(contractId, milestoneId, clientId, paymentMethodId) {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: { milestones: true },
    });

    if (!contract || contract.clientId !== clientId) {
      throw new Error('Contract not found or not authorized');
    }

    const milestone = contract.milestones.find((m) => m.id === milestoneId);
    if (!milestone || milestone.status !== 'pending') {
      throw new Error('Milestone not found or already funded');
    }

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(milestone.amount * 100), // Convert to cents
      currency: contract.currency,
      payment_method: paymentMethodId,
      confirmation_method: 'manual',
      confirm: true,
      metadata: {
        contractId,
        milestoneId,
        type: 'escrow_funding',
      },
    });

    // Create escrow transaction
    const transaction = await prisma.escrowTransaction.create({
      data: {
        contractId,
        milestoneId,
        userId: clientId,
        type: 'fund',
        amount: milestone.amount,
        stripePaymentIntentId: paymentIntent.id,
        status: paymentIntent.status === 'succeeded' ? 'completed' : 'pending',
      },
    });

    // Update milestone status
    if (paymentIntent.status === 'succeeded') {
      await prisma.milestone.update({
        where: { id: milestoneId },
        data: {
          status: 'funded',
          fundedAt: new Date(),
        },
      });

      // Update contract status if first milestone
      if (contract.status === 'pending') {
        await prisma.contract.update({
          where: { id: contractId },
          data: { status: 'active' },
        });
      }
    }

    return { paymentIntent, transaction };
  }

  /**
   * Freelancer submits milestone work
   */
  async submitMilestone(milestoneId, freelancerId, submission) {
    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: { contract: true },
    });

    if (!milestone || milestone.contract.freelancerId !== freelancerId) {
      throw new Error('Milestone not found or not authorized');
    }

    if (milestone.status !== 'funded') {
      throw new Error('Milestone must be funded before submission');
    }

    // Create submission
    const milestoneSubmission = await prisma.milestoneSubmission.create({
      data: {
        milestoneId,
        freelancerId,
        message: submission.message,
        attachments: submission.attachments || [],
        submittedAt: new Date(),
      },
    });

    // Update milestone status
    await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        status: 'submitted',
        submittedAt: new Date(),
      },
    });

    return milestoneSubmission;
  }

  /**
   * Client approves and releases milestone payment
   */
  async approveMilestone(milestoneId, clientId) {
    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        contract: {
          include: { freelancer: true },
        },
      },
    });

    if (!milestone || milestone.contract.clientId !== clientId) {
      throw new Error('Milestone not found or not authorized');
    }

    if (milestone.status !== 'submitted') {
      throw new Error('Milestone must be submitted before approval');
    }

    // Calculate platform fee
    const platformFee = milestone.amount * PLATFORM_FEE_PERCENT;
    const freelancerAmount = milestone.amount - platformFee;

    // Create transfer to freelancer (via Stripe Connect)
    let transfer = null;
    if (milestone.contract.freelancer.stripeConnectAccountId) {
      transfer = await stripe.transfers.create({
        amount: Math.round(freelancerAmount * 100),
        currency: milestone.contract.currency,
        destination: milestone.contract.freelancer.stripeConnectAccountId,
        metadata: {
          milestoneId,
          contractId: milestone.contractId,
          type: 'milestone_payment',
        },
      });
    }

    // Create escrow transaction
    await prisma.escrowTransaction.create({
      data: {
        contractId: milestone.contractId,
        milestoneId,
        userId: milestone.contract.freelancerId,
        type: 'release',
        amount: freelancerAmount,
        stripeTransferId: transfer?.id,
        status: transfer ? 'completed' : 'pending',
        metadata: { platformFee },
      },
    });

    // Update milestone status
    await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        status: 'released',
        approvedAt: new Date(),
        releasedAt: new Date(),
      },
    });

    // Check if all milestones are released
    const contract = await prisma.contract.findUnique({
      where: { id: milestone.contractId },
      include: { milestones: true },
    });

    const allReleased = contract.milestones.every((m) => m.status === 'released');
    if (allReleased) {
      await prisma.contract.update({
        where: { id: contract.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
        },
      });
    }

    return { milestone, transfer };
  }

  /**
   * Request revision (client rejects submission)
   */
  async requestRevision(milestoneId, clientId, feedback) {
    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: { contract: true },
    });

    if (!milestone || milestone.contract.clientId !== clientId) {
      throw new Error('Milestone not found or not authorized');
    }

    if (milestone.status !== 'submitted') {
      throw new Error('Milestone must be submitted to request revision');
    }

    // Update submission with feedback
    await prisma.milestoneSubmission.updateMany({
      where: { milestoneId },
      data: {
        clientFeedback: feedback,
        feedbackAt: new Date(),
      },
    });

    // Reset milestone to funded status
    await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        status: 'funded',
        submittedAt: null,
      },
    });

    return { message: 'Revision requested' };
  }

  /**
   * Initiate dispute
   */
  async initiateDispute(contractId, userId, reason) {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      throw new Error('Contract not found');
    }

    if (contract.clientId !== userId && contract.freelancerId !== userId) {
      throw new Error('Not authorized to dispute this contract');
    }

    // Update contract status
    await prisma.contract.update({
      where: { id: contractId },
      data: { status: 'disputed' },
    });

    // Hold all remaining funds
    const pendingMilestones = await prisma.milestone.findMany({
      where: {
        contractId,
        status: { in: ['funded', 'submitted'] },
      },
    });

    for (const milestone of pendingMilestones) {
      await prisma.escrowTransaction.create({
        data: {
          contractId,
          milestoneId: milestone.id,
          userId,
          type: 'dispute_hold',
          amount: milestone.amount,
          status: 'completed',
          metadata: { reason },
        },
      });

      await prisma.milestone.update({
        where: { id: milestone.id },
        data: { status: 'disputed' },
      });
    }

    return { message: 'Dispute initiated', contract };
  }
}

module.exports = new EscrowService();
```

### API Routes

```javascript
// backend/src/routes/contracts.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const escrowService = require('../services/escrowService');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Create contract from accepted proposal
router.post('/', protect, async (req, res) => {
  try {
    const { jobId, freelancerId, milestones } = req.body;
    const clientId = req.user.userId;

    const contract = await escrowService.createContract(jobId, clientId, freelancerId, milestones);

    res.status(201).json({
      message: 'Contract created successfully',
      contract,
    });
  } catch (err) {
    console.error('CreateContract error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Get contract details
router.get('/:id', protect, async (req, res) => {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id: req.params.id },
      include: {
        job: true,
        client: { select: { id: true, username: true, avatarUrl: true } },
        freelancer: { select: { id: true, username: true, avatarUrl: true } },
        milestones: {
          include: {
            submissions: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        escrowTransactions: true,
      },
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Authorization check
    if (contract.clientId !== req.user.userId && contract.freelancerId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json({ contract });
  } catch (err) {
    console.error('GetContract error:', err);
    res.status(500).json({ error: 'Failed to fetch contract' });
  }
});

// Fund milestone
router.post('/:contractId/milestones/:milestoneId/fund', protect, async (req, res) => {
  try {
    const { contractId, milestoneId } = req.params;
    const { paymentMethodId } = req.body;
    const clientId = req.user.userId;

    const result = await escrowService.fundMilestone(
      contractId,
      milestoneId,
      clientId,
      paymentMethodId
    );

    res.json({
      message: 'Milestone funded successfully',
      ...result,
    });
  } catch (err) {
    console.error('FundMilestone error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Submit milestone work
router.post('/milestones/:milestoneId/submit', protect, async (req, res) => {
  try {
    const { milestoneId } = req.params;
    const { message, attachments } = req.body;
    const freelancerId = req.user.userId;

    const submission = await escrowService.submitMilestone(milestoneId, freelancerId, {
      message,
      attachments,
    });

    res.status(201).json({
      message: 'Milestone submitted successfully',
      submission,
    });
  } catch (err) {
    console.error('SubmitMilestone error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Approve and release milestone
router.post('/milestones/:milestoneId/approve', protect, async (req, res) => {
  try {
    const { milestoneId } = req.params;
    const clientId = req.user.userId;

    const result = await escrowService.approveMilestone(milestoneId, clientId);

    res.json({
      message: 'Milestone approved and payment released',
      ...result,
    });
  } catch (err) {
    console.error('ApproveMilestone error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Request revision
router.post('/milestones/:milestoneId/revision', protect, async (req, res) => {
  try {
    const { milestoneId } = req.params;
    const { feedback } = req.body;
    const clientId = req.user.userId;

    const result = await escrowService.requestRevision(milestoneId, clientId, feedback);

    res.json(result);
  } catch (err) {
    console.error('RequestRevision error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Initiate dispute
router.post('/:contractId/dispute', protect, async (req, res) => {
  try {
    const { contractId } = req.params;
    const { reason } = req.body;
    const userId = req.user.userId;

    const result = await escrowService.initiateDispute(contractId, userId, reason);

    res.json(result);
  } catch (err) {
    console.error('InitiateDispute error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Get my contracts (as client or freelancer)
router.get('/me/contracts', protect, async (req, res) => {
  try {
    const userId = req.user.userId;
    const role = req.query.role || 'all'; // 'client', 'freelancer', 'all'

    const where = {};
    if (role === 'client') where.clientId = userId;
    else if (role === 'freelancer') where.freelancerId = userId;
    else where.OR = [{ clientId: userId }, { freelancerId: userId }];

    const contracts = await prisma.contract.findMany({
      where,
      include: {
        job: { select: { id: true, title: true } },
        client: { select: { id: true, username: true, avatarUrl: true } },
        freelancer: { select: { id: true, username: true, avatarUrl: true } },
        milestones: { select: { id: true, title: true, status: true, amount: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ contracts });
  } catch (err) {
    console.error('GetMyContracts error:', err);
    res.status(500).json({ error: 'Failed to fetch contracts' });
  }
});

module.exports = router;
```

### Frontend Components

```tsx
// apps/web/src/pages/ContractDetail.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { contractsAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Milestone {
  id: string;
  title: string;
  description: string;
  amount: number;
  status: string;
  dueDate: string | null;
  fundedAt: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
}

interface Contract {
  id: string;
  status: string;
  totalAmount: number;
  client: { id: string; username: string; avatarUrl: string };
  freelancer: { id: string; username: string; avatarUrl: string };
  job: { id: string; title: string };
  milestones: Milestone[];
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500',
  funded: 'bg-blue-500',
  submitted: 'bg-purple-500',
  approved: 'bg-green-500',
  released: 'bg-green-600',
  disputed: 'bg-red-500',
};

export default function ContractDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContract();
  }, [id]);

  const fetchContract = async () => {
    try {
      const res = await contractsAPI.getById(id!);
      setContract(res.data.contract);
    } catch (err) {
      console.error('Failed to fetch contract:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFundMilestone = async (milestoneId: string) => {
    // Implementation for funding milestone
  };

  const handleSubmitMilestone = async (milestoneId: string) => {
    // Implementation for submitting work
  };

  const handleApproveMilestone = async (milestoneId: string) => {
    try {
      await contractsAPI.approveMilestone(milestoneId);
      fetchContract();
    } catch (err) {
      console.error('Failed to approve milestone:', err);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!contract) return <div className="p-8">Contract not found</div>;

  const isClient = user?.id === contract.client.id;
  const isFreelancer = user?.id === contract.freelancer.id;

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{contract.job.title}</h1>
        <div className="flex items-center gap-4 mt-2">
          <Badge variant={contract.status === 'active' ? 'default' : 'secondary'}>
            {contract.status}
          </Badge>
          <span className="text-lg font-semibold">Total: ${contract.totalAmount.toFixed(2)}</span>
        </div>
      </div>

      <div className="grid gap-6">
        {contract.milestones.map((milestone, index) => (
          <Card key={milestone.id}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">
                  Milestone {index + 1}: {milestone.title}
                </CardTitle>
                <Badge className={statusColors[milestone.status]}>{milestone.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">{milestone.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold">${milestone.amount.toFixed(2)}</span>

                <div className="flex gap-2">
                  {isClient && milestone.status === 'pending' && (
                    <Button onClick={() => handleFundMilestone(milestone.id)}>
                      Fund Milestone
                    </Button>
                  )}

                  {isFreelancer && milestone.status === 'funded' && (
                    <Button onClick={() => handleSubmitMilestone(milestone.id)}>Submit Work</Button>
                  )}

                  {isClient && milestone.status === 'submitted' && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => {
                          /* Request revision */
                        }}
                      >
                        Request Revision
                      </Button>
                      <Button onClick={() => handleApproveMilestone(milestone.id)}>
                        Approve & Release
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

### Testing Checklist

- [ ] Contract creation with milestones
- [ ] Milestone funding via Stripe
- [ ] Freelancer submission flow
- [ ] Client approval and payment release
- [ ] Revision request flow
- [ ] Dispute initiation
- [ ] Contract completion when all milestones released
- [ ] Authorization checks (client/freelancer only)

---

## 🏃 Sprint 3.2: Enhanced Bid/Proposal System (Week 4-5)

### Objective

Enhance the existing proposal system with better management, client selection, and notifications.

### Current State

**Existing Features:**

- ✅ Submit proposal to job
- ✅ Get job proposals
- ✅ Get my proposals
- ❌ Accept/reject proposals
- ❌ Proposal notifications
- ❌ Proposal attachments
- ❌ Counter-offers

### Tasks Breakdown

#### Week 4: Backend Enhancements

| Day | Task                                 | Agent              | Deliverable                |
| --- | ------------------------------------ | ------------------ | -------------------------- |
| 16  | Add accept/reject proposal endpoints | @backend-architect | Updated `jobController.js` |
| 17  | Add proposal attachments support     | @backend-architect | File upload integration    |
| 18  | Create notification service          | @backend-architect | `notificationService.js`   |
| 19  | Add email notifications              | @backend-architect | Email templates            |
| 20  | Write proposal tests                 | @api-tester        | Proposal flow tests        |

#### Week 5: Frontend & Integration

| Day | Task                              | Agent               | Deliverable               |
| --- | --------------------------------- | ------------------- | ------------------------- |
| 21  | Build proposal management UI      | @frontend-developer | `ProposalsManagement.tsx` |
| 22  | Add proposal detail modal         | @frontend-developer | Proposal modal            |
| 23  | Implement real-time notifications | @frontend-developer | Notification bell         |
| 24  | Add in-app notification center    | @frontend-developer | `Notifications.tsx`       |
| 25  | E2E testing                       | @api-tester         | Full proposal flow        |

### Database Schema Changes

```prisma
// Add to Proposal model
model Proposal {
  // ... existing fields
  attachments String[]  // File URLs
  estimatedDays Int?    // Estimated delivery time
  clientMessage String? // Message from client (rejection reason, etc.)
  updatedAt DateTime @updatedAt
}

// New model for notifications
model Notification {
  id String @id @default(uuid())
  userId String
  type String  // proposal_received, proposal_accepted, proposal_rejected, milestone_submitted, etc.
  title String
  message String
  data Json?   // Additional data (jobId, proposalId, etc.)
  isRead Boolean @default(false)
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id])

  @@map("notifications")
}

// Add to User model
model User {
  // ... existing fields
  notifications Notification[]
}
```

### Backend Implementation

```javascript
// backend/src/controllers/proposalController.js (additions)

/**
 * Accept a proposal and create contract
 */
async function acceptProposal(req, res) {
  try {
    const { id } = req.params;
    const { milestones } = req.body; // Client defines milestones
    const clientId = req.user.userId;

    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: { job: true },
    });

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    if (proposal.job.clientId !== clientId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (proposal.status !== 'pending') {
      return res.status(400).json({ error: 'Proposal already processed' });
    }

    // Update proposal status
    await prisma.proposal.update({
      where: { id },
      data: { status: 'accepted' },
    });

    // Reject other proposals
    await prisma.proposal.updateMany({
      where: {
        jobId: proposal.jobId,
        id: { not: id },
        status: 'pending',
      },
      data: { status: 'rejected' },
    });

    // Update job status
    await prisma.job.update({
      where: { id: proposal.jobId },
      data: { status: 'in_progress' },
    });

    // Create notification for freelancer
    await prisma.notification.create({
      data: {
        userId: proposal.freelancerId,
        type: 'proposal_accepted',
        title: 'Proposal Accepted!',
        message: `Your proposal for "${proposal.job.title}" has been accepted.`,
        data: { jobId: proposal.jobId, proposalId: id },
      },
    });

    // Create notifications for rejected freelancers
    const rejectedProposals = await prisma.proposal.findMany({
      where: { jobId: proposal.jobId, status: 'rejected' },
    });

    for (const rp of rejectedProposals) {
      await prisma.notification.create({
        data: {
          userId: rp.freelancerId,
          type: 'proposal_rejected',
          title: 'Proposal Update',
          message: `Your proposal for "${proposal.job.title}" was not selected.`,
          data: { jobId: proposal.jobId },
        },
      });
    }

    res.json({
      message: 'Proposal accepted',
      proposalId: id,
      jobId: proposal.jobId,
    });
  } catch (err) {
    console.error('AcceptProposal error:', err);
    res.status(500).json({ error: 'Failed to accept proposal' });
  }
}

/**
 * Reject a proposal
 */
async function rejectProposal(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const clientId = req.user.userId;

    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: { job: true },
    });

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    if (proposal.job.clientId !== clientId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.proposal.update({
      where: { id },
      data: {
        status: 'rejected',
        clientMessage: reason || null,
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: proposal.freelancerId,
        type: 'proposal_rejected',
        title: 'Proposal Update',
        message: `Your proposal for "${proposal.job.title}" was not selected.`,
        data: { jobId: proposal.jobId, reason },
      },
    });

    res.json({ message: 'Proposal rejected' });
  } catch (err) {
    console.error('RejectProposal error:', err);
    res.status(500).json({ error: 'Failed to reject proposal' });
  }
}

module.exports = {
  // ... existing exports
  acceptProposal,
  rejectProposal,
};
```

### Notification Service

```javascript
// backend/src/services/notificationService.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class NotificationService {
  /**
   * Create a notification
   */
  async create(userId, type, title, message, data = null) {
    return prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data,
        isRead: false,
      },
    });
  }

  /**
   * Get unread notifications count
   */
  async getUnreadCount(userId) {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId, limit = 20, offset = 0) {
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({ where: { userId } }),
    ]);

    return { notifications, total, unread: await this.getUnreadCount(userId) };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, userId) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      throw new Error('Notification not found or not authorized');
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  /**
   * Mark all as read
   */
  async markAllAsRead(userId) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}

module.exports = new NotificationService();
```

### API Routes for Notifications

```javascript
// backend/src/routes/notifications.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const notificationService = require('../services/notificationService');

router.get('/', protect, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const result = await notificationService.getUserNotifications(
      req.user.userId,
      parseInt(limit),
      parseInt(offset)
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

router.get('/unread-count', protect, async (req, res) => {
  try {
    const count = await notificationService.getUnreadCount(req.user.userId);
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

router.patch('/:id/read', protect, async (req, res) => {
  try {
    await notificationService.markAsRead(req.params.id, req.user.userId);
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/mark-all-read', protect, async (req, res) => {
  try {
    await notificationService.markAllAsRead(req.user.userId);
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

module.exports = router;
```

---

## 🏃 Sprint 3.3: Stripe Connect Integration (Week 6-8)

### Objective

Implement Stripe Connect for seller payouts, allowing freelancers to withdraw earnings.

### Tasks Breakdown

#### Week 6: Stripe Connect Setup

| Day | Task                          | Agent               | Deliverable            |
| --- | ----------------------------- | ------------------- | ---------------------- |
| 26  | Create Stripe Connect account | @backend-architect  | Stripe dashboard setup |
| 27  | Add onboarding flow           | @backend-architect  | Onboarding endpoints   |
| 28  | Store Connect account ID      | @database-optimizer | User model update      |
| 29  | Handle webhook events         | @backend-architect  | Webhook handler        |
| 30  | Test onboarding flow          | @api-tester         | Onboarding tests       |

#### Week 7: Payout System

| Day | Task                        | Agent               | Deliverable          |
| --- | --------------------------- | ------------------- | -------------------- |
| 31  | Create payout service       | @backend-architect  | `payoutService.js`   |
| 32  | Implement payout scheduling | @backend-architect  | Cron job for payouts |
| 33  | Add payout history          | @backend-architect  | Payout tracking      |
| 34  | Build earnings dashboard    | @frontend-developer | `Earnings.tsx`       |
| 35  | Add payout settings UI      | @frontend-developer | Settings page        |

#### Week 8: Testing & Polish

| Day | Task               | Agent              | Deliverable       |
| --- | ------------------ | ------------------ | ----------------- |
| 36  | E2E payout testing | @api-tester        | Full payout tests |
| 37  | Error handling     | @backend-architect | Error scenarios   |
| 38  | Documentation      | @technical-writer  | Payout docs       |
| 39  | Security audit     | @security-engineer | Payout security   |
| 40  | Final deployment   | @devops-automator  | Production deploy |

### Database Schema Changes

```prisma
// Add to User model
model User {
  // ... existing fields
  stripeConnectAccountId String?
  stripeConnectOnboardingComplete Boolean @default(false)
  stripeConnectRequirements Json?  // Requirements from Stripe
}

// Payout model (already defined in Sprint 3.1)
model Payout {
  id String @id @default(uuid())
  userId String
  amount Float
  currency String @default("usd")
  stripeTransferId String?
  status String @default("pending")
  failureReason String?
  createdAt DateTime @default(now())
  paidAt DateTime?

  user User @relation(fields: [userId], references: [id])

  @@map("payouts")
}
```

### Stripe Connect Service

```javascript
// backend/src/services/stripeConnectService.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class StripeConnectService {
  /**
   * Create Stripe Connect account for user
   */
  async createConnectAccount(userId, email, country = 'US') {
    const account = await stripe.accounts.create({
      type: 'express',
      country,
      email,
      capabilities: {
        transfers: { requested: true },
        card_payments: { requested: true },
      },
      business_type: 'individual',
      metadata: { userId },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { stripeConnectAccountId: account.id },
    });

    return account;
  }

  /**
   * Generate onboarding link
   */
  async createOnboardingLink(accountId, userId) {
    const origin = process.env.FRONTEND_URL || 'https://devchain-app.vercel.app';

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/settings/payouts?refresh=true`,
      return_url: `${origin}/settings/payouts?success=true`,
      type: 'account_onboarding',
    });

    return accountLink;
  }

  /**
   * Get account status
   */
  async getAccountStatus(accountId) {
    const account = await stripe.accounts.retrieve(accountId);

    return {
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      requirements: account.requirements,
    };
  }

  /**
   * Create payout to connected account
   */
  async createPayout(userId, amount) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user?.stripeConnectAccountId) {
      throw new Error('Stripe Connect account not set up');
    }

    // Check account can receive payouts
    const status = await this.getAccountStatus(user.stripeConnectAccountId);
    if (!status.payoutsEnabled) {
      throw new Error('Payouts not enabled for this account');
    }

    // Create transfer
    const transfer = await stripe.transfers.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      destination: user.stripeConnectAccountId,
      metadata: { userId },
    });

    // Record payout
    const payout = await prisma.payout.create({
      data: {
        userId,
        amount,
        stripeTransferId: transfer.id,
        status: 'processing',
      },
    });

    return payout;
  }

  /**
   * Get available balance for user
   */
  async getAvailableBalance(userId) {
    // Calculate from completed milestones minus already paid out
    const releasedTransactions = await prisma.escrowTransaction.findMany({
      where: {
        userId,
        type: 'release',
        status: 'completed',
      },
      include: { contract: true },
    });

    const totalEarned = releasedTransactions.reduce((sum, t) => sum + t.amount, 0);

    const paidOut = await prisma.payout.findMany({
      where: {
        userId,
        status: { in: ['processing', 'paid'] },
      },
    });

    const totalPaid = paidOut.reduce((sum, p) => sum + p.amount, 0);

    return {
      available: totalEarned - totalPaid,
      totalEarned,
      totalPaid,
      pendingPayouts: paidOut.filter((p) => p.status === 'processing').length,
    };
  }

  /**
   * Handle Stripe webhook for Connect events
   */
  async handleWebhook(event) {
    switch (event.type) {
      case 'account.updated': {
        const account = event.data.object;
        const user = await prisma.user.findFirst({
          where: { stripeConnectAccountId: account.id },
        });

        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              stripeConnectOnboardingComplete: account.details_submitted,
              stripeConnectRequirements: account.requirements,
            },
          });
        }
        break;
      }

      case 'transfer.created': {
        const transfer = event.data.object;
        await prisma.payout.updateMany({
          where: { stripeTransferId: transfer.id },
          data: { status: 'processing' },
        });
        break;
      }

      case 'transfer.paid': {
        const transfer = event.data.object;
        await prisma.payout.updateMany({
          where: { stripeTransferId: transfer.id },
          data: { status: 'paid', paidAt: new Date() },
        });
        break;
      }

      case 'transfer.failed': {
        const transfer = event.data.object;
        await prisma.payout.updateMany({
          where: { stripeTransferId: transfer.id },
          data: {
            status: 'failed',
            failureReason: transfer.failure_message,
          },
        });
        break;
      }
    }
  }
}

module.exports = new StripeConnectService();
```

### API Routes for Payouts

```javascript
// backend/src/routes/payouts.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const stripeConnectService = require('../services/stripeConnectService');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Start Stripe Connect onboarding
router.post('/connect/onboard', protect, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    let accountId = user.stripeConnectAccountId;

    if (!accountId) {
      const account = await stripeConnectService.createConnectAccount(userId, user.email);
      accountId = account.id;
    }

    const accountLink = await stripeConnectService.createOnboardingLink(accountId, userId);

    res.json({ url: accountLink.url });
  } catch (err) {
    console.error('Onboard error:', err);
    res.status(500).json({ error: 'Failed to create onboarding link' });
  }
});

// Get Connect account status
router.get('/connect/status', protect, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user?.stripeConnectAccountId) {
      return res.json({
        connected: false,
        onboardingComplete: false,
      });
    }

    const status = await stripeConnectService.getAccountStatus(user.stripeConnectAccountId);

    res.json({
      connected: true,
      onboardingComplete: user.stripeConnectOnboardingComplete,
      ...status,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get status' });
  }
});

// Get available balance
router.get('/balance', protect, async (req, res) => {
  try {
    const balance = await stripeConnectService.getAvailableBalance(req.user.userId);
    res.json(balance);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get balance' });
  }
});

// Request payout
router.post('/request', protect, async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.userId;

    // Validate amount
    const balance = await stripeConnectService.getAvailableBalance(userId);
    if (amount > balance.available) {
      return res.status(400).json({
        error: 'Insufficient balance',
        available: balance.available,
      });
    }

    if (amount < 10) {
      return res.status(400).json({
        error: 'Minimum payout is $10',
      });
    }

    const payout = await stripeConnectService.createPayout(userId, amount);

    res.json({
      message: 'Payout initiated',
      payout,
    });
  } catch (err) {
    console.error('Payout error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Get payout history
router.get('/history', protect, async (req, res) => {
  try {
    const payouts = await prisma.payout.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    res.json({ payouts });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payout history' });
  }
});

module.exports = router;
```

### Frontend: Earnings Dashboard

```tsx
// apps/web/src/pages/Earnings.tsx
import { useState, useEffect } from 'react';
import { payoutsAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Balance {
  available: number;
  totalEarned: number;
  totalPaid: number;
  pendingPayouts: number;
}

interface Payout {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  paidAt: string | null;
}

export default function Earnings() {
  const { user } = useAuthStore();
  const [balance, setBalance] = useState<Balance | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [connectStatus, setConnectStatus] = useState<any>(null);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [balanceRes, historyRes, statusRes] = await Promise.all([
        payoutsAPI.getBalance(),
        payoutsAPI.getHistory(),
        payoutsAPI.getConnectStatus(),
      ]);

      setBalance(balanceRes.data);
      setPayouts(historyRes.data.payouts);
      setConnectStatus(statusRes.data);
    } catch (err) {
      console.error('Failed to fetch earnings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOnboard = async () => {
    try {
      const res = await payoutsAPI.onboard();
      window.location.href = res.data.url;
    } catch (err) {
      console.error('Failed to start onboarding:', err);
    }
  };

  const handlePayout = async () => {
    try {
      const amount = parseFloat(payoutAmount);
      await payoutsAPI.requestPayout(amount);
      setPayoutAmount('');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Payout failed');
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Earnings & Payouts</h1>

      {/* Stripe Connect Status */}
      {!connectStatus?.connected && (
        <Card className="mb-6 border-yellow-500">
          <CardHeader>
            <CardTitle>Set Up Payouts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Connect your bank account to receive payouts for your earnings.
            </p>
            <Button onClick={handleOnboard}>Set Up Stripe Connect</Button>
          </CardContent>
        </Card>
      )}

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-500">Available</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              ${balance?.available.toFixed(2) || '0.00'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-500">Total Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${balance?.totalEarned.toFixed(2) || '0.00'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-500">Total Paid Out</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${balance?.totalPaid.toFixed(2) || '0.00'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Request Payout */}
      {connectStatus?.onboardingComplete && balance?.available > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Request Payout</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="amount">Amount (min $10)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder="0.00"
                  max={balance?.available}
                />
              </div>
              <Button onClick={handlePayout} disabled={!payoutAmount}>
                Request Payout
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payout History */}
      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <p className="text-gray-500">No payouts yet</p>
          ) : (
            <div className="space-y-4">
              {payouts.map((payout) => (
                <div
                  key={payout.id}
                  className="flex justify-between items-center p-4 bg-gray-50 rounded"
                >
                  <div>
                    <p className="font-semibold">${payout.amount.toFixed(2)}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(payout.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      payout.status === 'paid'
                        ? 'bg-green-100 text-green-800'
                        : payout.status === 'processing'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {payout.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

### Testing Checklist

- [ ] Stripe Connect onboarding flow
- [ ] Account status retrieval
- [ ] Balance calculation accuracy
- [ ] Payout request validation
- [ ] Minimum payout enforcement ($10)
- [ ] Webhook handling for transfer events
- [ ] Payout history display
- [ ] Error handling for failed payouts

---

## 📊 Phase 3 Summary

### Deliverables

| Deliverable                 | Sprint | Location                            |
| --------------------------- | ------ | ----------------------------------- |
| Contract model & migrations | 3.1    | `prisma/schema.prisma`              |
| Escrow service              | 3.1    | `services/escrowService.js`         |
| Contract API routes         | 3.1    | `routes/contracts.js`               |
| Contract detail page        | 3.1    | `pages/ContractDetail.tsx`          |
| Proposal accept/reject      | 3.2    | `controllers/proposalController.js` |
| Notification service        | 3.2    | `services/notificationService.js`   |
| Notification API            | 3.2    | `routes/notifications.js`           |
| Stripe Connect service      | 3.3    | `services/stripeConnectService.js`  |
| Payout API routes           | 3.3    | `routes/payouts.js`                 |
| Earnings dashboard          | 3.3    | `pages/Earnings.tsx`                |

### Environment Variables Required

```env
# Backend .env additions
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=https://devchain-app.vercel.app
```

### Dependencies to Install

```bash
# Backend
cd backend
npm install stripe node-cron

# Frontend (if needed)
cd apps/web
# No new dependencies required
```

### Success Metrics

| Metric                      | Target             |
| --------------------------- | ------------------ |
| Escrow funding success rate | > 99%              |
| Payout processing time      | < 24 hours         |
| Notification delivery       | < 5 seconds        |
| Platform fee collection     | 5% per transaction |

---

## 🚨 Risk Register

| Risk                               | Probability | Impact | Mitigation                                    |
| ---------------------------------- | ----------- | ------ | --------------------------------------------- |
| Stripe Connect verification delays | Medium      | High   | Clear onboarding UI, support docs             |
| Payment disputes                   | Medium      | High   | Clear milestone definitions, evidence storage |
| Payout failures                    | Low         | Medium | Retry logic, failure notifications            |
| Notification delivery failures     | Low         | Medium | Fallback to email, retry queue                |
| Currency conversion issues         | Low         | Medium | Support USD only initially                    |

---

**Previous Phase:** Phase 2 - Blockchain & Web3
**Next Phase:** Phase 4 - Community & Reputation
