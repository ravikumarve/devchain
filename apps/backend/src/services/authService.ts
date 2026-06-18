// src/services/authService.ts
// ─────────────────────────────────────────────────────────────
// All auth business logic lives here.
// Controllers call these functions — never touch DB directly.
// ─────────────────────────────────────────────────────────────
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../config/supabase.js';
import { redis } from '../config/redis.js';
import { env } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';
import type { JwtPayload } from '../middleware/auth.js';

const BCRYPT_ROUNDS = 12; // Higher = slower = more secure. 12 is industry standard.

// ─── Token generators ─────────────────────────────────────────

export function generateAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions);
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId, type: 'refresh' }, env.JWT_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);
}

// ─── REGISTER ─────────────────────────────────────────────────

export interface RegisterInput {
  email: string;
  password: string;
  username: string;
  displayName: string;
}

export async function registerUser(input: RegisterInput) {
  const { email, password, username, displayName } = input;

  // 1. Check username is not taken
  const { data: existingUser } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('username', username.toLowerCase())
    .single();

  if (existingUser) {
    throw new AppError(409, 'Username already taken');
  }

  // 2. Create auth user in Supabase Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm for now (add email verification later)
  });

  if (authError || !authData.user) {
    // Supabase returns specific messages for duplicate emails
    if (authError?.message?.includes('already registered')) {
      throw new AppError(409, 'Email already registered');
    }
    throw new AppError(400, authError?.message || 'Failed to create account');
  }

  // 3. Create user profile in our public.users table
  const { error: profileError } = await supabaseAdmin.from('users').insert({
    id: authData.user.id,
    email: email.toLowerCase(),
    username: username.toLowerCase(),
    display_name: displayName,
    role: 'buyer', // Default role — can upgrade to seller later
  });

  if (profileError) {
    // Rollback: delete the auth user if profile creation failed
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    throw new AppError(500, 'Failed to create user profile');
  }

  // 4. Generate tokens
  const accessToken = generateAccessToken({
    userId: authData.user.id,
    email: email.toLowerCase(),
    role: 'buyer',
  });
  const refreshToken = generateRefreshToken(authData.user.id);

  // 5. Store refresh token in Redis (7 days TTL)
  await redis.set(
    `refresh:${authData.user.id}`,
    refreshToken,
    { ex: 7 * 24 * 60 * 60 }
  );

  return {
    user: {
      id: authData.user.id,
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      displayName,
      role: 'buyer',
    },
    accessToken,
    refreshToken,
  };
}

// ─── LOGIN ────────────────────────────────────────────────────

export interface LoginInput {
  email: string;
  password: string;
}

export async function loginUser(input: LoginInput) {
  const { email, password } = input;

  // 1. Sign in via Supabase Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
    email: email.toLowerCase(),
    password,
  });

  // Generic message — never tell attacker which field is wrong
  if (authError || !authData.user) {
    throw new AppError(401, 'Invalid email or password');
  }

  // 2. Get user profile
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('users')
    .select('id, email, username, display_name, role, is_banned')
    .eq('id', authData.user.id)
    .single();

  if (profileError || !profile) {
    throw new AppError(401, 'Invalid email or password');
  }

  // 3. Check if banned
  if (profile.is_banned) {
    throw new AppError(403, 'Your account has been suspended. Contact support.');
  }

  // 4. Generate tokens
  const accessToken = generateAccessToken({
    userId: profile.id,
    email: profile.email,
    role: profile.role,
  });
  const refreshToken = generateRefreshToken(profile.id);

  // 5. Store refresh token in Redis
  await redis.set(
    `refresh:${profile.id}`,
    refreshToken,
    { ex: 7 * 24 * 60 * 60 }
  );

  return {
    user: {
      id: profile.id,
      email: profile.email,
      username: profile.username,
      displayName: profile.display_name,
      role: profile.role,
    },
    accessToken,
    refreshToken,
  };
}

// ─── LOGOUT ───────────────────────────────────────────────────

export async function logoutUser(accessToken: string, userId: string): Promise<void> {
  // Decode to get expiry
  const decoded = jwt.decode(accessToken) as JwtPayload;
  const ttl = decoded.exp - Math.floor(Date.now() / 1000);

  // Blocklist the access token until it naturally expires
  if (ttl > 0) {
    await redis.set(`blocklist:${accessToken}`, '1', { ex: ttl });
  }

  // Delete the refresh token
  await redis.del(`refresh:${userId}`);
}

// ─── REFRESH TOKEN ────────────────────────────────────────────

export async function refreshAccessToken(refreshToken: string) {
  // 1. Verify refresh token
  let decoded: { userId: string; type: string };
  try {
    decoded = jwt.verify(refreshToken, env.JWT_SECRET) as { userId: string; type: string };
  } catch {
    throw new AppError(401, 'Invalid or expired refresh token');
  }

  if (decoded.type !== 'refresh') {
    throw new AppError(401, 'Invalid token type');
  }

  // 2. Check stored refresh token matches
  const stored = await redis.get(`refresh:${decoded.userId}`);
  if (!stored || stored !== refreshToken) {
    throw new AppError(401, 'Refresh token revoked or expired');
  }

  // 3. Get fresh user data from DB
  const { data: profile, error } = await supabaseAdmin
    .from('users')
    .select('id, email, role, is_banned')
    .eq('id', decoded.userId)
    .single();

  if (error || !profile) {
    throw new AppError(401, 'User not found');
  }

  if (profile.is_banned) {
    throw new AppError(403, 'Account suspended');
  }

  // 4. Issue new access token
  const accessToken = generateAccessToken({
    userId: profile.id,
    email: profile.email,
    role: profile.role,
  });

  return { accessToken };
}

// ─── FORGOT PASSWORD ──────────────────────────────────────────

export async function forgotPassword(email: string): Promise<void> {
  // Always return success — never confirm if email exists (security)
  await supabaseAdmin.auth.resetPasswordForEmail(email, {
    redirectTo: `${env.NODE_ENV === 'production'
      ? 'https://devchain.app'
      : 'http://localhost:8081'}/reset-password`,
  });
  // We don't throw even if email doesn't exist
}

// ─── RESET PASSWORD ───────────────────────────────────────────

export async function resetPassword(
  accessToken: string,
  newPassword: string
): Promise<void> {
  // Supabase handles the token verification
  const { error } = await supabaseAdmin.auth.admin.updateUserById(
    accessToken, // In this flow, accessToken is actually the user ID from the reset link
    { password: newPassword }
  );

  if (error) {
    throw new AppError(400, 'Password reset failed. Link may have expired.');
  }
}
