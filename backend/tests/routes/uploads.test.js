/**
 * Integration tests for file upload API endpoints
 *
 * NOTE: Uploads use multer middleware + Supabase Storage for actual
 * file operations. The Supabase client creates real HTTP connections,
 * so we mock `@supabase/supabase-js` to return a no-op client.
 */
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
  const supabaseInstance = {
    auth: mockAuth,
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({ error: null }),
        remove: jest.fn().mockResolvedValue({ error: null }),
        createSignedUrl: jest.fn().mockResolvedValue({
          data: { signedUrl: 'https://example.com/download/file.zip' },
          error: null,
        }),
        list: jest.fn().mockResolvedValue({ data: [], error: null }),
      })),
    },
  };
  return { createClient: jest.fn(() => supabaseInstance) };
});
jest.mock('@prisma/client', () => require('../helpers/prismaMock')());
const path = require('path');
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

const otherUserId = '660e8400-e29b-41d4-a716-446655440099';

const mockProduct = {
  id: '660e8400-e29b-41d4-a716-446655440001',
  title: 'React Dashboard Template',
  description: 'A beautiful template.',
  price: 2999,
  category: 'react-components',
  sellerId: mockUser.id,
  fileUrl: null,
  isActive: true,
  deletedAt: null,
  downloadsCount: 5,
  seller: { id: mockUser.id },
};

const mockProductWithFile = {
  ...mockProduct,
  fileUrl: 'devchain-files/products/660e8400/test-file.zip',
};

async function getAuthToken(userOverride) {
  const user = userOverride || mockUser;
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
  prisma.user.findUnique.mockReset();
  prisma.user.findUnique.mockResolvedValue(user);
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'test@test.com', password: 'password1' });
  return res.body.accessToken;
}

// ──────────────────────────────────────────────
// POST /api/v1/uploads/product/:productId
// ──────────────────────────────────────────────
describe('POST /api/v1/uploads/product/:productId', () => {
  beforeEach(() => {
    prisma.product.findUnique.mockReset();
    prisma.product.update.mockReset();
    prisma.user.findUnique.mockReset();
    prisma.user.findUnique.mockResolvedValue(mockUser);
    prisma.product.findUnique.mockResolvedValue(mockProduct);
    prisma.product.update.mockResolvedValue({ ...mockProduct, fileUrl: 'devchain-files/products/test.zip' });
  });

  it('should reject when not authenticated', async () => {
    const res = await request(app)
      .post(`/api/v1/uploads/product/${mockProduct.id}`)
      .attach('file', Buffer.from('test content'), 'test.zip');
    expect(res.status).toBe(401);
  });

  it('should reject when no file attached', async () => {
    const token = await getAuthToken();
    const res = await request(app)
      .post(`/api/v1/uploads/product/${mockProduct.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it('should reject non-existent product', async () => {
    prisma.product.findUnique.mockResolvedValue(null);
    const token = await getAuthToken();
    const res = await request(app)
      .post(`/api/v1/uploads/product/${mockProduct.id}`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('test content'), 'test.zip');
    expect(res.status).toBe(404);
  });

  it('should reject upload by non-owner', async () => {
    const token = await getAuthToken({ ...mockUser, id: otherUserId });
    const res = await request(app)
      .post(`/api/v1/uploads/product/${mockProduct.id}`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('test content'), 'test.zip');
    expect(res.status).toBe(403);
  });

  it('should reject disallowed file extension', async () => {
    const token = await getAuthToken();
    const res = await request(app)
      .post(`/api/v1/uploads/product/${mockProduct.id}`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('test content'), 'test.exe');
    expect(res.status).toBe(400);
  });

  it('should upload a file successfully when authenticated as owner', async () => {
    const token = await getAuthToken();
    const res = await request(app)
      .post(`/api/v1/uploads/product/${mockProduct.id}`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('test content'), 'test.zip');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.fileUrl).toBeDefined();
  });
});

// ──────────────────────────────────────────────
// GET /api/v1/uploads/product/:productId/download
// ──────────────────────────────────────────────
describe('GET /api/v1/uploads/product/:productId/download', () => {
  beforeEach(() => {
    prisma.product.findUnique.mockReset();
    prisma.order.findFirst.mockReset();
    prisma.product.update.mockReset();
    prisma.user.findUnique.mockReset();
    prisma.user.findUnique.mockResolvedValue(mockUser);
    prisma.product.findUnique.mockResolvedValue(mockProductWithFile);
    prisma.order.findFirst.mockResolvedValue({
      id: 'order-1',
      status: 'completed',
    });
    prisma.product.update.mockResolvedValue({ ...mockProductWithFile });
  });

  it('should reject when not authenticated', async () => {
    const res = await request(app)
      .get(`/api/v1/uploads/product/${mockProduct.id}/download`);
    expect(res.status).toBe(401);
  });

  it('should reject non-existent product', async () => {
    prisma.product.findUnique.mockResolvedValue(null);
    const token = await getAuthToken();
    const res = await request(app)
      .get(`/api/v1/uploads/product/${mockProduct.id}/download`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('should reject download when no file uploaded yet', async () => {
    prisma.product.findUnique.mockResolvedValue(mockProduct); // fileUrl: null
    const token = await getAuthToken();
    const res = await request(app)
      .get(`/api/v1/uploads/product/${mockProduct.id}/download`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('should reject download when not purchased (and not seller)', async () => {
    prisma.order.findFirst.mockResolvedValue(null);
    prisma.user.findUnique.mockResolvedValue({ ...mockUser, id: otherUserId });
    const token = await getAuthToken({ ...mockUser, id: otherUserId });
    const res = await request(app)
      .get(`/api/v1/uploads/product/${mockProduct.id}/download`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('should allow download for product seller', async () => {
    const token = await getAuthToken(); // mockUser IS the seller (sellerId: mockUser.id)
    const res = await request(app)
      .get(`/api/v1/uploads/product/${mockProduct.id}/download`)
      .set('Authorization', `Bearer ${token}`);
    // Controller redirects to signed URL
    expect(res.status).toBe(302);
  });

  it('should allow download for buyer with completed order', async () => {
    prisma.user.findUnique.mockResolvedValue({ ...mockUser, id: otherUserId });
    const token = await getAuthToken({ ...mockUser, id: otherUserId });
    prisma.order.findFirst.mockResolvedValue({ id: 'order-1', status: 'completed' });
    const res = await request(app)
      .get(`/api/v1/uploads/product/${mockProduct.id}/download`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(302);
  });
});

// ──────────────────────────────────────────────
// GET /api/v1/uploads/product/:productId/info
// ──────────────────────────────────────────────
describe('GET /api/v1/uploads/product/:productId/info', () => {
  beforeEach(() => {
    prisma.product.findUnique.mockReset();
    prisma.order.findFirst.mockReset();
    prisma.user.findUnique.mockReset();
    prisma.user.findUnique.mockResolvedValue(mockUser);
    prisma.product.findUnique.mockResolvedValue({
      id: mockProduct.id,
      fileUrl: 'devchain-files/products/test.zip',
      sellerId: mockUser.id,
      title: mockProduct.title,
    });
    prisma.order.findFirst.mockResolvedValue(null);
  });

  it('should return file info when authenticated as seller', async () => {
    const token = await getAuthToken();
    const res = await request(app)
      .get(`/api/v1/uploads/product/${mockProduct.id}/info`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.hasFile).toBe(true);
    expect(res.body.hasAccess).toBe(true);
    expect(res.body.isSeller).toBe(true);
  });

  it('should return file info when authenticated as buyer', async () => {
    prisma.user.findUnique.mockResolvedValue({ ...mockUser, id: otherUserId });
    prisma.order.findFirst.mockResolvedValue({ id: 'order-1', status: 'completed' });
    const token = await getAuthToken({ ...mockUser, id: otherUserId });
    const res = await request(app)
      .get(`/api/v1/uploads/product/${mockProduct.id}/info`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.hasAccess).toBe(true);
    expect(res.body.isSeller).toBe(false);
  });

  it('should return no access when not seller or buyer', async () => {
    prisma.user.findUnique.mockResolvedValue({ ...mockUser, id: otherUserId });
    prisma.order.findFirst.mockResolvedValue(null);
    const token = await getAuthToken({ ...mockUser, id: otherUserId });
    const res = await request(app)
      .get(`/api/v1/uploads/product/${mockProduct.id}/info`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.hasAccess).toBe(false);
  });

  it('should reject when not authenticated', async () => {
    const res = await request(app)
      .get(`/api/v1/uploads/product/${mockProduct.id}/info`);
    expect(res.status).toBe(401);
  });

  it('should reject non-existent product', async () => {
    prisma.product.findUnique.mockResolvedValue(null);
    const token = await getAuthToken();
    const res = await request(app)
      .get(`/api/v1/uploads/product/${mockProduct.id}/info`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
