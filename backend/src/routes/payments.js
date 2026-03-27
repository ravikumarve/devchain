const express = require('express');
const { createCheckoutSession, handleWebhook } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Create checkout session (protected)
router.post('/create-checkout-session', protect, createCheckoutSession);

// Stripe webhook (no auth needed)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

module.exports = router;
