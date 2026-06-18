/**
 * Structured logging for DevChain API
 * Uses pino for JSON logging with environment-aware configuration
 */
const pino = require('pino');
const path = require('path');

const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

const logger = pino({
  name: 'devchain-api',
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  ...(isDev && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
        ignore: 'pid,hostname',
      },
    },
  }),
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      headers: req.headers ? {
        'user-agent': req.headers['user-agent'],
        'content-type': req.headers['content-type'],
      } : undefined,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
    err: pino.stdSerializers.err,
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'body.password',
      'body.token',
      'body.refreshToken',
      'body.secret',
    ],
    censor: '[REDACTED]',
  },
});

// Create child loggers for different modules
module.exports = {
  logger,
  httpLogger: (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info({
        req: req,
        res: res,
        duration: `${duration}ms`,
      }, `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
    });
    next();
  },
  getLogger: (module) => logger.child({ module }),
};
