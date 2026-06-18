/**
 * Authentication middleware for DevChain API
 * JWT verification with enhanced error handling
 */
const jwt = require('jsonwebtoken');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');
const { getLogger } = require('../utils/logger');

const log = getLogger('auth');

/**
 * Protect route — requires valid JWT access token
 * Sets req.user = { userId, email } on success
 */
const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided. Please login to access this resource.');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new UnauthorizedError('Token is empty. Please login again.');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };

    next();
  } catch (err) {
    // Re-throw our custom errors
    if (err instanceof UnauthorizedError) {
      return next(err);
    }

    if (err.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Your session has expired. Please login again.'));
    }

    if (err.name === 'JsonWebTokenError') {
      return next(new UnauthorizedError('Invalid token. Please login again.'));
    }

    if (err.name === 'NotBeforeError') {
      return next(new UnauthorizedError('Token is not yet active.'));
    }

    log.error({ err }, 'Unexpected auth error');
    return next(new UnauthorizedError('Authentication failed.'));
  }
};

/**
 * Optional auth — attaches user if token present, but doesn't block
 * Useful for endpoints that work differently for authenticated users
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
      };
    }
  } catch (err) {
    // Silently continue — auth is optional
  }

  next();
};

module.exports = { protect, optionalAuth };
