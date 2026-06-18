/**
 * Unit tests for custom error classes
 */
const {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  RateLimitError,
} = require('../../src/utils/errors');

describe('Error Classes', () => {
  describe('AppError (base class)', () => {
    it('should create an error with correct properties', () => {
      const err = new AppError('Something went wrong', 500, 'APP_ERROR');
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe('Something went wrong');
      expect(err.statusCode).toBe(500);
      expect(err.code).toBe('APP_ERROR');
      expect(err.isOperational).toBe(true);
      expect(err.name).toBe('AppError');
    });

    it('should use default code when not provided', () => {
      const err = new AppError('Test', 400);
      expect(err.code).toBe('APP_ERROR');
    });

    it('should include stack in toJSON in development', () => {
      process.env.NODE_ENV = 'development';
      const err = new AppError('Dev error', 500);
      const json = err.toJSON();
      expect(json.error).toBe('Dev error');
      expect(json.code).toBe('APP_ERROR');
      expect(json.stack).toBeDefined();
      process.env.NODE_ENV = 'test';
    });

    it('should exclude stack in toJSON in non-development', () => {
      const err = new AppError('Prod error', 500);
      const json = err.toJSON();
      expect(json.error).toBe('Prod error');
      expect(json.stack).toBeUndefined();
    });
  });

  describe('BadRequestError', () => {
    it('should have 400 status and BAD_REQUEST code', () => {
      const err = new BadRequestError('Invalid input');
      expect(err.statusCode).toBe(400);
      expect(err.code).toBe('BAD_REQUEST');
      expect(err.message).toBe('Invalid input');
    });

    it('should use default message', () => {
      const err = new BadRequestError();
      expect(err.message).toBe('Bad request');
    });
  });

  describe('UnauthorizedError', () => {
    it('should have 401 status and UNAUTHORIZED code', () => {
      const err = new UnauthorizedError('Login required');
      expect(err.statusCode).toBe(401);
      expect(err.code).toBe('UNAUTHORIZED');
      expect(err.message).toBe('Login required');
    });

    it('should use default message', () => {
      const err = new UnauthorizedError();
      expect(err.message).toBe('Authentication required');
    });
  });

  describe('ForbiddenError', () => {
    it('should have 403 status and FORBIDDEN code', () => {
      const err = new ForbiddenError('Not allowed');
      expect(err.statusCode).toBe(403);
      expect(err.code).toBe('FORBIDDEN');
    });

    it('should use default message', () => {
      const err = new ForbiddenError();
      expect(err.message).toBe('Access denied');
    });
  });

  describe('NotFoundError', () => {
    it('should have 404 status and NOT_FOUND code', () => {
      const err = new NotFoundError('User not found');
      expect(err.statusCode).toBe(404);
      expect(err.code).toBe('NOT_FOUND');
    });

    it('should use default message', () => {
      const err = new NotFoundError();
      expect(err.message).toBe('Resource not found');
    });
  });

  describe('ConflictError', () => {
    it('should have 409 status and CONFLICT code', () => {
      const err = new ConflictError('Email exists');
      expect(err.statusCode).toBe(409);
      expect(err.code).toBe('CONFLICT');
    });

    it('should use default message', () => {
      const err = new ConflictError();
      expect(err.message).toBe('Resource already exists');
    });
  });

  describe('ValidationError', () => {
    it('should have 422 status and VALIDATION_ERROR code', () => {
      const err = new ValidationError('Invalid fields', [{ field: 'email', message: 'Invalid email' }]);
      expect(err.statusCode).toBe(422);
      expect(err.code).toBe('VALIDATION_ERROR');
      expect(err.details).toEqual([{ field: 'email', message: 'Invalid email' }]);
    });

    it('should include details in toJSON', () => {
      const details = [{ field: 'name', message: 'Required' }];
      const err = new ValidationError('Validation failed', details);
      const json = err.toJSON();
      expect(json.details).toEqual(details);
    });

    it('should use default message', () => {
      const err = new ValidationError();
      expect(err.message).toBe('Validation failed');
      expect(err.details).toBeNull();
    });
  });

  describe('RateLimitError', () => {
    it('should have 429 status and RATE_LIMIT code', () => {
      const err = new RateLimitError('Too fast');
      expect(err.statusCode).toBe(429);
      expect(err.code).toBe('RATE_LIMIT');
    });

    it('should use default message', () => {
      const err = new RateLimitError();
      expect(err.message).toBe('Too many requests, please try again later');
    });
  });
});
