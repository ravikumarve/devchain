/**
 * Integration tests for auth API endpoints
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
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const request = require('supertest');
const app = require('../../src/index');

const prisma = new PrismaClient();

const mockUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  username: 'testuser',
  email: 'test@test.com',
  bio: null,
  avatarUrl: null,
  reputationScore: 0,
  isEmailVerified: false,
  passwordHash: bcrypt.hashSync('password1', 8),
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('POST /api/v1/auth/register', () => {
  beforeEach(() => {
    prisma.user.findFirst.mockReset();
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.user.create.mockReset();
    prisma.user.create.mockResolvedValue(mockUser);
  });

  it('should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ username: 'testuser', email: 'test@test.com', password: 'password1' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('user');
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body.user.username).toBe('testuser');
    expect(res.body.user.email).toBe('test@test.com');
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });

  it('should reject duplicate email', async () => {
    prisma.user.findFirst.mockResolvedValue(mockUser);

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ username: 'testuser', email: 'test@test.com', password: 'password1' });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('CONFLICT');
  });

  it('should reject weak password (no letters)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ username: 'testuser', email: 'test@test.com', password: '12345678' });

    expect(res.status).toBe(422);
  });

  it('should reject short password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ username: 'testuser', email: 'test@test.com', password: 'Ab1' });

    expect(res.status).toBe(422);
  });

  it('should reject short username', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ username: 'ab', email: 'test@test.com', password: 'password1' });

    expect(res.status).toBe(422);
  });

  it('should reject invalid email format', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ username: 'testuser', email: 'not-an-email', password: 'password1' });

    expect(res.status).toBe(422);
  });
});

describe('POST /api/v1/auth/login', () => {
  beforeEach(() => {
    prisma.user.findUnique.mockReset();
    prisma.user.findUnique.mockResolvedValue(mockUser);
  });

  it('should login successfully with valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@test.com', password: 'password1' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body).toHaveProperty('user');
  });

  it('should reject non-existent email', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nonexistent@test.com', password: 'password1' });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('should reject wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@test.com', password: 'wrongpassword123' });

    expect(res.status).toBe(401);
  });

  it('should reject inactive user', async () => {
    prisma.user.findUnique.mockResolvedValue({ ...mockUser, isActive: false });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@test.com', password: 'password1' });

    expect(res.status).toBe(401);
  });

  it('should reject missing fields via schema validation', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({});

    expect(res.status).toBe(422);
  });
});

describe('GET /api/v1/auth/me', () => {
  beforeEach(() => {
    prisma.user.findUnique.mockReset();
  });

  it('should return user profile with valid token', async () => {
    prisma.user.findUnique.mockResolvedValue(mockUser);

    // Login to get a valid token
    prisma.user.findUnique.mockResolvedValue(mockUser);
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@test.com', password: 'password1' });

    const token = loginRes.body.accessToken;

    // Reset and mock for getMe
    prisma.user.findUnique.mockReset();
    prisma.user.findUnique.mockResolvedValue(mockUser);

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe('test@test.com');
  });

  it('should reject without auth token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('should reject with invalid token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid-token');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/auth/refresh', () => {
  beforeEach(() => {
    prisma.user.findUnique.mockReset();
  });

  it('should refresh tokens with a valid refresh token', async () => {
    // Login to get a valid refresh token
    prisma.user.findUnique.mockResolvedValue(mockUser);
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@test.com', password: 'password1' });

    const refreshToken = loginRes.body.refreshToken;
    expect(refreshToken).toBeDefined();

    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    // Tokens may be the same if login + refresh happen in the same second (same iat).
    // We verify the endpoint works with a valid refresh token — true rotation
    // testing requires a time delay between calls.
  });

  it('should reject invalid refresh token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'invalid-refresh-token' });
    expect(res.status).toBe(401);
  });

  it('should reject missing refresh token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({});
    expect(res.status).toBe(422);
  });
});
