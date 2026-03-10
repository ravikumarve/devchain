const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ────────────────────────────────────────────────
// GET ALL JOBS (with search + filter)
// ────────────────────────────────────────────────
const getJobs = async (req, res) => {
  try {
    const {
      search,
      skill,
      minBudget,
      maxBudget,
      status = 'open',
      page = 1,
      limit = 12,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = { deletedAt: null };

    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (skill) where.skillsRequired = { has: skill.toLowerCase() };
    if (minBudget) where.budgetMin = { gte: parseFloat(minBudget) };
    if (maxBudget) where.budgetMax = { lte: parseFloat(maxBudget) };

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          client: {
            select: { id: true, username: true, avatarUrl: true, reputationScore: true }
          },
          _count: { select: { proposals: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.job.count({ where }),
    ]);

    res.json({
      jobs: jobs.map(job => ({
        id: job.id,
        title: job.title,
        description: job.description,
        budgetMin: job.budgetMin,
        budgetMax: job.budgetMax,
        skillsRequired: job.skillsRequired,
        status: job.status,
        deadline: job.deadline,
        createdAt: job.createdAt,
        client: job.client,
        proposalCount: job._count.proposals,
      })),
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      }
    });

  } catch (err) {
    console.error('GetJobs error:', err);
    res.status(500).json({ error: 'Failed to fetch jobs.' });
  }
};

// ────────────────────────────────────────────────
// GET SINGLE JOB
// ────────────────────────────────────────────────
const getJob = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        client: {
          select: { id: true, username: true, avatarUrl: true, reputationScore: true, bio: true }
        },
        proposals: {
          include: {
            freelancer: {
              select: { id: true, username: true, avatarUrl: true, reputationScore: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: { select: { proposals: true } }
      }
    });

    if (!job || job.deletedAt) {
      return res.status(404).json({ error: 'Job not found.' });
    }

    res.json({
      job: {
        id: job.id,
        title: job.title,
        description: job.description,
        budgetMin: job.budgetMin,
        budgetMax: job.budgetMax,
        skillsRequired: job.skillsRequired,
        status: job.status,
        deadline: job.deadline,
        createdAt: job.createdAt,
        client: job.client,
        proposals: job.proposals,
        proposalCount: job._count.proposals,
      }
    });

  } catch (err) {
    console.error('GetJob error:', err);
    res.status(500).json({ error: 'Failed to fetch job.' });
  }
};

// ────────────────────────────────────────────────
// CREATE JOB
// ────────────────────────────────────────────────
const createJob = async (req, res) => {
  try {
    const { title, description, budgetMin, budgetMax, skillsRequired, deadline } = req.body;
    const clientId = req.user.userId;

    // ── Validation ──
    if (!title || !description || !budgetMin || !budgetMax || !skillsRequired) {
      return res.status(400).json({ error: 'Title, description, budget range and skills are required.' });
    }
    if (title.length < 10 || title.length > 100) {
      return res.status(400).json({ error: 'Title must be between 10 and 100 characters.' });
    }
    if (description.length < 30) {
      return res.status(400).json({ error: 'Description must be at least 30 characters.' });
    }
    if (parseFloat(budgetMin) < 0 || parseFloat(budgetMax) < parseFloat(budgetMin)) {
      return res.status(400).json({ error: 'Invalid budget range.' });
    }
    if (!Array.isArray(skillsRequired) || skillsRequired.length === 0) {
      return res.status(400).json({ error: 'At least one skill is required.' });
    }

    const job = await prisma.job.create({
      data: {
        clientId,
        title: title.trim(),
        description: description.trim(),
        budgetMin: parseFloat(budgetMin),
        budgetMax: parseFloat(budgetMax),
        skillsRequired: skillsRequired.map(s => s.toLowerCase().trim()),
        deadline: deadline ? new Date(deadline) : null,
        status: 'open',
      },
      include: {
        client: {
          select: { id: true, username: true, avatarUrl: true }
        }
      }
    });

    res.status(201).json({
      message: 'Job posted successfully on DevChain!',
      job: {
        id: job.id,
        title: job.title,
        description: job.description,
        budgetMin: job.budgetMin,
        budgetMax: job.budgetMax,
        skillsRequired: job.skillsRequired,
        status: job.status,
        deadline: job.deadline,
        createdAt: job.createdAt,
        client: job.client,
      }
    });

  } catch (err) {
    console.error('CreateJob error:', err);
    res.status(500).json({ error: 'Failed to create job.' });
  }
};

// ────────────────────────────────────────────────
// SUBMIT PROPOSAL
// ────────────────────────────────────────────────
const submitProposal = async (req, res) => {
  try {
    const { id: jobId } = req.params;
    const { coverLetter, proposedRate } = req.body;
    const freelancerId = req.user.userId;

    if (!coverLetter || !proposedRate) {
      return res.status(400).json({ error: 'Cover letter and proposed rate are required.' });
    }
    if (coverLetter.length < 50) {
      return res.status(400).json({ error: 'Cover letter must be at least 50 characters.' });
    }

    // ── Check job exists and is open ──
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job || job.deletedAt) {
      return res.status(404).json({ error: 'Job not found.' });
    }
    if (job.status !== 'open') {
      return res.status(400).json({ error: 'This job is no longer accepting proposals.' });
    }

    // ── Can't apply to your own job ──
    if (job.clientId === freelancerId) {
      return res.status(400).json({ error: "You can't apply to your own job." });
    }

    // ── Check if already applied ──
    const existing = await prisma.proposal.findFirst({
      where: { jobId, freelancerId }
    });
    if (existing) {
      return res.status(409).json({ error: 'You have already submitted a proposal for this job.' });
    }

    const proposal = await prisma.proposal.create({
      data: {
        jobId,
        freelancerId,
        coverLetter: coverLetter.trim(),
        proposedRate: parseFloat(proposedRate),
        status: 'pending',
      },
      include: {
        freelancer: {
          select: { id: true, username: true, avatarUrl: true, reputationScore: true }
        }
      }
    });

    res.status(201).json({
      message: 'Proposal submitted successfully!',
      proposal: {
        id: proposal.id,
        jobId: proposal.jobId,
        coverLetter: proposal.coverLetter,
        proposedRate: proposal.proposedRate,
        status: proposal.status,
        createdAt: proposal.createdAt,
        freelancer: proposal.freelancer,
      }
    });

  } catch (err) {
    console.error('SubmitProposal error:', err);
    res.status(500).json({ error: 'Failed to submit proposal.' });
  }
};

// ────────────────────────────────────────────────
// GET MY JOBS (client view)
// ────────────────────────────────────────────────
const getMyJobs = async (req, res) => {
  try {
    const clientId = req.user.userId;

    const jobs = await prisma.job.findMany({
      where: { clientId, deletedAt: null },
      include: {
        _count: { select: { proposals: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      jobs: jobs.map(job => ({
        id: job.id,
        title: job.title,
        budgetMin: job.budgetMin,
        budgetMax: job.budgetMax,
        skillsRequired: job.skillsRequired,
        status: job.status,
        deadline: job.deadline,
        createdAt: job.createdAt,
        proposalCount: job._count.proposals,
      }))
    });

  } catch (err) {
    console.error('GetMyJobs error:', err);
    res.status(500).json({ error: 'Failed to fetch your jobs.' });
  }
};

// ────────────────────────────────────────────────
// GET MY PROPOSALS (freelancer view)
// ────────────────────────────────────────────────
const getMyProposals = async (req, res) => {
  try {
    const freelancerId = req.user.userId;

    const proposals = await prisma.proposal.findMany({
      where: { freelancerId },
      include: {
        job: {
          include: {
            client: {
              select: { id: true, username: true, avatarUrl: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      proposals: proposals.map(p => ({
        id: p.id,
        coverLetter: p.coverLetter,
        proposedRate: p.proposedRate,
        status: p.status,
        createdAt: p.createdAt,
        job: {
          id: p.job.id,
          title: p.job.title,
          budgetMin: p.job.budgetMin,
          budgetMax: p.job.budgetMax,
          status: p.job.status,
          client: p.job.client,
        }
      }))
    });

  } catch (err) {
    console.error('GetMyProposals error:', err);
    res.status(500).json({ error: 'Failed to fetch your proposals.' });
  }
};

// ────────────────────────────────────────────────
// CLOSE JOB
// ────────────────────────────────────────────────
const closeJob = async (req, res) => {
  try {
    const { id } = req.params;
    const clientId = req.user.userId;

    const job = await prisma.job.findUnique({ where: { id } });
    if (!job || job.deletedAt) {
      return res.status(404).json({ error: 'Job not found.' });
    }
    if (job.clientId !== clientId) {
      return res.status(403).json({ error: 'You can only close your own jobs.' });
    }

    await prisma.job.update({
      where: { id },
      data: { status: 'closed' }
    });

    res.json({ message: 'Job closed successfully.' });

  } catch (err) {
    console.error('CloseJob error:', err);
    res.status(500).json({ error: 'Failed to close job.' });
  }
};

module.exports = {
  getJobs,
  getJob,
  createJob,
  submitProposal,
  getMyJobs,
  getMyProposals,
  closeJob,
};
