/**
 * Authentication middleware for DevChain API
 * Verifies Supabase JWT tokens via supabase.auth.getUser()
 */
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');
const { getLogger } = require('../utils/logger');
const { adminClient: supabase } = require('../config/supabase');

const log = getLogger('auth');

/**
 * Protect route — requires valid Supabase JWT access token
 * Sets req.user = { userId, email } on success
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided. Please login to access this resource.');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new UnauthorizedError('Token is empty. Please login again.');
    }

    const { data: { user: authUser }, error } = await supabase.auth.getUser(token);

    if (error || !authUser) {
      if (error?.message?.includes('expired')) {
        throw new UnauthorizedError('Your session has expired. Please login again.');
      }
      throw new UnauthorizedError('Invalid token. Please login again.');
    }

    // Attach user info to request
    req.user = {
      userId: authUser.id,
      email: authUser.email,
    };

    next();
  } catch (err) {
    // Re-throw our custom errors
    if (err instanceof UnauthorizedError) {
      return next(err);
    }

    log.error({ err }, 'Unexpected auth error');
    return next(new UnauthorizedError('Authentication failed.'));
  }
};

/**
 * Optional auth — attaches user if token present, but doesn't block
 * Useful for endpoints that work differently for authenticated users
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
      if (!error && authUser) {
        req.user = {
          userId: authUser.id,
          email: authUser.email,
        };
      }
    }
  } catch (err) {
    // Silently continue — auth is optional
  }

  next();
};

module.exports = { protect, optionalAuth };
