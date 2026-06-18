/**
 * Unit tests for Joi validation middleware
 */
const Joi = require('joi');
const { validate } = require('../../src/middleware/validate');
const { ValidationError } = require('../../src/utils/errors');

function createMockReqRes(body, query, params) {
  const req = { body: body || {}, query: query || {}, params: params || {} };
  const res = {};
  const next = jest.fn();
  return { req, res, next };
}

describe('validate middleware', () => {
  describe('body validation', () => {
    const schema = {
      body: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(3).required(),
      }),
    };

    it('should pass valid body and strip unknown fields', () => {
      const { req, res, next } = createMockReqRes(
        { email: 'test@test.com', password: '123', extraField: 'should-be-stripped' }
      );
      const middleware = validate(schema);
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.body).toEqual({ email: 'test@test.com', password: '123' });
      expect(req.body.extraField).toBeUndefined();
    });

    it('should reject invalid body and call next with ValidationError', () => {
      const { req, res, next } = createMockReqRes(
        { email: 'not-an-email', password: '' }
      );
      const middleware = validate(schema);
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(422);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details.length).toBeGreaterThan(0);
      expect(error.details.some(d => d.location === 'body')).toBe(true);
    });

    it('should handle missing body gracefully', () => {
      const { req, res, next } = createMockReqRes(undefined);
      const middleware = validate(schema);
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
    });
  });

  describe('query validation', () => {
    const schema = {
      query: Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(12),
      }),
    };

    it('should pass valid query params', () => {
      const { req, res, next } = createMockReqRes({}, { page: '2', limit: '20' });
      const middleware = validate(schema);
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.query.page).toBe(2);
      expect(req.query.limit).toBe(20);
    });

    it('should apply defaults for missing query params', () => {
      const { req, res, next } = createMockReqRes({}, {});
      const middleware = validate(schema);
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.query.page).toBe(1);
      expect(req.query.limit).toBe(12);
    });

    it('should reject invalid query params', () => {
      const { req, res, next } = createMockReqRes({}, { page: 'abc' });
      const middleware = validate(schema);
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
    });
  });

  describe('params validation', () => {
    const schema = {
      params: Joi.object({
        id: Joi.string().uuid().required(),
      }),
    };

    it('should pass valid UUID params', () => {
      const { req, res, next } = createMockReqRes({}, {}, { id: '550e8400-e29b-41d4-a716-446655440000' });
      const middleware = validate(schema);
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should reject invalid UUID params', () => {
      const { req, res, next } = createMockReqRes({}, {}, { id: 'not-a-uuid' });
      const middleware = validate(schema);
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    it('should reject missing params', () => {
      const { req, res, next } = createMockReqRes({}, {}, {});
      const middleware = validate(schema);
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
    });
  });

  describe('combined validation (body + query + params)', () => {
    const schema = {
      body: Joi.object({ name: Joi.string().required() }),
      query: Joi.object({ page: Joi.number() }),
      params: Joi.object({ id: Joi.string().uuid().required() }),
    };

    it('should validate all three sources', () => {
      const { req, res, next } = createMockReqRes(
        { name: 'test' },
        { page: '1' },
        { id: '550e8400-e29b-41d4-a716-446655440000' }
      );
      const middleware = validate(schema);
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should collect errors from all sources', () => {
      const { req, res, next } = createMockReqRes(
        {},
        { page: 'abc' },
        { id: 'bad' }
      );
      const middleware = validate(schema);
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
      const error = next.mock.calls[0][0];
      expect(error.details.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('no schema provided', () => {
    it('should call next with no errors for empty schema', () => {
      const { req, res, next } = createMockReqRes({ test: 'data' });
      const middleware = validate({});
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should call next when no schemas are provided', () => {
      const { req, res, next } = createMockReqRes({ test: 'data' });
      const middleware = validate();
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });
  });
});
