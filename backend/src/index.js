const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ path: __dirname + '/../.env' });

// ── Internal Modules ──
const { validateEnv } = require('./config/env');
const { logger, httpLogger } = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const corsMiddleware = require('./middleware/cors');

// ── Validate environment before anything else ──
validateEnv();

const app = express();
const PORT = process.env.PORT || 10000;
const isProd = process.env.NODE_ENV === 'production';

// ══════════════════════════════════════════════
//  SECURITY MIDDLEWARE (applied first)
// ══════════════════════════════════════════════

// Helmet with strict CSP in production
app.use(helmet({
  contentSecurityPolicy: isProd ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      connectSrc: ["'self'", process.env.FRONTEND_URL || 'http://localhost:5173'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  } : false,
  crossOriginEmbedderPolicy: false,
}));

// CORS — tightened per environment
app.use(corsMiddleware);

// ══════════════════════════════════════════════
//  REQUEST LOGGING
// ══════════════════════════════════════════════
app.use(httpLogger);

// ══════════════════════════════════════════════
//  RATE LIMITING
// ══════════════════════════════════════════════
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.', code: 'RATE_LIMIT' },
});
app.use('/api/', globalLimiter);

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later.', code: 'AUTH_RATE_LIMIT' },
});

// ══════════════════════════════════════════════
//  BODY PARSER
// ══════════════════════════════════════════════
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ══════════════════════════════════════════════
//  ROOT & HEALTH
// ══════════════════════════════════════════════
app.get('/', (req, res) => {
  res.json({
    name: 'DevChain API',
    version: '1.0.0',
    status: 'live',
    environment: process.env.NODE_ENV || 'development',
    docs: '/api/v1',
  });
});

app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
  };

  // Check database connectivity
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();
    health.database = 'connected';
  } catch (err) {
    health.status = 'degraded';
    health.database = 'disconnected';
    logger.error('Health check — database unreachable');
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

// ══════════════════════════════════════════════
//  API ROUTES
// ══════════════════════════════════════════════
app.use('/api/v1/auth', authLimiter, require('./routes/auth'));
app.use('/api/v1/products', require('./routes/products'));
app.use('/api/v1/ownership', require('./routes/ownership'));
app.use('/api/v1/jobs', require('./routes/jobs'));
app.use('/api/v1/uploads', require('./routes/uploads'));
app.use('/api/v1/payments', require('./routes/payments'));
app.use('/api/v1/analytics', require('./routes/analytics'));

// Static file serving (local uploads — deprecated in favor of Supabase)
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// ══════════════════════════════════════════════
//  404 HANDLER
// ══════════════════════════════════════════════
app.use((req, res) => {
  res.status(404).json({
    error: `Route ${req.method} ${req.originalUrl} not found`,
    code: 'ROUTE_NOT_FOUND',
  });
});

// ══════════════════════════════════════════════
//  GLOBAL ERROR HANDLER (must be last)
// ══════════════════════════════════════════════
app.use(errorHandler);

// ══════════════════════════════════════════════
//  GRACEFUL SHUTDOWN
// ══════════════════════════════════════════════
const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info({
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    frontend: process.env.FRONTEND_URL || 'http://localhost:5173',
  }, 'DevChain API started');
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received — shutting down gracefully');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received — shutting down gracefully');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  logger.error({ err }, 'Uncaught exception');
  server.close(() => process.exit(1));
});

process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Unhandled rejection');
});

module.exports = app;
