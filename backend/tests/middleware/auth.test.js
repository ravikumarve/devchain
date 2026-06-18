/**
 * Unit tests for authentication middleware
 */
const jwt = require('jsonwebtoken');
const { protect, optionalAuth } = require('../../src/middleware/auth');

function createReqRes(authHeader) {
  const req = {
    headers: authHeader ? { authorization: authHeader } : {},
  };
  const res = {};
  const next = jest.fn();
  return { req, res, next };
}

function generateValidToken(payload = {}) {
  return jwt.sign(
    { userId: '550e8400-e29b-41d4-a716-446655440000', email: 'test@test.com', ...payload },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
}

describe('protect middleware', () => {
  it('should set req.user and call next for valid token', () => {
    const token = generateValidToken();
    const { req, res, next } = createReqRes(`Bearer ${token}`);
    protect(req, res, next);

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

  it('should reject expired token', () => {
    const token = jwt.sign(
      { userId: 'test-user', email: 'test@test.com' },
      process.env.JWT_SECRET,
      { expiresIn: '0s' }
    );
    const { req, res, next } = createReqRes(`Bearer ${token}`);
    protect(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 401,
      code: 'UNAUTHORIZED',
      message: 'Your session has expired. Please login again.',
    }));
  });

  it('should reject invalid token', () => {
    const { req, res, next } = createReqRes('Bearer invalid-token-here');
    protect(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 401,
      code: 'UNAUTHORIZED',
      message: 'Invalid token. Please login again.',
    }));
  });

  it('should reject token signed with wrong secret', () => {
    const token = jwt.sign(
      { userId: 'test', email: 'test@test.com' },
      'wrong-secret'
    );
    const { req, res, next } = createReqRes(`Bearer ${token}`);
    protect(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 401,
    }));
  });
});

describe('optionalAuth middleware', () => {
  it('should set req.user for valid token', () => {
    const token = generateValidToken();
    const { req, res, next } = createReqRes(`Bearer ${token}`);
    optionalAuth(req, res, next);

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

  it('should not fail on invalid token', () => {
    const { req, res, next } = createReqRes('Bearer invalid-token');
    optionalAuth(req, res, next);

    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledWith();
  });

  it('should not fail on expired token', () => {
    const token = jwt.sign(
      { userId: 'test', email: 'test@test.com' },
      process.env.JWT_SECRET,
      { expiresIn: '0s' }
    );
    const { req, res, next } = createReqRes(`Bearer ${token}`);
    optionalAuth(req, res, next);

    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledWith();
  });
});
