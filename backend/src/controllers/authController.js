const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

// ── Helper: generate tokens ──
const generateTokens = (userId, email) => {
  const accessToken = jwt.sign(
    { userId, email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
  const refreshToken = jwt.sign(
    { userId, email },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
  return { accessToken, refreshToken };
};

// ── Helper: safe user object (never return password) ──
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
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // ── Validation ──
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email and password are required.' });
    }
    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({ error: 'Username must be between 3 and 30 characters.' });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ error: 'Username can only contain letters, numbers and underscores.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    // ── Check if user already exists ──
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { username: username.toLowerCase() }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }
      return res.status(409).json({ error: 'This username is already taken.' });
    }

    // ── Hash password ──
    const passwordHash = await bcrypt.hash(password, 12);

    // ── Create user ──
    const user = await prisma.user.create({
      data: {
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        passwordHash,
      }
    });

    // ── Generate tokens ──
    const { accessToken, refreshToken } = generateTokens(user.id, user.email);

    res.status(201).json({
      message: 'Account created successfully! Welcome to DevChain.',
      user: safeUser(user),
      accessToken,
      refreshToken,
    });

  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

// ────────────────────────────────────────────────
// LOGIN
// ────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ── Validation ──
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // ── Find user ──
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // ── Check password ──
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // ── Generate tokens ──
    const { accessToken, refreshToken } = generateTokens(user.id, user.email);

    res.json({
      message: 'Welcome back to DevChain!',
      user: safeUser(user),
      accessToken,
      refreshToken,
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

// ────────────────────────────────────────────────
// GET CURRENT USER (me)
// ────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ user: safeUser(user) });

  } catch (err) {
    console.error('GetMe error:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// ────────────────────────────────────────────────
// REFRESH TOKEN
// ────────────────────────────────────────────────
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required.' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.userId, decoded.email);

    res.json({ accessToken, refreshToken: newRefreshToken });

  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired refresh token. Please login again.' });
  }
};

module.exports = { register, login, getMe, refreshToken };
