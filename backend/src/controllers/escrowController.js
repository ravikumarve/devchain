const prisma = require('../config/database');
const { getLogger } = require('../utils/logger');
const asyncHandler = require('../utils/asyncHandler');
const {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} = require('../utils/errors');

const log = getLogger('escrow');

// ────────────────────────────────────────────────
// GET ESCROW FOR A PROPOSAL
// ────────────────────────────────────────────────
const getEscrow = asyncHandler(async (req, res) => {
  const { proposalId } = req.params;
  const userId = req.user.userId;

  const escrow = await prisma.escrow.findUnique({
    where: { proposalId },
    include: {
      proposal: {
        select: { id: true, proposedRate: true, status: true, freelancerId: true },
      },
      job: {
        select: { id: true, title: true, clientId: true },
      },
    },
  });

  if (!escrow) throw new NotFoundError('Escrow not found for this proposal.');
  if (escrow.clientId !== userId && escrow.freelancerId !== userId) {
    throw new ForbiddenError('You are not a party to this escrow.');
  }

  res.json({ escrow });
});

// ────────────────────────────────────────────────
// FUND ESCROW (Client deposits payment)
// ────────────────────────────────────────────────
const fundEscrow = asyncHandler(async (req, res) => {
  const { proposalId } = req.params;
  const clientId = req.user.userId;

  const escrow = await prisma.escrow.findUnique({
    where: { proposalId },
    include: { proposal: true, job: true },
  });

  if (!escrow) throw new NotFoundError('Escrow not found.');
  if (escrow.clientId !== clientId) throw new ForbiddenError('Only the client can fund this escrow.');
  if (escrow.status !== 'funding_required') {
    throw new BadRequestError(`Escrow is already in status: ${escrow.status}`);
  }

  // In production, this would create a Stripe PaymentIntent
  // For now, we simulate the funding and create a placeholder
  // The actual Stripe integration would redirect to checkout

  const updated = await prisma.escrow.update({
    where: { proposalId },
    data: {
      status: 'funded',
      fundedAt: new Date(),
      stripePaymentIntentId: `pi_simulated_${Date.now()}`,
    },
    include: {
      proposal: { select: { id: true, proposedRate: true } },
      job: { select: { id: true, title: true } },
    },
  });

  // Auto-create notification for freelancer
  await prisma.notification.create({
    data: {
      userId: escrow.freelancerId,
      type: 'escrow_funded',
      title: 'Payment Deposited',
      message: `Client has deposited $${escrow.amount} into escrow for "${escrow.job.title}"`,
      data: { escrowId: escrow.id, jobId: escrow.job.id, proposalId },
    },
  });

  log.info({ escrowId: escrow.id, amount: escrow.amount }, 'Escrow funded');

  res.json({
    message: 'Escrow funded successfully. You can now start working.',
    escrow: updated,
  });
});

// ────────────────────────────────────────────────
// MARK JOB COMPLETE (Freelancer requests release)
// ────────────────────────────────────────────────
const requestRelease = asyncHandler(async (req, res) => {
  const { proposalId } = req.params;
  const freelancerId = req.user.userId;

  const escrow = await prisma.escrow.findUnique({
    where: { proposalId },
    include: { job: true },
  });

  if (!escrow) throw new NotFoundError('Escrow not found.');
  if (escrow.freelancerId !== freelancerId) {
    throw new ForbiddenError('Only the freelancer can request release.');
  }
  if (escrow.status !== 'funded') {
    throw new BadRequestError(`Escrow must be funded before requesting release. Current status: ${escrow.status}`);
  }

  const updated = await prisma.escrow.update({
    where: { proposalId },
    data: { status: 'pending_release' },
    include: {
      proposal: { select: { id: true, proposedRate: true } },
      job: { select: { id: true, title: true } },
    },
  });

  // Auto-create notification for client
  await prisma.notification.create({
    data: {
      userId: escrow.clientId,
      type: 'release_requested',
      title: 'Work Complete — Review Required',
      message: `Freelancer has marked "${escrow.job.title}" as complete. Please review and release payment.`,
      data: { escrowId: escrow.id, jobId: escrow.job.id, proposalId },
    },
  });

  log.info({ escrowId: escrow.id }, 'Release requested by freelancer');

  res.json({
    message: 'Release requested. The client will review and release payment.',
    escrow: updated,
  });
});

// ────────────────────────────────────────────────
// RELEASE PAYMENT (Client approves & releases)
// ────────────────────────────────────────────────
const releasePayment = asyncHandler(async (req, res) => {
  const { proposalId } = req.params;
  const clientId = req.user.userId;

  const escrow = await prisma.escrow.findUnique({
    where: { proposalId },
    include: { job: true, proposal: { include: { freelancer: { select: { id: true, username: true } } } } },
  });

  if (!escrow) throw new NotFoundError('Escrow not found.');
  if (escrow.clientId !== clientId) throw new ForbiddenError('Only the client can release payment.');
  if (escrow.status !== 'pending_release') {
    throw new BadRequestError(`Escrow must be in pending_release status. Current: ${escrow.status}`);
  }

  // In production, this would transfer funds from platform to freelancer
  // For now, simulate the release

  const updated = await prisma.escrow.update({
    where: { proposalId },
    data: {
      status: 'released',
      releasedAt: new Date(),
      stripeTransferId: `tr_simulated_${Date.now()}`,
    },
    include: {
      proposal: { select: { id: true, proposedRate: true } },
      job: { select: { id: true, title: true } },
    },
  });

  // Also close the job
  await prisma.job.update({
    where: { id: escrow.jobId },
    data: { status: 'completed' },
  });

  // Auto-create notification for freelancer
  await prisma.notification.create({
    data: {
      userId: escrow.freelancerId,
      type: 'payment_released',
      title: 'Payment Released!',
      message: `$${escrow.amount} has been released to you for "${escrow.job.title}"`,
      data: { escrowId: escrow.id, jobId: escrow.job.id, proposalId },
    },
  });

  log.info({ escrowId: escrow.id, amount: escrow.amount }, 'Payment released to freelancer');

  res.json({
    message: 'Payment released successfully!',
    escrow: updated,
  });
});

// ────────────────────────────────────────────────
// GET MY ESCROWS (as client or freelancer)
// ────────────────────────────────────────────────
const getMyEscrows = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const escrows = await prisma.escrow.findMany({
    where: {
      OR: [{ clientId: userId }, { freelancerId: userId }],
    },
    include: {
      job: {
        select: { id: true, title: true, status: true },
      },
      proposal: {
        select: { id: true, proposedRate: true, deliveryDays: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ escrows });
});

module.exports = {
  getEscrow,
  fundEscrow,
  requestRelease,
  releasePayment,
  getMyEscrows,
};
