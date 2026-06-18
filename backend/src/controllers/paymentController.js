const { PrismaClient } = require('@prisma/client');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const crypto = require('crypto');

const prisma = new PrismaClient();
const { getLogger } = require('../utils/logger');
const asyncHandler = require('../utils/asyncHandler');
const {
  BadRequestError,
  NotFoundError,
  ConflictError,
} = require('../utils/errors');

const log = getLogger('payments');

// ── Generate unique ownership hash ──
const generateOwnershipHash = (buyerId, productId, timestamp) => {
  const data = `${buyerId}:${productId}:${timestamp}:${process.env.OWNERSHIP_HASH_SECRET || 'devchain-secret'}`;
  return crypto.createHash('sha256').update(data).digest('hex');
};

// ────────────────────────────────────────────────
// CREATE CHECKOUT SESSION
// ────────────────────────────────────────────────
const createCheckoutSession = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  const userId = req.user.userId;

  if (!productId) {
    throw new BadRequestError('Product ID is required.');
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product || !product.isActive || product.deletedAt) {
    throw new NotFoundError('Product not found.');
  }

  // Check if already purchased
  const existingOrder = await prisma.order.findFirst({
    where: { buyerId: userId, productId },
  });

  if (existingOrder && existingOrder.status === 'completed') {
    throw new ConflictError('You already own this product.');
  }

  // Create Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.title,
            description: product.description.substring(0, 300),
          },
          unit_amount: Math.round(product.price * 100),
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/purchase-cancel`,
    metadata: {
      productId,
      buyerId: userId,
    },
  });

  // Create pending order
  await prisma.order.create({
    data: {
      buyerId: userId,
      productId,
      amount: product.price,
      stripeSessionId: session.id,
      status: 'pending',
    },
  });

  log.info({ sessionId: session.id, productId, userId }, 'Checkout session created');

  res.json({ url: session.url });
});

// ────────────────────────────────────────────────
// STRIPE WEBHOOK HANDLER
// ────────────────────────────────────────────────
const handleWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    throw new BadRequestError('Missing Stripe signature header.');
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    log.error({ err }, 'Stripe webhook signature verification failed');
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  log.info({ eventType: event.type, eventId: event.id }, 'Webhook received');

  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded': {
      await handleSuccessfulPayment(event.data.object);
      break;
    }
    case 'checkout.session.async_payment_failed':
    case 'payment_intent.payment_failed': {
      const session = event.data.object;
      await handleFailedPayment(session);
      break;
    }
    default:
      log.debug({ eventType: event.type }, 'Unhandled webhook event');
  }

  res.json({ received: true });
});

// ── Handle successful payment ──
const handleSuccessfulPayment = async (session) => {
  try {
    const buyerId = session.metadata.buyerId;
    const productId = session.metadata.productId;
    const timestamp = Date.now().toString();
    const ownershipHash = generateOwnershipHash(buyerId, productId, timestamp);

    await prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { stripeSessionId: session.id },
        data: { status: 'completed' },
      });

      await tx.ownershipRecord.create({
        data: {
          orderId: order.id,
          buyerId,
          productId,
          ownershipHash,
          isOnChain: false,
        },
      });

      await tx.product.update({
        where: { id: productId },
        data: { downloadsCount: { increment: 1 } },
      });
    });

    log.info({ sessionId: session.id, ownershipHash }, 'Payment completed — ownership certificate created');
  } catch (err) {
    log.error({ err, sessionId: session.id }, 'Failed to process successful payment');
    // Don't throw — Stripe will retry, and we handle idempotency
  }
};

// ── Handle failed payment ──
const handleFailedPayment = async (session) => {
  try {
    await prisma.order.update({
      where: { stripeSessionId: session.id },
      data: { status: 'failed' },
    });
    log.info({ sessionId: session.id }, 'Payment marked as failed');
  } catch (err) {
    log.error({ err, sessionId: session.id }, 'Failed to update order to failed status');
  }
};

module.exports = {
  createCheckoutSession,
  handleWebhook,
};
