// src/middleware/errorHandler.ts
// Central error handler — never exposes stack traces for auth errors.
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

  // ─── Zod validation errors ─────────────────────────────
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
    return;
  }

  // ─── Auth errors — NEVER expose stack, even in dev ─────
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({ success: false, error: 'Invalid token' });
    return;
  }
  if (err.name === 'TokenExpiredError') {
    res.status(401).json({ success: false, error: 'Token expired' });
    return;
  }

  // ─── Our AppError ───────────────────────────────────────
  if (err instanceof AppError) {
    // Auth-related AppErrors (401, 403) never get stack traces
    const isAuthError = err.statusCode === 401 || err.statusCode === 403;
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...(!isAuthError && env.NODE_ENV === 'development' && { stack: err.stack }),
    });
    return;
  }

  // ─── Unknown errors ─────────────────────────────────────
  // Only expose details in development, never in production
  res.status(500).json({
    success: false,
    error: env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
