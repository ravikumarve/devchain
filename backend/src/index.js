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
//  RATE LIMITING (disabled in test mode)
// ══════════════════════════════════════════════
const globalLimiter = process.env.NODE_ENV !== 'test' ? rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.', code: 'RATE_LIMIT' },
}) : (req, res, next) => next();

app.use('/api/', globalLimiter);

// Stricter rate limit for auth routes (disabled in test mode)
const authLimiter = process.env.NODE_ENV !== 'test' ? rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later.', code: 'AUTH_RATE_LIMIT' },
}) : (req, res, next) => next();

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
  const health = await getHealth();
  res.status(health.status === 'ok' ? 200 : 503).json(health);
});

// Vercel-only: health + debug at /api/ namespace (Vercel rewrites /api/* to function)
app.get('/api/health', async (req, res) => {
  const health = await getHealth();
  res.status(health.status === 'ok' ? 200 : 503).json(health);
});

async function getHealth() {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
  };

  try {
    const prisma = require('./config/database');
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();
    health.database = 'connected';
  } catch (err) {
    health.status = 'degraded';
    health.database = 'disconnected';
    logger.error('Health check — database unreachable');
  }

  try {
    const { adminClient: sb } = require('./config/supabase');
    // Timeout after 5s to prevent hanging (e.g., fake URLs in tests)
    const healthResult = await Promise.race([
      sb.auth.admin.listUsers({ page: 1, perPage: 1 }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timed out')), 5000)),
    ]);
    const { data, error } = healthResult;
    health.supabaseAuth = error ? `error: ${error.message}` : `connected (${data?.users?.length || 0} users)`;
    if (error) health.status = 'degraded';
  } catch (err) {
    health.supabaseAuth = `error: ${err.message === 'timed out' ? 'Supabase Auth unreachable (timeout)' : err.message}`;
    health.status = 'degraded';
    logger.error({ err }, 'Health check — Supabase Auth unreachable');
  }

  return health;
}

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
app.use('/api/v1/reviews', require('./routes/reviews'));
app.use('/api/v1/escrow', require('./routes/escrow'));
app.use('/api/v1/notifications', require('./routes/notifications'));
app.use('/api/v1/chat', require('./routes/chat'));

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
let server;

// Only start listening if run directly (not imported as module)
if (require.main === module) {
  server = app.listen(PORT, '0.0.0.0', () => {
    logger.info({
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
      frontend: process.env.FRONTEND_URL || 'http://localhost:5173',
    }, 'DevChain API started');
  });
}

if (server) {
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
}

module.exports = app;
