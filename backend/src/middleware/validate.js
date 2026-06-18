/**
 * Joi-based request validation middleware
 * Validates request body, query parameters, and URL params against schemas
 */
const Joi = require('joi');
const { ValidationError } = require('../utils/errors');
const { getLogger } = require('../utils/logger');

const log = getLogger('validate');

/**
 * Creates validation middleware for a route
 * @param {Object} schemas - Object with optional body, query, params Joi schemas
 * @returns {Function} Express middleware
 */
function validate(schemas = {}) {
  return (req, res, next) => {
    const errors = [];

    if (schemas.body) {
      const { error, value } = schemas.body.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });
      if (error) {
        errors.push(...error.details.map((d) => ({
          field: d.path.join('.'),
          message: d.message,
          location: 'body',
        })));
      } else {
        req.body = value;
      }
    }

    if (schemas.query) {
      const { error, value } = schemas.query.validate(req.query, {
        abortEarly: false,
        stripUnknown: true,
      });
      if (error) {
        errors.push(...error.details.map((d) => ({
          field: d.path.join('.'),
          message: d.message,
          location: 'query',
        })));
      } else {
        req.query = value;
      }
    }

    if (schemas.params) {
      const { error, value } = schemas.params.validate(req.params, {
        abortEarly: false,
        stripUnknown: true,
      });
      if (error) {
        errors.push(...error.details.map((d) => ({
          field: d.path.join('.'),
          message: d.message,
          location: 'params',
        })));
      } else {
        req.params = value;
      }
    }

    if (errors.length > 0) {
      log.warn({ errors }, 'Request validation failed');
      return next(new ValidationError('Validation failed', errors));
    }

    next();
  };
}

// ── Reusable schema fragments ──

const schemas = {
  // Pagination
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(12),
  }),

  // UUID
  uuid: Joi.string().uuid(),

  // Email
  email: Joi.string().email().lowercase().trim(),

  // Password — min 8 chars, at least 1 letter and 1 number
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-zA-Z])(?=.*\d)/)
    .message('Password must be at least 8 characters with at least 1 letter and 1 number'),

  // Username
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .lowercase()
    .trim(),

  // Product ID
  productId: Joi.string().uuid().required(),

  // Job ID
  jobId: Joi.string().uuid().required(),

  // Stripe session ID
  sessionId: Joi.string().pattern(/^cs_test_/).required(),
};

module.exports = { validate, schemas };
