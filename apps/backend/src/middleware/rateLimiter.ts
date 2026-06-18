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
