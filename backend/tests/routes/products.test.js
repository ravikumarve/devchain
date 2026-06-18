/**
 * Integration tests for products API endpoints
 *
 * NOTE: jest.mock factory creates a SINGLE shared prismaInstance so that
 * the controller's `new PrismaClient()` and the test's `new PrismaClient()`
 * return the SAME object. This lets us control mock state from tests.
 */
jest.mock('@prisma/client', () => {
  const mockModel = () => ({
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  });
  const prismaInstance = {
    user: mockModel(),
    product: mockModel(),
    order: mockModel(),
    ownershipRecord: mockModel(),
    job: mockModel(),
    proposal: mockModel(),
    review: mockModel(),
    $queryRaw: jest.fn(),
    $disconnect: jest.fn(),
    $on: jest.fn(),
    $connect: jest.fn(),
    $use: jest.fn(),
    $transaction: jest.fn((fn) => fn({})),
  };
  return { PrismaClient: jest.fn(() => prismaInstance) };
});
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

const mockProduct = {
  id: '660e8400-e29b-41d4-a716-446655440001',
  title: 'React Dashboard Template',
  description: 'A beautiful React dashboard template with dark mode and responsive design. This template includes 10+ pages and reusable components.',
  price: 2999,
  category: 'react-components',
  tags: ['react', 'typescript', 'dashboard'],
  fileKey: null,
  previewUrl: 'https://github.com/test/repo',
  sellerId: '550e8400-e29b-41d4-a716-446655440000',
  downloadsCount: 5,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  seller: { id: '550e8400-e29b-41d4-a716-446655440000', username: 'testuser' },
  reviews: [],
  _count: { orders: 0 },
};

const mockUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'test@test.com',
  passwordHash: 'hashed_password_placeholder',
  isActive: true,
};

async function getAuthToken(overrideMock) {
  const user = overrideMock || mockUser;
  authMock.signInWithPassword.mockReset();
  authMock.getUser.mockReset();
  authMock.signInWithPassword.mockResolvedValue({
    data: { session: { access_token: 'sb-token', refresh_token: 'sb-refresh' }, user: { id: user.id, email: user.email } },
    error: null,
  });
  authMock.getUser.mockResolvedValue({
    data: { user: { id: user.id, email: user.email } },
    error: null,
  });
  if (overrideMock) {
    prisma.user.findUnique.mockReset();
    prisma.user.findUnique.mockResolvedValue(overrideMock);
  }
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'test@test.com', password: 'password1' });
  return res.body.accessToken;
}

describe('GET /api/v1/products', () => {
  beforeEach(() => {
    prisma.product.findMany.mockReset();
    prisma.product.findMany.mockResolvedValue([mockProduct]);
  });

  it('should list all products', async () => {
    const res = await request(app).get('/api/v1/products');
    expect(res.status).toBe(200);
    expect(res.body.products).toBeDefined();
    expect(Array.isArray(res.body.products)).toBe(true);
    expect(res.body.products.length).toBe(1);
  });

  it('should accept category filter', async () => {
    const res = await request(app).get('/api/v1/products?category=react-components');
    expect(res.status).toBe(200);
  });

  it('should accept search query', async () => {
    const res = await request(app).get('/api/v1/products?search=react');
    expect(res.status).toBe(200);
  });

  it('should return empty array when no products', async () => {
    prisma.product.findMany.mockReset();
    prisma.product.findMany.mockResolvedValue([]);
    const res = await request(app).get('/api/v1/products');
    expect(res.status).toBe(200);
    expect(res.body.products).toEqual([]);
  });
});

describe('GET /api/v1/products/:id', () => {
  beforeEach(() => {
    prisma.product.findUnique.mockReset();
    prisma.review.aggregate.mockResolvedValue({ _avg: { rating: null } });
    prisma.review.findMany.mockResolvedValue([]);
  });

  it('should return a product by ID', async () => {
    prisma.product.findUnique.mockResolvedValue(mockProduct);
    const res = await request(app).get(`/api/v1/products/${mockProduct.id}`);
    expect(res.status).toBe(200);
    expect(res.body.product).toBeDefined();
    expect(res.body.product.id).toBe(mockProduct.id);
  });

  it('should return 404 for non-existent product', async () => {
    prisma.product.findUnique.mockResolvedValue(null);
    const res = await request(app).get(
      '/api/v1/products/660e8400-e29b-41d4-a716-446655440999'
    );
    expect(res.status).toBe(404);
  });

  it('should return 422 for invalid UUID', async () => {
    const res = await request(app).get('/api/v1/products/not-a-uuid');
    expect(res.status).toBe(422);
  });
});

describe('POST /api/v1/products', () => {
  beforeEach(() => {
    prisma.product.create.mockReset();
    prisma.user.findUnique.mockReset();
    prisma.user.findUnique.mockResolvedValue(mockUser);
  });

  it('should create a product when authenticated', async () => {
    prisma.product.create.mockResolvedValue(mockProduct);
    const token = await getAuthToken(mockUser);

    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'React Dashboard Template',
        description: 'A beautiful React dashboard template with dark mode and responsive design. This template includes 10+ pages and reusable components.',
        price: 29.99,
        category: 'react-components',
        tags: ['react', 'typescript', 'dashboard'],
      });

    expect(res.status).toBe(201);
    expect(res.body.product).toBeDefined();
  });

  it('should reject when not authenticated', async () => {
    const res = await request(app)
      .post('/api/v1/products')
      .send({
        title: 'Test Product',
        description: 'A test product description that is at least 20 characters long.',
        price: 9.99,
        category: 'other',
      });
    expect(res.status).toBe(401);
  });

  it('should reject missing title', async () => {
    const token = await getAuthToken(mockUser);
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        description: 'A test product description that is at least 20 characters long.',
        price: 9.99,
        category: 'other',
      });
    expect(res.status).toBe(422);
  });

  it('should reject short description', async () => {
    const token = await getAuthToken(mockUser);
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Test Product',
        description: 'Too short',
        price: 9.99,
        category: 'other',
      });
    expect(res.status).toBe(422);
  });

  it('should reject non-positive price', async () => {
    const token = await getAuthToken(mockUser);
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Test Product',
        description: 'A valid description that is at least 20 characters.',
        price: -5,
        category: 'other',
      });
    expect(res.status).toBe(422);
  });
});

describe('GET /api/v1/products/seller/me', () => {
  beforeEach(() => {
    prisma.product.findMany.mockReset();
    prisma.user.findUnique.mockReset();
    prisma.user.findUnique.mockResolvedValue(mockUser);
  });

  it('should return seller products when authenticated', async () => {
    prisma.product.findMany.mockResolvedValue([mockProduct]);
    const token = await getAuthToken(mockUser);

    const res = await request(app)
      .get('/api/v1/products/seller/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.products).toBeDefined();
  });

  it('should reject when not authenticated', async () => {
    const res = await request(app).get('/api/v1/products/seller/me');
    expect(res.status).toBe(401);
  });
});
