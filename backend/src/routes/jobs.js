const express = require('express');
const Joi = require('joi');
const router = express.Router();
const {
  getJobs,
  getJob,
  createJob,
  submitProposal,
  getMyJobs,
  getMyProposals,
  getJobProposals,
  acceptProposal,
  rejectProposal,
  closeJob,
} = require('../controllers/jobController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// ── Validation schemas ──
const createJobSchema = {
  body: Joi.object({
    title: Joi.string().trim().min(5).max(200).required(),
    description: Joi.string().trim().min(50).max(50000).required(),
    budgetMin: Joi.number().positive().precision(2).required(),
    budgetMax: Joi.number().positive().precision(2).required(),
    skillsRequired: Joi.array().items(Joi.string().trim().lowercase().max(50)).max(20).default([]),
    deadline: Joi.date().iso().min('now').optional().allow(null),
  }),
};

const proposalSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    coverLetter: Joi.string().trim().min(20).max(10000).required(),
    proposedRate: Joi.number().positive().precision(2).required(),
    deliveryDays: Joi.number().integer().min(1).max(365).optional().allow(null),
  }),
};

const proposalIdParam = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

const jobIdParam = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

// ── Routes ──
router.get('/', getJobs);
router.get('/me/jobs', protect, getMyJobs);
router.get('/me/proposals', protect, getMyProposals);
router.get('/:id', validate(jobIdParam), getJob);
router.post('/', protect, validate(createJobSchema), createJob);
router.post('/:id/proposals', protect, validate(proposalSchema), submitProposal);
router.get('/:id/proposals', protect, validate(jobIdParam), getJobProposals);
router.patch('/:id/close', protect, validate(jobIdParam), closeJob);

// Proposal management (by proposal ID)
router.patch('/proposals/:id/accept', protect, validate(proposalIdParam), acceptProposal);
router.patch('/proposals/:id/reject', protect, validate(proposalIdParam), rejectProposal);

module.exports = router;
