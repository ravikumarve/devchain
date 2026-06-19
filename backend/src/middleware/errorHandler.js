/**
 * Centralized error handling middleware
 * Catches all errors and returns consistent JSON responses
 */
const { AppError } = require('../utils/errors');
const { logger } = require('../utils/logger');

function errorHandler(err, req, res, _next) {
  // Log all errors
  logger.error({
    err,
    req: { method: req.method, url: req.originalUrl },
    body: err instanceof AppError ? undefined : (req.body ? '[present]' : undefined),
  }, err.message || 'Unhandled error');

  // Handle known operational errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(err.toJSON());
  }

  // Handle Prisma errors
  if (err.name && err.name.startsWith('Prisma')) {
    return handlePrismaError(err, res);
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: err.name === 'TokenExpiredError'
        ? 'Token expired. Please login again.'
        : 'Invalid token. Please login again.',
      code: err.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID',
    });
  }

  // Handle Stripe errors
  if (err.type && err.type.startsWith('Stripe')) {
    return res.status(err.statusCode || 500).json({
      error: err.message || 'Payment processing error',
      code: 'STRIPE_ERROR',
    });
  }

  // Handle multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'File too large. Maximum size is 50MB.',
      code: 'FILE_TOO_LARGE',
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      error: 'Unexpected file field',
      code: 'UNEXPECTED_FILE',
    });
  }

  // Handle multer file filter rejections (e.g., disallowed file type)
  if (err.message && err.message.includes('not allowed')) {
    return res.status(400).json({
      error: err.message,
      code: 'FILE_TYPE_NOT_ALLOWED',
    });
  }

  // Handle Supabase errors
  if (err.statusCode && err.error) {
    return res.status(err.statusCode).json({
      error: err.error,
      code: 'SUPABASE_ERROR',
    });
  }

  // Handle CORS errors
  if (err.message && err.message.includes('Not allowed by CORS')) {
    return res.status(403).json({
      error: 'Origin not allowed by CORS policy',
      code: 'CORS_ERROR',
    });
  }

  // Handle body parser errors (malformed JSON)
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'Invalid JSON in request body',
      code: 'INVALID_JSON',
    });
  }

  // Default 500 for unexpected errors
  const statusCode = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'Internal server error'
    : err.message || 'Internal server error';

  res.status(statusCode).json({
    error: message,
    code: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

function handlePrismaError(err, res) {
  // Unique constraint violation
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'field';
    return res.status(409).json({
      error: `A record with this ${field} already exists.`,
      code: 'UNIQUE_CONSTRAINT',
      field,
    });
  }

  // Record not found
  if (err.code === 'P2025') {
    return res.status(404).json({
      error: 'Record not found.',
      code: 'NOT_FOUND',
    });
  }

  // Foreign key constraint
  if (err.code === 'P2003') {
    return res.status(400).json({
      error: 'Referenced record does not exist.',
      code: 'FOREIGN_KEY_ERROR',
    });
  }

  // Connection error
  if (err.code === 'P1001' || err.code === 'P1002') {
    return res.status(503).json({
      error: 'Database connection failed. Please try again.',
      code: 'DB_CONNECTION_ERROR',
    });
  }

  // Fallback Prisma error
  return res.status(500).json({
    error: 'Database error',
    code: 'DATABASE_ERROR',
    ...(process.env.NODE_ENV === 'development' && { details: err.message }),
  });
}

module.exports = errorHandler;
