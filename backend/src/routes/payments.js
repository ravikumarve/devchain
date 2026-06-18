const express = require('express');
const Joi = require('joi');
const { createCheckoutSession, handleWebhook } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

// ── Validation schemas ──
const checkoutSchema = {
  body: Joi.object({
    productId: Joi.string().uuid().required(),
  }),
};

// ── Routes ──
router.post('/create-checkout-session', protect, validate(checkoutSchema), createCheckoutSession);

// Stripe webhook must use raw body — no JSON parsing, no validation
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

module.exports = router;
