/**
 * Integration tests for ownership (purchase/certificate) API endpoints
 */
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

const otherUserId = '660e8400-e29b-41d4-a716-446655440099';

const mockProduct = {
  id: '660e8400-e29b-41d4-a716-446655440001',
  title: 'React Dashboard Template',
  description: 'A beautiful React dashboard template with dark mode and responsive design.',
  price: 2999,
  category: 'react-components',
  sellerId: otherUserId,
  isActive: true,
  deletedAt: null,
  downloadsCount: 5,
  createdAt: new Date().toISOString(),
  seller: { id: otherUserId, username: 'seller', avatarUrl: null, reputationScore: 0 },
};

const mockOwnershipRecord = {
  ownershipHash: 'abc123def456abc123def456abc123def456abc123def456abc123def456abcd',
  issuedAt: new Date().toISOString(),
  isOnChain: false,
  blockchainTx: null,
  order: {
    buyer: { id: mockUser.id, username: 'testuser', avatarUrl: null },
    product: {
      id: mockProduct.id,
      title: mockProduct.title,
      category: mockProduct.category,
      amountPaid: mockProduct.price,
      seller: { id: otherUserId, username: 'seller', avatarUrl: null },
    },
    createdAt: new Date().toISOString(),
  },
};

async function getAuthToken(userOverride) {
  const user = userOverride || mockUser;
  prisma.user.findUnique.mockReset();
  prisma.user.findUnique.mockResolvedValue(user);
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'test@test.com', password: 'password1' });
  return res.body.accessToken;
}

// ──────────────────────────────────────────────
// GET /api/v1/ownership/verify/:hash
// ──────────────────────────────────────────────
describe('GET /api/v1/ownership/verify/:hash', () => {
  beforeEach(() => {
    prisma.ownershipRecord.findUnique.mockReset();
    prisma.ownershipRecord.findUnique.mockResolvedValue(mockOwnershipRecord);
  });

  it('should verify a valid certificate', async () => {
    const res = await request(app)
      .get(`/api/v1/ownership/verify/${mockOwnershipRecord.ownershipHash}`);
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.certificate).toBeDefined();
    expect(res.body.certificate.ownershipHash).toBe(mockOwnershipRecord.ownershipHash);
  });

  it('should return invalid for non-existent hash', async () => {
    prisma.ownershipRecord.findUnique.mockResolvedValue(null);
    const res = await request(app)
      .get('/api/v1/ownership/verify/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(false);
  });

  it('should return 422 for invalid hash format (not hex)', async () => {
    const res = await request(app)
      .get('/api/v1/ownership/verify/not-a-valid-hash-format');
    expect(res.status).toBe(422);
  });

  it('should return 422 for wrong length hash', async () => {
    const res = await request(app)
      .get('/api/v1/ownership/verify/short');
    expect(res.status).toBe(422);
  });
});

// ──────────────────────────────────────────────
// POST /api/v1/ownership/purchase
// ──────────────────────────────────────────────
describe('POST /api/v1/ownership/purchase', () => {
  beforeEach(() => {
    prisma.product.findUnique.mockReset();
    prisma.order.findFirst.mockReset();
    prisma.$transaction.mockReset();
    prisma.user.findUnique.mockReset();
    prisma.user.findUnique.mockResolvedValue(mockUser);
    prisma.product.findUnique.mockResolvedValue(mockProduct);
    prisma.order.findFirst.mockResolvedValue(null);
    prisma.$transaction.mockImplementation(async (fn) => fn({
      order: {
        create: jest.fn().mockResolvedValue({
          id: 'order-123',
          productId: mockProduct.id,
          amountPaid: mockProduct.price,
          status: 'completed',
          createdAt: new Date().toISOString(),
        }),
      },
      ownershipRecord: {
        create: jest.fn().mockResolvedValue({
          ownershipHash: 'abc123',
          isOnChain: false,
        }),
      },
      product: {
        update: jest.fn().mockResolvedValue({}),
      },
    }));
  });

  it('should purchase a product when authenticated', async () => {
    const token = await getAuthToken();
    const res = await request(app)
      .post('/api/v1/ownership/purchase')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: mockProduct.id });
    expect(res.status).toBe(201);
    expect(res.body.message).toBeDefined();
    expect(res.body.order).toBeDefined();
    expect(res.body.certificate).toBeDefined();
    expect(res.body.certificate.ownershipHash).toBeDefined();
  });

  it('should reject purchase of own product', async () => {
    prisma.product.findUnique.mockResolvedValue({
      ...mockProduct,
      sellerId: mockUser.id,
    });
    const token = await getAuthToken();
    const res = await request(app)
      .post('/api/v1/ownership/purchase')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: mockProduct.id });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('BAD_REQUEST');
  });

  it('should return 409 for already-purchased product', async () => {
    prisma.order.findFirst.mockResolvedValue({
      id: 'existing-order',
      ownershipHash: 'existing-hash',
    });
    const token = await getAuthToken();
    const res = await request(app)
      .post('/api/v1/ownership/purchase')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: mockProduct.id });
    expect(res.status).toBe(409);
  });

  it('should reject purchase of non-existent product', async () => {
    prisma.product.findUnique.mockResolvedValue(null);
    const token = await getAuthToken();
    const res = await request(app)
      .post('/api/v1/ownership/purchase')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: mockProduct.id });
    expect(res.status).toBe(404);
  });

  it('should reject purchase of inactive product', async () => {
    prisma.product.findUnique.mockResolvedValue({ ...mockProduct, isActive: false });
    const token = await getAuthToken();
    const res = await request(app)
      .post('/api/v1/ownership/purchase')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: mockProduct.id });
    expect(res.status).toBe(404);
  });

  it('should reject when not authenticated', async () => {
    const res = await request(app)
      .post('/api/v1/ownership/purchase')
      .send({ productId: mockProduct.id });
    expect(res.status).toBe(401);
  });

  it('should reject missing productId', async () => {
    const token = await getAuthToken();
    const res = await request(app)
      .post('/api/v1/ownership/purchase')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(422);
  });
});

// ──────────────────────────────────────────────
// GET /api/v1/ownership/my-purchases
// ──────────────────────────────────────────────
describe('GET /api/v1/ownership/my-purchases', () => {
  beforeEach(() => {
    prisma.order.findMany.mockReset();
    prisma.user.findUnique.mockReset();
    prisma.user.findUnique.mockResolvedValue(mockUser);
    prisma.order.findMany.mockResolvedValue([
      {
        id: 'order-1',
        productId: mockProduct.id,
        amountPaid: mockProduct.price,
        ownershipHash: 'abc123',
        createdAt: new Date().toISOString(),
        product: {
          id: mockProduct.id,
          title: mockProduct.title,
          category: mockProduct.category,
          seller: { id: otherUserId, username: 'seller', avatarUrl: null },
        },
        ownershipRecord: { isOnChain: false },
      },
    ]);
  });

  it('should return my purchases when authenticated', async () => {
    const token = await getAuthToken();
    const res = await request(app)
      .get('/api/v1/ownership/my-purchases')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.purchases).toBeDefined();
    expect(Array.isArray(res.body.purchases)).toBe(true);
    expect(res.body.purchases.length).toBe(1);
    expect(res.body.purchases[0].product.title).toBe(mockProduct.title);
  });

  it('should reject when not authenticated', async () => {
    const res = await request(app).get('/api/v1/ownership/my-purchases');
    expect(res.status).toBe(401);
  });
});

// ──────────────────────────────────────────────
// GET /api/v1/ownership/my-sales
// ──────────────────────────────────────────────
describe('GET /api/v1/ownership/my-sales', () => {
  beforeEach(() => {
    prisma.order.findMany.mockReset();
    prisma.user.findUnique.mockReset();
    prisma.user.findUnique.mockResolvedValue(mockUser);
    prisma.order.findMany.mockResolvedValue([
      {
        id: 'order-1',
        amountPaid: 2999,
        ownershipHash: 'abc123',
        createdAt: new Date().toISOString(),
        product: { id: mockProduct.id, title: mockProduct.title, category: mockProduct.category },
        buyer: { id: mockUser.id, username: 'buyer', avatarUrl: null },
      },
      {
        id: 'order-2',
        amountPaid: 1500,
        ownershipHash: 'def456',
        createdAt: new Date().toISOString(),
        product: { id: 'prod-2', title: 'Another Template', category: 'ui-kits' },
        buyer: { id: 'buyer-2', username: 'buyer2', avatarUrl: null },
      },
    ]);
  });

  it('should return my sales when authenticated', async () => {
    const token = await getAuthToken();
    const res = await request(app)
      .get('/api/v1/ownership/my-sales')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.sales).toBeDefined();
    expect(Array.isArray(res.body.sales)).toBe(true);
    expect(res.body.sales.length).toBe(2);
    expect(res.body.totalSales).toBe(2);
    expect(res.body.totalRevenue).toBe(4499); // 2999 + 1500 cents
  });

  it('should reject when not authenticated', async () => {
    const res = await request(app).get('/api/v1/ownership/my-sales');
    expect(res.status).toBe(401);
  });
});
