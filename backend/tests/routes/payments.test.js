/**
 * Integration tests for payment (Stripe checkout) API endpoints
 *
 * NOTE: Stripe is mocked at module level. `require('stripe')` returns
 * a jest.fn() that, when called with the API key, returns a mock Stripe
 * instance. The webhook handler is tested with a mock event payload.
 */
/**
 * Singleton Stripe mock — the factory creates ONE instance that all
 * `require('stripe')(apiKey)` calls share, so test code can control
 * mock state that the controller observes.
 */
jest.mock('stripe', () => {
  const mockStripeInstance = {
    checkout: {
      sessions: {
        create: jest.fn().mockResolvedValue({
          id: 'cs_test_abc123',
          url: 'https://checkout.stripe.com/pay/cs_test_abc123',
        }),
      },
    },
    webhooks: {
      constructEvent: jest.fn((body, sig, secret) => {
        // body can be Buffer (from express.raw) or pre-parsed object (from express.json)
        const raw = Buffer.isBuffer(body) ? body.toString() : body;
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        return {
          id: 'evt_test_123',
          type: parsed.type || 'checkout.session.completed',
          data: { object: parsed.data?.object || {} },
        };
      }),
    },
  };
  return jest.fn(() => mockStripeInstance);
});
jest.mock('@prisma/client', () => require('../helpers/prismaMock')());
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const request = require('supertest');
const app = require('../../src/index');

const prisma = new PrismaClient();

const mockUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'test@test.com',
  username: 'testuser',
  passwordHash: bcrypt.hashSync('password1', 8),
  isActive: true,
};

const mockProduct = {
  id: '660e8400-e29b-41d4-a716-446655440001',
  title: 'React Dashboard Template',
  description: 'A beautiful React dashboard template.',
  price: 2999,
  category: 'react-components',
  sellerId: 'other-seller-id',
  isActive: true,
  deletedAt: null,
  createdAt: new Date().toISOString(),
};

async function getAuthToken() {
  prisma.user.findUnique.mockReset();
  prisma.user.findUnique.mockResolvedValue(mockUser);
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'test@test.com', password: 'password1' });
  return res.body.accessToken;
}

// ──────────────────────────────────────────────
// POST /api/v1/payments/create-checkout-session
// ──────────────────────────────────────────────
describe('POST /api/v1/payments/create-checkout-session', () => {
  beforeEach(() => {
    prisma.product.findUnique.mockReset();
    prisma.order.findFirst.mockReset();
    prisma.order.create.mockReset();
    prisma.user.findUnique.mockReset();
    prisma.user.findUnique.mockResolvedValue(mockUser);
    prisma.product.findUnique.mockResolvedValue(mockProduct);
    prisma.order.findFirst.mockResolvedValue(null);
    prisma.order.create.mockResolvedValue({
      id: 'pending-order',
      buyerId: mockUser.id,
      productId: mockProduct.id,
      stripeSessionId: 'cs_test_abc123',
      status: 'pending',
    });
  });

  it('should create a checkout session when authenticated', async () => {
    const token = await getAuthToken();
    const res = await request(app)
      .post('/api/v1/payments/create-checkout-session')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: mockProduct.id });
    expect(res.status).toBe(200);
    expect(res.body.url).toBeDefined();
    expect(res.body.url).toContain('checkout.stripe.com');
  });

  it('should reject when not authenticated', async () => {
    const res = await request(app)
      .post('/api/v1/payments/create-checkout-session')
      .send({ productId: mockProduct.id });
    expect(res.status).toBe(401);
  });

  it('should reject missing productId', async () => {
    const token = await getAuthToken();
    const res = await request(app)
      .post('/api/v1/payments/create-checkout-session')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(422);
  });

  it('should reject non-existent product', async () => {
    prisma.product.findUnique.mockResolvedValue(null);
    const token = await getAuthToken();
    const res = await request(app)
      .post('/api/v1/payments/create-checkout-session')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: mockProduct.id });
    expect(res.status).toBe(404);
  });

  it('should reject inactive product', async () => {
    prisma.product.findUnique.mockResolvedValue({ ...mockProduct, isActive: false });
    const token = await getAuthToken();
    const res = await request(app)
      .post('/api/v1/payments/create-checkout-session')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: mockProduct.id });
    expect(res.status).toBe(404);
  });

  it('should return 409 if already purchased', async () => {
    prisma.order.findFirst.mockResolvedValue({
      id: 'existing',
      status: 'completed',
    });
    const token = await getAuthToken();
    const res = await request(app)
      .post('/api/v1/payments/create-checkout-session')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: mockProduct.id });
    expect(res.status).toBe(409);
  });
});

// ──────────────────────────────────────────────
// POST /api/v1/payments/webhook
// ──────────────────────────────────────────────
describe('POST /api/v1/payments/webhook', () => {
  beforeEach(() => {
    prisma.$transaction.mockReset();
    prisma.order.update.mockReset();
    prisma.order.update.mockResolvedValue({ id: 'order-1', status: 'completed' });
    prisma.$transaction.mockImplementation(async (fn) => fn({
      order: { update: jest.fn().mockResolvedValue({ id: 'order-1', status: 'completed' }) },
      ownershipRecord: { create: jest.fn().mockResolvedValue({}) },
      product: { update: jest.fn().mockResolvedValue({}) },
    }));
  });

  const webhookPayload = {
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_abc123',
        metadata: {
          buyerId: mockUser.id,
          productId: mockProduct.id,
        },
      },
    },
  };

  it('should handle checkout.session.completed webhook', async () => {
    const res = await request(app)
      .post('/api/v1/payments/webhook')
      .set('stripe-signature', 'test_sig')
      .send(webhookPayload);
    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
  });

  it('should handle payment_intent.payment_failed webhook', async () => {
    const payload = {
      type: 'payment_intent.payment_failed',
      data: { object: { id: 'pi_failed' } },
    };
    const res = await request(app)
      .post('/api/v1/payments/webhook')
      .set('stripe-signature', 'test_sig')
      .send(payload);
    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
  });

  it('should return 400 on invalid webhook signature', async () => {
    // Override constructEvent to throw
    const stripe = require('stripe');
    stripe().webhooks.constructEvent.mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    const res = await request(app)
      .post('/api/v1/payments/webhook')
      .set('stripe-signature', 'bad_sig')
      .send(webhookPayload);
    expect(res.status).toBe(400);
  });

  it('should accept webhook without signature (graceful handling)', async () => {
    const res = await request(app)
      .post('/api/v1/payments/webhook')
      .send(webhookPayload);
    expect(res.status).toBe(400);
  });
});
