/**
 * Wraps async route handlers to catch errors and forward to error middleware
 * Eliminates repetitive try-catch blocks in controllers
 */
const { getLogger } = require('./logger');

const log = getLogger('asyncHandler');

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
