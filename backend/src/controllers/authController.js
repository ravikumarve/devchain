const prisma = require('../config/database');
const { supabase } = require('../config/supabase');
const { getLogger } = require('../utils/logger');
const asyncHandler = require('../utils/asyncHandler');
const {
  BadRequestError,
  UnauthorizedError,
  ConflictError,
} = require('../utils/errors');

const log = getLogger('auth');

// ── Helper: safe user object (never expose sensitive fields) ──
const safeUser = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  bio: user.bio,
  avatarUrl: user.avatarUrl,
  reputationScore: user.reputationScore,
  isEmailVerified: user.isEmailVerified,
  createdAt: user.createdAt,
});

// ────────────────────────────────────────────────
// REGISTER
// ────────────────────────────────────────────────
const register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  // ── Validation ──
  if (!username || !email || !password) {
    throw new BadRequestError('Username, email and password are required.');
  }
  if (username.length < 3 || username.length > 30) {
    throw new BadRequestError('Username must be between 3 and 30 characters.');
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    throw new BadRequestError('Username can only contain letters, numbers and underscores.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new BadRequestError('Please provide a valid email address.');
  }
  if (password.length < 8) {
    throw new BadRequestError('Password must be at least 8 characters.');
  }
  if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
    throw new BadRequestError('Password must contain at least 1 letter and 1 number.');
  }

  const normalizedEmail = email.toLowerCase();
  const normalizedUsername = username.toLowerCase();

  // ── Check uniqueness in public.users ──
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: normalizedEmail },
        { username: normalizedUsername },
      ],
    },
  });

  if (existingUser) {
    if (existingUser.email === normalizedEmail) {
      throw new ConflictError('An account with this email already exists.');
    }
    throw new ConflictError('This username is already taken.');
  }

  // ── Create user in Supabase Auth ──
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: normalizedEmail,
    password,
    email_confirm: true, // auto-confirm so they can login immediately
    user_metadata: { username: normalizedUsername },
  });

  if (authError) {
    // Handle Supabase-specific errors (e.g., duplicate email in auth.users)
    if (authError.message?.includes('already registered') || authError.message?.includes('duplicate')) {
      throw new ConflictError('An account with this email already exists.');
    }
    log.error({ err: authError }, 'Supabase Auth createUser failed');
    throw new BadRequestError('Registration failed. Please try again.');
  }

  const authUserId = authData.user.id;

  // ── Create profile in public.users ──
  const user = await prisma.user.create({
    data: {
      id: authUserId, // same ID as auth.users for JOINs
      username: normalizedUsername,
      email: normalizedEmail,
      // passwordHash handled by Supabase Auth
    },
  }).catch(async (prismaErr) => {
    // Rollback: delete the auth user if profile creation fails
    log.error({ err: prismaErr }, 'Profile creation failed, rolling back auth user');
    await supabase.auth.admin.deleteUser(authUserId).catch(() => {});
    throw new BadRequestError('Registration failed. Please try again.');
  });

  // ── Sign them in to get session tokens ──
  const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (sessionError) {
    // User was created but we can't sign them in — rare edge case
    log.error({ err: sessionError }, 'Auto-login after registration failed');
    // Return user data but tell them to login manually
    return res.status(201).json({
      message: 'Account created successfully! Please login to continue.',
      user: safeUser(user),
      autoLoginFailed: true,
    });
  }

  log.info({ userId: user.id }, 'User registered successfully');

  res.status(201).json({
    message: 'Account created successfully! Welcome to DevChain.',
    user: safeUser(user),
    accessToken: sessionData.session.access_token,
    refreshToken: sessionData.session.refresh_token,
  });
});

// ────────────────────────────────────────────────
// LOGIN
// ────────────────────────────────────────────────
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new BadRequestError('Email and password are required.');
  }

  // ── Authenticate via Supabase Auth ──
  const { data: sessionData, error: authError } = await supabase.auth.signInWithPassword({
    email: email.toLowerCase(),
    password,
  });

  if (authError) {
    log.warn({ email: email.toLowerCase() }, 'Login failed');
    throw new UnauthorizedError('Invalid email or password.');
  }

  const authUserId = sessionData.user.id;

  // ── Fetch profile from public.users ──
  const user = await prisma.user.findUnique({
    where: { id: authUserId },
  });

  if (!user || !user.isActive) {
    // User exists in auth.users but not in public.users or is deactivated
    log.warn({ authUserId }, 'User authenticated but profile missing or inactive');
    throw new UnauthorizedError('Invalid email or password.');
  }

  log.info({ userId: user.id }, 'User logged in');

  res.json({
    message: 'Welcome back to DevChain!',
    user: safeUser(user),
    accessToken: sessionData.session.access_token,
    refreshToken: sessionData.session.refresh_token,
  });
});

// ────────────────────────────────────────────────
// GET CURRENT USER
// ────────────────────────────────────────────────
const getMe = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
  });

  if (!user) {
    throw new UnauthorizedError('User not found. Please login again.');
  }

  res.json({ user: safeUser(user) });
});

// ────────────────────────────────────────────────
// REFRESH TOKEN
// Uses Supabase session refresh instead of custom JWT rotation
// ────────────────────────────────────────────────
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    throw new BadRequestError('Refresh token is required.');
  }

  const { data: sessionData, error } = await supabase.auth.refreshSession({
    refresh_token: token,
  });

  if (error || !sessionData.session) {
    if (error?.message?.includes('expired') || error?.message?.includes('invalid')) {
      throw new UnauthorizedError('Session expired. Please login again.');
    }
    log.error({ err: error }, 'Token refresh failed');
    throw new UnauthorizedError('Invalid refresh token. Please login again.');
  }

  log.info('Tokens refreshed');

  res.json({
    accessToken: sessionData.session.access_token,
    refreshToken: sessionData.session.refresh_token,
  });
});

module.exports = { register, login, getMe, refreshToken };
