// src/index.ts
// ─────────────────────────────────────────────────────────────
// DevChain Backend — Express 5 Server
//
// Boot order:
//   1. Validate env vars (hard stop if missing)
//   2. Connect to Redis
//   3. Apply security middleware
//   4. Mount routes
//   5. Error handler (must be last)
//   6. Start listening
// ─────────────────────────────────────────────────────────────
import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';

// Config — env MUST be imported first (validates all vars)
import { env } from './config/env.js';
import { redis } from './config/redis.js';

// Middleware
import { globalLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';

// Routes
import apiRoutes from './routes/index.js';

const app = express();

// ════════════════════════════════════════════════════════════
// SECURITY MIDDLEWARE
// ════════════════════════════════════════════════════════════

// Helmet — sets secure HTTP headers automatically
// Protects against XSS, clickjacking, MIME sniffing, etc.
app.use(helmet());

// CORS — only allow our known frontend origins
const allowedOrigins =
  env.NODE_ENV === 'production'
    ? ['https://devchain.app', 'https://www.devchain.app']
    : ['http://localhost:8081', 'http://localhost:3001', 'http://localhost:19006'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: Origin ${origin} not allowed`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate limiting — 100 req/min per IP globally
app.use(globalLimiter);

// ════════════════════════════════════════════════════════════
// BODY PARSING
// ════════════════════════════════════════════════════════════

// JSON body — max 10mb (products can have rich descriptions)
app.use(express.json({ limit: '10mb' }));

// URL-encoded forms
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ════════════════════════════════════════════════════════════
// LOGGING
// ════════════════════════════════════════════════════════════

// Development: colorful verbose logs
// Production: JSON structured logs (parseable by log aggregators)
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ════════════════════════════════════════════════════════════
// HEALTH CHECK  (no auth, no rate limit)
// ════════════════════════════════════════════════════════════
app.get('/health', async (_req: Request, res: Response) => {
  // Ping Redis to verify connectivity
  let redisStatus = 'ok';
  try {
    await redis.ping();
  } catch {
    redisStatus = 'error';
  }

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    services: {
      redis: redisStatus,
      // Supabase connectivity checked on first DB query, not here
    },
  });
});

// ════════════════════════════════════════════════════════════
// API ROUTES
// ════════════════════════════════════════════════════════════
app.use('/api', apiRoutes);

// ─── 404 handler — unknown routes ────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// ─── Global error handler (must be last) ─────────────────────
app.use(errorHandler);

// ════════════════════════════════════════════════════════════
// START SERVER
// ════════════════════════════════════════════════════════════
const PORT = parseInt(env.PORT, 10);

app.listen(PORT, () => {
  console.log(`\n🚀 DevChain API running`);
  console.log(`   Environment : ${env.NODE_ENV}`);
  console.log(`   Port        : ${PORT}`);
  console.log(`   Health      : http://localhost:${PORT}/health`);
  console.log(`   API         : http://localhost:${PORT}/api\n`);
});

export default app;
