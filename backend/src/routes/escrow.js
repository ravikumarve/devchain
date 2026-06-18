const express = require('express');
const Joi = require('joi');
const router = express.Router();
const {
  getEscrow,
  fundEscrow,
  requestRelease,
  releasePayment,
  getMyEscrows,
} = require('../controllers/escrowController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const proposalIdParam = {
  params: Joi.object({
    proposalId: Joi.string().uuid().required(),
  }),
};

router.get('/mine', protect, getMyEscrows);
router.get('/:proposalId', protect, validate(proposalIdParam), getEscrow);
router.post('/:proposalId/fund', protect, validate(proposalIdParam), fundEscrow);
router.post('/:proposalId/request-release', protect, validate(proposalIdParam), requestRelease);
router.post('/:proposalId/release', protect, validate(proposalIdParam), releasePayment);

module.exports = router;
