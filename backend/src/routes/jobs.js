const express = require('express');
const router = express.Router();
const {
  getJobs,
  getJob,
  createJob,
  submitProposal,
  getMyJobs,
  getMyProposals,
  closeJob,
} = require('../controllers/jobController');
const { protect } = require('../middleware/auth');

// Public
router.get('/', getJobs);
router.get('/:id', getJob);

// Protected
router.post('/', protect, createJob);
router.post('/:id/proposals', protect, submitProposal);
router.get('/me/jobs', protect, getMyJobs);
router.get('/me/proposals', protect, getMyProposals);
router.patch('/:id/close', protect, closeJob);

module.exports = router;
