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
