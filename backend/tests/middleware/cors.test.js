/**
 * Unit tests for CORS middleware
 * Tests that CORS middleware is properly configured
 */
describe('CORS middleware', () => {
  it('should export a middleware function', () => {
    const corsMiddleware = require('../../src/middleware/cors');
    expect(typeof corsMiddleware).toBe('function');
  });

  describe('in development mode', () => {
    it('should allow requests from any origin', () => {
      const corsMiddleware = require('../../src/middleware/cors');
      const req = {
        method: 'GET',
        headers: { origin: 'http://random-origin.com' },
      };
      const res = {
        setHeader: jest.fn(),
        getHeader: jest.fn(),
        end: jest.fn(),
      };
      const next = jest.fn();

      corsMiddleware(req, res, next);
      // In dev mode, cors calls next() for non-OPTIONS requests
      expect(next).toHaveBeenCalled();
    });

    it('should set CORS headers on responses', () => {
      const corsMiddleware = require('../../src/middleware/cors');
      const req = {
        method: 'GET',
        headers: { origin: 'http://localhost:5173' },
      };
      const res = {
        setHeader: jest.fn(),
        getHeader: jest.fn(),
        end: jest.fn(),
      };
      const next = jest.fn();

      corsMiddleware(req, res, next);
      // CORS headers should be set (origin, methods, headers, etc.)
      expect(res.setHeader).toHaveBeenCalled();
    });
  });

  describe('preflight (OPTIONS) requests', () => {
    it('should handle CORS preflight without error', () => {
      const corsMiddleware = require('../../src/middleware/cors');
      const req = {
        method: 'OPTIONS',
        headers: {
          origin: 'http://localhost:5173',
          'access-control-request-method': 'POST',
        },
      };
      const res = {
        setHeader: jest.fn(),
        getHeader: jest.fn(),
        end: jest.fn(),
      };
      const next = jest.fn();

      corsMiddleware(req, res, next);
      // Preflight requests get CORS headers set
      expect(res.setHeader).toHaveBeenCalled();
    });
  });
});
