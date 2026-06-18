#!/bin/bash
# DevChain Backend Setup Script
# Run this from ~/devchain/apps/backend/
# Usage: bash setup-backend.sh

set -e  # Stop on any error

echo "📁 Creating folder structure..."
mkdir -p src/config src/middleware src/routes src/controllers src/services src/types

echo "📝 Creating src/config/env.ts..."
cat > src/config/env.ts << 'EOF'
// src/config/env.ts
// Validates ALL required environment variables at startup.
// If anything is missing the server refuses to start.
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' }); // Load from monorepo root

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('3000'),
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  UPSTASH_REDIS_REST_URL: z.string().url('UPSTASH_REDIS_REST_URL must be a valid URL'),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1, 'UPSTASH_REDIS_REST_TOKEN is required'),
  FIREBASE_PROJECT_ID: z.string().min(1, 'FIREBASE_PROJECT_ID is required'),
  FIREBASE_STORAGE_BUCKET: z.string().min(1, 'FIREBASE_STORAGE_BUCKET is required'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:\n');
  parsed.error.issues.forEach((issue) => {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  });
  console.error('\nFix your .env file and restart.\n');
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
EOF

echo "📝 Creating src/config/supabase.ts..."
cat > src/config/supabase.ts << 'EOF'
// src/config/supabase.ts
// Two clients: standard (respects RLS) and admin (bypasses RLS).
// NEVER send supabaseAdmin or service role key to the frontend.
import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
EOF

echo "📝 Creating src/config/redis.ts..."
cat > src/config/redis.ts << 'EOF'
// src/config/redis.ts
// Upstash Redis — rate limiting, caching, JWT blocklist.
// Free tier: 10,000 requests/day = $0
import { Redis } from '@upstash/redis';
import { env } from './env.js';

export const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

export async function cacheGet<T>(key: string): Promise<T | null> {
  try { return await redis.get<T>(key); }
  catch { return null; }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
  try { await redis.set(key, value, { ex: ttlSeconds }); }
  catch { console.warn(`[cache] Failed to write key: ${key}`); }
}

export async function cacheDel(key: string): Promise<void> {
  try { await redis.del(key); }
  catch { console.warn(`[cache] Failed to delete key: ${key}`); }
}
EOF

echo "📝 Creating src/middleware/errorHandler.ts..."
cat > src/middleware/errorHandler.ts << 'EOF'
// src/middleware/errorHandler.ts
// Central error handler — never exposes stack traces in production.
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env.js';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational = true
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  console.error(`[error] ${req.method} ${req.path} — ${err.message}`);

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...(env.NODE_ENV === 'development' && { stack: err.stack }),
    });
    return;
  }

  if (err.name === 'JsonWebTokenError') { res.status(401).json({ success: false, error: 'Invalid token' }); return; }
  if (err.name === 'TokenExpiredError') { res.status(401).json({ success: false, error: 'Token expired' }); return; }

  res.status(500).json({
    success: false,
    error: env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
EOF

echo "📝 Creating src/middleware/rateLimiter.ts..."
cat > src/middleware/rateLimiter.ts << 'EOF'
// src/middleware/rateLimiter.ts
// Three tiers: global (100/min), auth (10/15min), upload (20/hr)
import rateLimit from 'express-rate-limit';

export const globalLimiter = rateLimit({
  windowMs: 60 * 1000, max: 100,
  standardHeaders: 'draft-7', legacyHeaders: false,
  skip: (req) => req.path === '/health',
  message: { success: false, error: 'Too many requests. Please slow down.' },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  standardHeaders: 'draft-7', legacyHeaders: false,
  message: { success: false, error: 'Too many attempts. Try again in 15 minutes.' },
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 20,
  standardHeaders: 'draft-7', legacyHeaders: false,
  message: { success: false, error: 'Upload limit reached. Try again in an hour.' },
});
EOF

echo "📝 Creating src/middleware/auth.ts..."
cat > src/middleware/auth.ts << 'EOF'
// src/middleware/auth.ts
// JWT auth middleware. Checks signature, expiry, and blocklist.
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { redis } from '../config/redis.js';
import { AppError } from './errorHandler.js';

export interface JwtPayload {
  userId: string;
  email: string;
  role: 'buyer' | 'seller' | 'admin';
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface Request { user?: JwtPayload; }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) throw new AppError(401, 'Authorization header missing');

  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

  const blocklisted = await redis.get(`blocklist:${token}`);
  if (blocklisted) throw new AppError(401, 'Token revoked. Please log in again.');

  req.user = decoded;
  next();
}

export function requireRole(...roles: JwtPayload['role'][]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw new AppError(401, 'Not authenticated');
    if (!roles.includes(req.user.role)) throw new AppError(403, `Required role: ${roles.join(' or ')}`);
    next();
  };
}
EOF

echo "📝 Creating src/routes/index.ts..."
cat > src/routes/index.ts << 'EOF'
// src/routes/index.ts — All API routes (stubs, filled in feature by feature)
import { Router, Request, Response } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { authLimiter, uploadLimiter } from '../middleware/rateLimiter.js';

const router = Router();
const stub = (name: string) => (_req: Request, res: Response) =>
  res.json({ success: true, message: `[stub] ${name}`, data: null });

// AUTH
router.post('/auth/register', authLimiter, stub('Register'));
router.post('/auth/login', authLimiter, stub('Login'));
router.post('/auth/logout', requireAuth, stub('Logout'));
router.post('/auth/refresh', stub('Refresh token'));
router.post('/auth/forgot-password', authLimiter, stub('Forgot password'));
router.post('/auth/reset-password', authLimiter, stub('Reset password'));

// USERS
router.get('/users/me', requireAuth, stub('Get my profile'));
router.put('/users/me', requireAuth, stub('Update my profile'));
router.delete('/users/me', requireAuth, stub('Delete account'));
router.get('/users/:username', stub('Get public profile'));
router.get('/users/:username/products', stub('Get user products'));
router.get('/users/:username/gigs', stub('Get user gigs'));
router.get('/users/:username/reviews', stub('Get user reviews'));

// PRODUCTS
router.get('/products', stub('List products'));
router.get('/products/search', stub('Search products'));
router.get('/products/trending', stub('Trending products'));
router.get('/products/:id', stub('Get product'));
router.post('/products', requireAuth, requireRole('seller', 'admin'), uploadLimiter, stub('Create product'));
router.put('/products/:id', requireAuth, stub('Update product'));
router.delete('/products/:id', requireAuth, stub('Delete product'));
router.get('/products/:id/reviews', stub('Product reviews'));
router.post('/products/:id/reviews', requireAuth, stub('Post review'));

// ORDERS
router.get('/orders', requireAuth, stub('My orders'));
router.post('/orders', requireAuth, stub('Create order'));
router.get('/orders/:id', requireAuth, stub('Get order'));
router.post('/orders/:id/refund', requireAuth, stub('Request refund'));

// GIGS
router.get('/gigs', stub('List gigs'));
router.get('/gigs/search', stub('Search gigs'));
router.get('/gigs/:id', stub('Get gig'));
router.post('/gigs', requireAuth, stub('Create gig'));
router.put('/gigs/:id', requireAuth, stub('Update gig'));
router.delete('/gigs/:id', requireAuth, stub('Delete gig'));

// BLOCKCHAIN CERTIFICATES
router.get('/certificates/:id', stub('Get certificate'));
router.post('/certificates/verify', stub('Verify certificate'));
router.get('/certificates/user/:userId', requireAuth, stub('My certificates'));

// PAYMENTS
router.post('/payments/intent', requireAuth, stub('Create payment intent'));
router.post('/payments/webhook', stub('Stripe webhook'));
router.get('/payments/history', requireAuth, stub('Payment history'));

// ADMIN
router.get('/admin/users', requireAuth, requireRole('admin'), stub('List users'));
router.put('/admin/users/:id/ban', requireAuth, requireRole('admin'), stub('Ban user'));
router.get('/admin/products', requireAuth, requireRole('admin'), stub('Moderate products'));
router.delete('/admin/products/:id', requireAuth, requireRole('admin'), stub('Remove product'));
router.get('/admin/analytics', requireAuth, requireRole('admin'), stub('Analytics'));

export default router;
EOF

echo "📝 Creating src/index.ts..."
cat > src/index.ts << 'EOF'
// src/index.ts — DevChain API Entry Point
import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env.js';
import { redis } from './config/redis.js';
import { globalLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import apiRoutes from './routes/index.js';

const app = express();

// Security headers
app.use(helmet());

// CORS
const allowedOrigins = env.NODE_ENV === 'production'
  ? ['https://devchain.app', 'https://www.devchain.app']
  : ['http://localhost:8081', 'http://localhost:3001', 'http://localhost:19006'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
app.use(globalLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Health check — no auth, no rate limit
app.get('/health', async (_req: Request, res: Response) => {
  let redisStatus = 'ok';
  try { await redis.ping(); } catch { redisStatus = 'error'; }
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    services: { redis: redisStatus },
  });
});

// API routes
app.use('/api', apiRoutes);

// 404
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Error handler (must be last)
app.use(errorHandler);

// Start
const PORT = parseInt(env.PORT, 10);
app.listen(PORT, () => {
  console.log(`\n🚀 DevChain API running`);
  console.log(`   Environment : ${env.NODE_ENV}`);
  console.log(`   Port        : ${PORT}`);
  console.log(`   Health      : http://localhost:${PORT}/health`);
  console.log(`   API         : http://localhost:${PORT}/api\n`);
});

export default app;
EOF

echo ""
echo "✅ All source files created successfully!"
echo ""
echo "Now run:"
echo "  npm install"
echo "  npm run dev"
