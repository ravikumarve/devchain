const prisma = require('../config/database');
const { getLogger } = require('../utils/logger');
const asyncHandler = require('../utils/asyncHandler');
const {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} = require('../utils/errors');

const log = getLogger('jobs');

// ────────────────────────────────────────────────
// GET ALL JOBS
// ────────────────────────────────────────────────
const getJobs = asyncHandler(async (req, res) => {
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
          select: { id: true, username: true, avatarUrl: true, reputationScore: true },
        },
        _count: { select: { proposals: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
    }),
    prisma.job.count({ where }),
  ]);

  res.json({
    jobs,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// ────────────────────────────────────────────────
// GET SINGLE JOB
// ────────────────────────────────────────────────
const getJob = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      client: {
        select: { id: true, username: true, avatarUrl: true, reputationScore: true, bio: true },
      },
      proposals: {
        include: {
          freelancer: {
            select: { id: true, username: true, avatarUrl: true, reputationScore: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      _count: { select: { proposals: true } },
    },
  });

  if (!job || job.deletedAt) {
    throw new NotFoundError('Job not found.');
  }

  res.json({ job });
});

// ────────────────────────────────────────────────
// CREATE JOB
// ────────────────────────────────────────────────
const createJob = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    budgetMin,
    budgetMax,
    skillsRequired,
    deadline,
  } = req.body;
  const clientId = req.user.userId;

  if (!title || !description || budgetMin === undefined || budgetMax === undefined) {
    throw new BadRequestError('Title, description, budgetMin and budgetMax are required.');
  }
  if (title.length < 5 || title.length > 200) {
    throw new BadRequestError('Title must be between 5 and 200 characters.');
  }
  if (description.length < 50) {
    throw new BadRequestError('Description must be at least 50 characters.');
  }
  if (parseFloat(budgetMin) < 0 || parseFloat(budgetMax) < 0) {
    throw new BadRequestError('Budget values cannot be negative.');
  }
  if (parseFloat(budgetMin) > parseFloat(budgetMax)) {
    throw new BadRequestError('Minimum budget cannot exceed maximum budget.');
  }

  const job = await prisma.job.create({
    data: {
      clientId,
      title: title.trim(),
      description: description.trim(),
      budgetMin: parseFloat(budgetMin),
      budgetMax: parseFloat(budgetMax),
      skillsRequired: Array.isArray(skillsRequired)
        ? skillsRequired.map(s => s.toLowerCase().trim())
        : [],
      deadline: deadline ? new Date(deadline) : null,
    },
    include: {
      client: {
        select: { id: true, username: true, avatarUrl: true, reputationScore: true },
      },
    },
  });

  log.info({ jobId: job.id, clientId }, 'Job created');

  res.status(201).json({
    message: 'Job posted successfully!',
    job,
  });
});

// ────────────────────────────────────────────────
// SUBMIT PROPOSAL
// ────────────────────────────────────────────────
const submitProposal = asyncHandler(async (req, res) => {
  const { id: jobId } = req.params;
  const { coverLetter, proposedRate } = req.body;
  const freelancerId = req.user.userId;

  if (!coverLetter || coverLetter.trim().length < 20) {
    throw new BadRequestError('Cover letter must be at least 20 characters.');
  }
  if (proposedRate === undefined || parseFloat(proposedRate) <= 0) {
    throw new BadRequestError('Proposed rate is required and must be positive.');
  }

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job || job.deletedAt) throw new NotFoundError('Job not found.');
  if (job.status !== 'open') throw new BadRequestError('This job is no longer accepting proposals.');
  if (job.clientId === freelancerId) {
    throw new BadRequestError("You can't submit a proposal to your own job.");
  }

  // Check for existing proposal
  const existing = await prisma.proposal.findFirst({
    where: { jobId, freelancerId },
  });
  if (existing) {
    throw new BadRequestError('You have already submitted a proposal for this job.');
  }

  const proposal = await prisma.proposal.create({
    data: {
      jobId,
      freelancerId,
      coverLetter: coverLetter.trim(),
      proposedRate: parseFloat(proposedRate),
    },
    include: {
      freelancer: {
        select: { id: true, username: true, avatarUrl: true, reputationScore: true },
      },
      job: {
        select: { id: true, title: true },
      },
    },
  });

  log.info({ jobId, freelancerId }, 'Proposal submitted');

  res.status(201).json({
    message: 'Proposal submitted successfully!',
    proposal,
  });
});

// ────────────────────────────────────────────────
// GET MY JOBS
// ────────────────────────────────────────────────
const getMyJobs = asyncHandler(async (req, res) => {
  const clientId = req.user.userId;

  const jobs = await prisma.job.findMany({
    where: { clientId, deletedAt: null },
    include: {
      _count: { select: { proposals: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ jobs });
});

// ────────────────────────────────────────────────
// GET MY PROPOSALS
// ────────────────────────────────────────────────
const getMyProposals = asyncHandler(async (req, res) => {
  const freelancerId = req.user.userId;

  const proposals = await prisma.proposal.findMany({
    where: { freelancerId },
    include: {
      job: {
        include: {
          client: {
            select: { id: true, username: true, avatarUrl: true, reputationScore: true },
          },
          _count: { select: { proposals: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ proposals });
});

// ────────────────────────────────────────────────
// CLOSE JOB
// ────────────────────────────────────────────────
const closeJob = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const clientId = req.user.userId;

  const job = await prisma.job.findUnique({ where: { id } });
  if (!job || job.deletedAt) throw new NotFoundError('Job not found.');
  if (job.clientId !== clientId) throw new ForbiddenError('You can only close your own jobs.');

  const updated = await prisma.job.update({
    where: { id },
    data: { status: 'closed' },
  });

  log.info({ jobId: id, clientId }, 'Job closed');

  res.json({ message: 'Job closed successfully.', job: updated });
});

module.exports = {
  getJobs,
  getJob,
  createJob,
  submitProposal,
  getMyJobs,
  getMyProposals,
  closeJob,
};
