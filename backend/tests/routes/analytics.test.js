/**
 * Integration tests for analytics API endpoints
 */
jest.mock('@prisma/client', () => require('../helpers/prismaMock')());
jest.mock('@supabase/supabase-js', () => {
  const mockAuth = {
    getUser: jest.fn(),
    signInWithPassword: jest.fn(),
    refreshSession: jest.fn(),
    admin: {
      createUser: jest.fn(),
      deleteUser: jest.fn(),
    },
  };
  const supabaseInstance = { auth: mockAuth };
  return { createClient: jest.fn(() => supabaseInstance) };
});
const { PrismaClient } = require('@prisma/client');
const request = require('supertest');
const app = require('../../src/index');

const prisma = new PrismaClient();
const { createClient } = require('@supabase/supabase-js');
const authMock = createClient().auth;

const mockUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'test@test.com',
  username: 'testuser',
  passwordHash: 'hashed_password_placeholder',
  isActive: true,
};

const mockProduct = {
  id: '660e8400-e29b-41d4-a716-446655440001',
  title: 'React Dashboard Template',
  description: 'A beautiful React dashboard template.',
  price: 2999,
  category: 'react-components',
  sellerId: mockUser.id,
  isActive: true,
  deletedAt: null,
  downloadsCount: 5,
  createdAt: new Date().toISOString(),
  _count: { orders: 3 },
  orders: [{ createdAt: new Date(Date.now() - 86400000).toISOString() }], // 1 day ago
};

const mockOrder = {
  id: 'order-1',
  productId: mockProduct.id,
  amountPaid: 2999,
  status: 'completed',
  createdAt: new Date().toISOString(),
  product: { id: mockProduct.id, title: mockProduct.title },
};

async function getAuthToken() {
  authMock.signInWithPassword.mockReset();
  authMock.getUser.mockReset();
  authMock.signInWithPassword.mockResolvedValue({
    data: { session: { access_token: 'sb-token', refresh_token: 'sb-refresh' }, user: { id: mockUser.id, email: mockUser.email } },
    error: null,
  });
  authMock.getUser.mockResolvedValue({
    data: { user: { id: mockUser.id, email: mockUser.email } },
    error: null,
  });
  prisma.user.findUnique.mockReset();
  prisma.user.findUnique.mockResolvedValue(mockUser);
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'test@test.com', password: 'password1' });
  return res.body.accessToken;
}

// ──────────────────────────────────────────────
// GET /api/v1/analytics/seller
// ──────────────────────────────────────────────
describe('GET /api/v1/analytics/seller', () => {
  beforeEach(() => {
    prisma.order.findMany.mockReset();
    prisma.product.findMany.mockReset();
    prisma.user.findMany.mockReset();
    prisma.user.findUnique.mockReset();
    prisma.user.findUnique.mockResolvedValue(mockUser);

    // This month orders
    prisma.order.findMany.mockImplementation(async (args) => {
      if (args?.where?.createdAt?.gte && !args?.where?.createdAt?.lte) {
        // This month — include product details
        return [mockOrder, { ...mockOrder, id: 'order-2', amountPaid: 1500 }];
      }
      if (args?.where?.createdAt?.lte) {
        // Last month — no product details
        return [{ id: 'order-3', amountPaid: 5000 }];
      }
      return [];
    });

    prisma.product.findMany.mockResolvedValue([mockProduct]);

    prisma.user.findMany.mockResolvedValue([
      { id: mockUser.id, products: [{ orders: [{ amountPaid: 2999 }, { amountPaid: 1500 }] }] },
      { id: 'seller-2', products: [{ orders: [{ amountPaid: 1000 }] }] },
    ]);
  });

  it('should return seller analytics when authenticated', async () => {
    const token = await getAuthToken();
    const res = await request(app)
      .get('/api/v1/analytics/seller')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.summary).toBeDefined();
    expect(res.body.summary.totalSales).toBe(2);
    expect(res.body.summary.totalProducts).toBe(1);
    expect(res.body.products).toBeDefined();
    expect(Array.isArray(res.body.products)).toBe(true);
    expect(res.body.insights).toBeDefined();
    expect(res.body.ranking).toBeDefined();
    expect(res.body.ranking.tier).toBeDefined();
  });

  it('should reject when not authenticated', async () => {
    const res = await request(app).get('/api/v1/analytics/seller');
    expect(res.status).toBe(401);
  });

  it('should include comparison metrics', async () => {
    const token = await getAuthToken();
    const res = await request(app)
      .get('/api/v1/analytics/seller')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.summary.comparison).toBeDefined();
    expect(res.body.summary.comparison.revenue).toBeDefined();
    expect(res.body.summary.comparison.sales).toBeDefined();
  });

  it('should return empty product list when seller has no products', async () => {
    prisma.product.findMany.mockReset();
    prisma.product.findMany.mockResolvedValue([]);
    prisma.order.findMany.mockReset();
    prisma.order.findMany.mockResolvedValue([]);

    const token = await getAuthToken();
    const res = await request(app)
      .get('/api/v1/analytics/seller')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.summary.totalProducts).toBe(0);
    expect(res.body.summary.totalSales).toBe(0);
    expect(res.body.summary.totalRevenue).toBe(0);
  });
});
