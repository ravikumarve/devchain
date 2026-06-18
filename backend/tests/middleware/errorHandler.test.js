/**
 * Unit tests for centralized error handler
 */
const errorHandler = require('../../src/middleware/errorHandler');
const {
  AppError,
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  ConflictError,
  ValidationError,
  RateLimitError,
} = require('../../src/utils/errors');

function createReqRes() {
  const req = { method: 'GET', originalUrl: '/test', body: {} };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return { req, res };
}

describe('errorHandler middleware', () => {
  describe('AppError handling', () => {
    it('should handle BadRequestError (400)', () => {
      const { req, res } = createReqRes();
      const err = new BadRequestError('Invalid input');
      errorHandler(err, req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Invalid input',
        code: 'BAD_REQUEST',
      }));
    });

    it('should handle UnauthorizedError (401)', () => {
      const { req, res } = createReqRes();
      const err = new UnauthorizedError('Login required');
      errorHandler(err, req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        code: 'UNAUTHORIZED',
      }));
    });

    it('should handle NotFoundError (404)', () => {
      const { req, res } = createReqRes();
      const err = new NotFoundError('Resource not found');
      errorHandler(err, req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        code: 'NOT_FOUND',
      }));
    });

    it('should handle ConflictError (409)', () => {
      const { req, res } = createReqRes();
      const err = new ConflictError('Already exists');
      errorHandler(err, req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        code: 'CONFLICT',
      }));
    });

    it('should handle ValidationError (422) with details', () => {
      const { req, res } = createReqRes();
      const err = new ValidationError('Invalid fields', [{ field: 'email', message: 'Invalid' }]);
      errorHandler(err, req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        code: 'VALIDATION_ERROR',
        details: expect.any(Array),
      }));
    });

    it('should handle RateLimitError (429)', () => {
      const { req, res } = createReqRes();
      const err = new RateLimitError('Too many requests');
      errorHandler(err, req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        code: 'RATE_LIMIT',
      }));
    });
  });

  describe('Prisma error handling', () => {
    it('should handle Prisma unique constraint violation (P2002)', () => {
      const { req, res } = createReqRes();
      const err = {
        name: 'PrismaClientKnownRequestError',
        code: 'P2002',
        meta: { target: ['email'] },
      };
      errorHandler(err, req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.stringContaining('email'),
        code: 'UNIQUE_CONSTRAINT',
      }));
    });

    it('should handle Prisma record not found (P2025)', () => {
      const { req, res } = createReqRes();
      const err = {
        name: 'PrismaClientKnownRequestError',
        code: 'P2025',
      };
      errorHandler(err, req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        code: 'NOT_FOUND',
      }));
    });

    it('should handle Prisma foreign key error (P2003)', () => {
      const { req, res } = createReqRes();
      const err = {
        name: 'PrismaClientKnownRequestError',
        code: 'P2003',
      };
      errorHandler(err, req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        code: 'FOREIGN_KEY_ERROR',
      }));
    });

    it('should handle Prisma connection error (P1001)', () => {
      const { req, res } = createReqRes();
      const err = {
        name: 'PrismaClientKnownRequestError',
        code: 'P1001',
      };
      errorHandler(err, req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        code: 'DB_CONNECTION_ERROR',
      }));
    });
  });

  describe('External library error handling', () => {
    it('should handle JWT errors', () => {
      const { req, res } = createReqRes();
      const err = { name: 'TokenExpiredError', message: 'jwt expired' };
      errorHandler(err, req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        code: 'TOKEN_EXPIRED',
      }));
    });

    it('should handle invalid JWT', () => {
      const { req, res } = createReqRes();
      const err = { name: 'JsonWebTokenError', message: 'invalid token' };
      errorHandler(err, req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        code: 'TOKEN_INVALID',
      }));
    });

    it('should handle Stripe errors', () => {
      const { req, res } = createReqRes();
      const err = { type: 'StripeCardError', message: 'Card declined', statusCode: 402 };
      errorHandler(err, req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(402);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        code: 'STRIPE_ERROR',
      }));
    });

    it('should handle Multer file size limit', () => {
      const { req, res } = createReqRes();
      const err = { code: 'LIMIT_FILE_SIZE' };
      errorHandler(err, req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(413);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        code: 'FILE_TOO_LARGE',
      }));
    });

    it('should handle Multer unexpected file', () => {
      const { req, res } = createReqRes();
      const err = { code: 'LIMIT_UNEXPECTED_FILE' };
      errorHandler(err, req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        code: 'UNEXPECTED_FILE',
      }));
    });

    it('should handle Supabase errors', () => {
      const { req, res } = createReqRes();
      const err = { statusCode: 403, error: 'Bucket not found' };
      errorHandler(err, req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        code: 'SUPABASE_ERROR',
      }));
    });

    it('should handle CORS errors', () => {
      const { req, res } = createReqRes();
      const err = { message: 'Not allowed by CORS' };
      errorHandler(err, req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        code: 'CORS_ERROR',
      }));
    });

    it('should handle malformed JSON body errors', () => {
      const { req, res } = createReqRes();
      const err = { type: 'entity.parse.failed' };
      errorHandler(err, req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        code: 'INVALID_JSON',
      }));
    });
  });

  describe('Unexpected errors', () => {
    it('should return 500 for generic errors in production', () => {
      process.env.NODE_ENV = 'production';
      const { req, res } = createReqRes();
      const err = new Error('Something broke');
      errorHandler(err, req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      }));
      process.env.NODE_ENV = 'test';
    });

    it('should include error message and stack in development', () => {
      process.env.NODE_ENV = 'development';
      const { req, res } = createReqRes();
      const err = new Error('Debug info');
      errorHandler(err, req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Debug info',
        stack: expect.any(String),
      }));
      process.env.NODE_ENV = 'test';
    });
  });
});
