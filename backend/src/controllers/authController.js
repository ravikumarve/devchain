const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();
const { getLogger } = require('../utils/logger');
const asyncHandler = require('../utils/asyncHandler');
const {
  BadRequestError,
  UnauthorizedError,
  ConflictError,
} = require('../utils/errors');

const log = getLogger('auth');

// ── Constants ──
const BCRYPT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// ── Helper: generate token pair ──
const generateTokens = (userId, email) => {
  const accessToken = jwt.sign(
    { userId, email },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
  const refreshToken = jwt.sign(
    { userId, email, tokenId: crypto.randomUUID() },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
  return { accessToken, refreshToken };
};

// ── Helper: safe user object (never expose password) ──
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

  // ── Check uniqueness ──
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() },
      ],
    },
  });

  if (existingUser) {
    if (existingUser.email === email.toLowerCase()) {
      throw new ConflictError('An account with this email already exists.');
    }
    throw new ConflictError('This username is already taken.');
  }

  // ── Create user ──
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      passwordHash,
    },
  });

  const { accessToken, refreshToken } = generateTokens(user.id, user.email);

  log.info({ userId: user.id }, 'User registered successfully');

  res.status(201).json({
    message: 'Account created successfully! Welcome to DevChain.',
    user: safeUser(user),
    accessToken,
    refreshToken,
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

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user || !user.isActive) {
    throw new UnauthorizedError('Invalid email or password.');
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid email or password.');
  }

  const { accessToken, refreshToken } = generateTokens(user.id, user.email);

  log.info({ userId: user.id }, 'User logged in');

  res.json({
    message: 'Welcome back to DevChain!',
    user: safeUser(user),
    accessToken,
    refreshToken,
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
// ────────────────────────────────────────────────
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    throw new BadRequestError('Refresh token is required.');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Session expired. Please login again.');
    }
    throw new UnauthorizedError('Invalid refresh token. Please login again.');
  }

  // Issue new token pair (rotation)
  const tokens = generateTokens(decoded.userId, decoded.email);

  log.info({ userId: decoded.userId }, 'Tokens refreshed');

  res.json({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  });
});

module.exports = { register, login, getMe, refreshToken };
