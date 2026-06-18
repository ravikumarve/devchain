// src/controllers/authController.ts
// ─────────────────────────────────────────────────────────────
// Handles HTTP layer only — validates input, calls service,
// returns response. No business logic here.
// ─────────────────────────────────────────────────────────────
import { Request, Response } from 'express';
import { z } from 'zod';
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
} from '../services/authService.js';

// ─── Validation schemas ───────────────────────────────────────

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, _ and -'),
  displayName: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be at most 50 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

const forgotSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const resetSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

// ─── Controllers ──────────────────────────────────────────────

export async function register(req: Request, res: Response): Promise<void> {
  const input = registerSchema.parse(req.body); // throws ZodError if invalid
  const result = await registerUser(input);

  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    data: result,
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const input = loginSchema.parse(req.body);
  const result = await loginUser(input);

  res.json({
    success: true,
    message: 'Logged in successfully',
    data: result,
  });
}

export async function logout(req: Request, res: Response): Promise<void> {
  const token = req.headers.authorization!.split(' ')[1];
  await logoutUser(token, req.user!.userId);

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const { refreshToken } = refreshSchema.parse(req.body);
  const result = await refreshAccessToken(refreshToken);

  res.json({
    success: true,
    data: result,
  });
}

export async function forgot(req: Request, res: Response): Promise<void> {
  const { email } = forgotSchema.parse(req.body);
  await forgotPassword(email);

  // Always return success — never reveal if email exists
  res.json({
    success: true,
    message: 'If that email exists, a reset link has been sent.',
  });
}

export async function reset(req: Request, res: Response): Promise<void> {
  const { token, password } = resetSchema.parse(req.body);
  await resetPassword(token, password);

  res.json({
    success: true,
    message: 'Password reset successfully. Please log in.',
  });
}
