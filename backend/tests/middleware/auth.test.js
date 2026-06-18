/**
 * Unit tests for authentication middleware (Supabase Auth)
 */
const { protect, optionalAuth } = require('../../src/middleware/auth');

// Mock @supabase/supabase-js BEFORE requiring anything that imports it
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

const { createClient } = require('@supabase/supabase-js');
const supabaseMock = createClient();
const authMock = supabaseMock.auth;

// Reset mocks before each test
beforeEach(() => {
  authMock.getUser.mockReset();
});

function createReqRes(authHeader) {
  const req = {
    headers: authHeader ? { authorization: authHeader } : {},
  };
  const res = {};
  const next = jest.fn();
  return { req, res, next };
}

describe('protect middleware', () => {
  it('should set req.user and call next for valid token', async () => {
    authMock.getUser.mockResolvedValue({
      data: { user: { id: '550e8400-e29b-41d4-a716-446655440000', email: 'test@test.com' } },
      error: null,
    });

    const { req, res, next } = createReqRes('Bearer valid-supabase-token');
    await protect(req, res, next);

    expect(req.user).toBeDefined();
    expect(req.user.userId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(req.user.email).toBe('test@test.com');
    expect(next).toHaveBeenCalledWith();
  });

  it('should reject missing authorization header', () => {
    const { req, res, next } = createReqRes();
    protect(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 401,
      code: 'UNAUTHORIZED',
      message: 'No token provided. Please login to access this resource.',
    }));
  });

  it('should reject non-Bearer authorization header', () => {
    const { req, res, next } = createReqRes('Basic somehash');
    protect(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 401,
    }));
  });

  it('should reject empty token after Bearer', () => {
    const { req, res, next } = createReqRes('Bearer ');
    protect(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 401,
      code: 'UNAUTHORIZED',
    }));
  });

  it('should reject expired token', async () => {
    authMock.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'expired' },
    });

    const { req, res, next } = createReqRes('Bearer expired-token');
    await protect(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 401,
      code: 'UNAUTHORIZED',
      message: 'Your session has expired. Please login again.',
    }));
  });

  it('should reject invalid token', async () => {
    authMock.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid token' },
    });

    const { req, res, next } = createReqRes('Bearer invalid-token');
    await protect(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 401,
      code: 'UNAUTHORIZED',
      message: 'Invalid token. Please login again.',
    }));
  });

  it('should reject when getUser returns null user with no error', async () => {
    authMock.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const { req, res, next } = createReqRes('Bearer token-with-no-user');
    await protect(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 401,
    }));
  });
});

describe('optionalAuth middleware', () => {
  it('should set req.user for valid token', async () => {
    authMock.getUser.mockResolvedValue({
      data: { user: { id: '550e8400-e29b-41d4-a716-446655440000', email: 'test@test.com' } },
      error: null,
    });

    const { req, res, next } = createReqRes('Bearer valid-supabase-token');
    await optionalAuth(req, res, next);

    expect(req.user).toBeDefined();
    expect(req.user.userId).toBeDefined();
    expect(next).toHaveBeenCalledWith();
  });

  it('should not set req.user when no token provided', () => {
    const { req, res, next } = createReqRes();
    optionalAuth(req, res, next);

    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledWith();
  });

  it('should not fail on invalid token', async () => {
    authMock.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid token' },
    });

    const { req, res, next } = createReqRes('Bearer invalid-token');
    await optionalAuth(req, res, next);

    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledWith();
  });

  it('should not fail on expired token', async () => {
    authMock.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'expired' },
    });

    const { req, res, next } = createReqRes('Bearer expired-token');
    await optionalAuth(req, res, next);

    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledWith();
  });
});
