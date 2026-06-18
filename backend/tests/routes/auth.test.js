/**
 * Integration tests for auth API endpoints (Supabase Auth)
 *
 * NOTE: Both @prisma/client and @supabase/supabase-js are mocked so that
 * controllers and middleware use the SAME shared instances as the test.
 * This lets us control mock state from each test case.
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
const { createClient } = require('@supabase/supabase-js');
const request = require('supertest');
const app = require('../../src/index');

const prisma = new PrismaClient();
const supabaseMock = createClient();
const authMock = supabaseMock.auth;

const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440000';
const TEST_EMAIL = 'test@test.com';

const mockUser = {
  id: TEST_USER_ID,
  username: 'testuser',
  email: TEST_EMAIL,
  bio: null,
  avatarUrl: null,
  reputationScore: 0,
  isEmailVerified: false,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockAuthUser = {
  id: TEST_USER_ID,
  email: TEST_EMAIL,
  user_metadata: { username: 'testuser' },
};

const mockSession = {
  access_token: 'sb-access-token',
  refresh_token: 'sb-refresh-token',
};

beforeEach(() => {
  // Reset all mocks
  prisma.user.findFirst.mockReset();
  prisma.user.findUnique.mockReset();
  prisma.user.create.mockReset();
  authMock.admin.createUser.mockReset();
  authMock.admin.deleteUser.mockReset();
  authMock.signInWithPassword.mockReset();
  authMock.getUser.mockReset();
  authMock.refreshSession.mockReset();
});

// ────────────────────────────────────────────
// REGISTER
// ────────────────────────────────────────────
describe('POST /api/v1/auth/register', () => {
  beforeEach(() => {
    // Default: no existing user, supabase creates user, auto-login works
    prisma.user.findFirst.mockResolvedValue(null);
    authMock.admin.createUser.mockResolvedValue({
      data: { user: mockAuthUser },
      error: null,
    });
    prisma.user.create.mockResolvedValue(mockUser);
    authMock.signInWithPassword.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });
  });

  it('should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ username: 'testuser', email: TEST_EMAIL, password: 'password1' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('user');
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body.user.username).toBe('testuser');
    expect(res.body.user.email).toBe(TEST_EMAIL);
    expect(res.body.user).not.toHaveProperty('passwordHash');
    // Verify Supabase Auth was called
    expect(authMock.admin.createUser).toHaveBeenCalledWith(
      expect.objectContaining({ email: expect.any(String), password: expect.any(String) })
    );
  });

  it('should reject duplicate email', async () => {
    prisma.user.findFirst.mockResolvedValue(mockUser);

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ username: 'testuser', email: TEST_EMAIL, password: 'password1' });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('CONFLICT');
  });

  it('should reject weak password (no letters)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ username: 'testuser', email: TEST_EMAIL, password: '12345678' });

    expect(res.status).toBe(422);
  });

  it('should reject short password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ username: 'testuser', email: TEST_EMAIL, password: 'Ab1' });

    expect(res.status).toBe(422);
  });

  it('should reject short username', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ username: 'ab', email: TEST_EMAIL, password: 'password1' });

    expect(res.status).toBe(422);
  });

  it('should reject invalid email format', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ username: 'testuser', email: 'not-an-email', password: 'password1' });

    expect(res.status).toBe(422);
  });

  it('should handle Supabase Auth registration failure', async () => {
    authMock.admin.createUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'User already registered' },
    });

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ username: 'testuser', email: TEST_EMAIL, password: 'password1' });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('CONFLICT');
  });

  it('should handle profile creation failure with rollback', async () => {
    // Supabase creates the user
    authMock.admin.createUser.mockResolvedValue({
      data: { user: mockAuthUser },
      error: null,
    });
    authMock.admin.deleteUser.mockResolvedValue({ data: null, error: null });
    // But Prisma profile creation fails
    prisma.user.create.mockRejectedValue(new Error('DB constraint'));

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ username: 'testuser', email: TEST_EMAIL, password: 'password1' });

    expect(res.status).toBe(400);
    expect(authMock.admin.deleteUser).toHaveBeenCalledWith(TEST_USER_ID);
  });

  it('should still register if auto-login fails', async () => {
    // supabase creates the user
    authMock.admin.createUser.mockResolvedValue({
      data: { user: mockAuthUser },
      error: null,
    });
    prisma.user.create.mockResolvedValue(mockUser);
    // But auto-login fails
    authMock.signInWithPassword.mockResolvedValue({
      data: { session: null },
      error: { message: 'Unexpected error' },
    });

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ username: 'testuser', email: TEST_EMAIL, password: 'password1' });

    // Should still 201 with user data but signal auto-login failed
    expect(res.status).toBe(201);
    expect(res.body.autoLoginFailed).toBe(true);
    expect(res.body.user).toBeDefined();
  });
});

// ────────────────────────────────────────────
// LOGIN
// ────────────────────────────────────────────
describe('POST /api/v1/auth/login', () => {
  beforeEach(() => {
    // Default: valid credentials
    authMock.signInWithPassword.mockResolvedValue({
      data: { session: mockSession, user: mockAuthUser },
      error: null,
    });
    prisma.user.findUnique.mockResolvedValue(mockUser);
  });

  it('should login successfully with valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: TEST_EMAIL, password: 'password1' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe(TEST_EMAIL);
  });

  it('should reject non-existent email', async () => {
    authMock.signInWithPassword.mockResolvedValue({
      data: { session: null, user: null },
      error: { message: 'Invalid login credentials' },
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nonexistent@test.com', password: 'password1' });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('should reject wrong password', async () => {
    authMock.signInWithPassword.mockResolvedValue({
      data: { session: null, user: null },
      error: { message: 'Invalid login credentials' },
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: TEST_EMAIL, password: 'wrongpassword123' });

    expect(res.status).toBe(401);
  });

  it('should reject inactive user', async () => {
    // Supabase auth succeeds
    authMock.signInWithPassword.mockResolvedValue({
      data: { session: mockSession, user: mockAuthUser },
      error: null,
    });
    // But profile is inactive
    prisma.user.findUnique.mockResolvedValue({ ...mockUser, isActive: false });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: TEST_EMAIL, password: 'password1' });

    expect(res.status).toBe(401);
  });

  it('should reject missing fields via schema validation', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({});

    expect(res.status).toBe(422);
  });
});

// ────────────────────────────────────────────
// GET ME
// ────────────────────────────────────────────
describe('GET /api/v1/auth/me', () => {
  beforeEach(() => {
    authMock.getUser.mockReset();
    prisma.user.findUnique.mockReset();
  });

  it('should return user profile with valid token', async () => {
    authMock.getUser.mockResolvedValue({
      data: { user: { id: TEST_USER_ID, email: TEST_EMAIL } },
      error: null,
    });
    prisma.user.findUnique.mockResolvedValue(mockUser);

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(TEST_EMAIL);
  });

  it('should reject without auth token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('should reject with invalid token', async () => {
    authMock.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid token' },
    });

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid-token');
    expect(res.status).toBe(401);
  });
});

// ────────────────────────────────────────────
// REFRESH TOKEN
// ────────────────────────────────────────────
describe('POST /api/v1/auth/refresh', () => {
  beforeEach(() => {
    authMock.refreshSession.mockReset();
  });

  it('should refresh tokens with a valid refresh token', async () => {
    authMock.refreshSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
        },
      },
      error: null,
    });

    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'valid-refresh-token' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body.accessToken).toBe('new-access-token');
  });

  it('should reject expired refresh token', async () => {
    authMock.refreshSession.mockResolvedValue({
      data: { session: null },
      error: { message: 'expired' },
    });

    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'expired-refresh-token' });
    expect(res.status).toBe(401);
  });

  it('should reject invalid refresh token', async () => {
    authMock.refreshSession.mockResolvedValue({
      data: { session: null },
      error: { message: 'invalid' },
    });

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
