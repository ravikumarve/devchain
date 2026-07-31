/**
 * Local auth provider — zero-dependency authentication for LOCAL MODE.
 *
 * Mirrors the exact subset of the Supabase Auth API surface used by this
 * codebase (createUser, deleteUser, signInWithPassword, refreshSession,
 * getUser) so controllers and middleware work unchanged in both modes.
 *
 * Passwords are hashed with bcrypt and stored in users.passwordHash.
 * Sessions are standard JWT access + refresh tokens signed with JWT_SECRET.
 *
 * ⚠️ LOCAL MODE ONLY — production must use Supabase Auth (see config/supabase.js)
 */
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = require('../config/database');
const { getLogger } = require('../utils/logger');

const log = getLogger('auth-local');

const ACCESS_SECRET = process.env.JWT_SECRET || 'dev-local-insecure-secret-change-me';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || `${ACCESS_SECRET}_refresh`;
const ACCESS_EXPIRES = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

function signAccess(user) {
  return jwt.sign({ sub: user.id, email: user.email, type: 'access' }, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRES,
  });
}

function signRefresh(user) {
  return jwt.sign({ sub: user.id, type: 'refresh', jti: crypto.randomUUID() }, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES,
  });
}

const auth = {
  admin: {
    // Profile row is created afterwards by the controller with this id.
    createUser: async () => ({ data: { user: { id: crypto.randomUUID() } }, error: null }),
    deleteUser: async () => ({ data: null, error: null }),
  },

  signInWithPassword: async ({ email, password }) => {
    const user = await prisma.user.findUnique({
      where: { email: (email || '').toLowerCase() },
    });

    if (!user || !user.passwordHash) {
      return { data: null, error: { message: 'Invalid login credentials' } };
    }

    const valid = await bcrypt.compare(password || '', user.passwordHash);
    if (!valid) {
      return { data: null, error: { message: 'Invalid login credentials' } };
    }

    return {
      data: {
        session: {
          access_token: signAccess(user),
          refresh_token: signRefresh(user),
        },
        user: { id: user.id, email: user.email },
      },
      error: null,
    };
  },

  refreshSession: async ({ refresh_token }) => {
    try {
      const payload = jwt.verify(refresh_token, REFRESH_SECRET);
      if (payload.type !== 'refresh') {
        return { data: null, error: { message: 'Invalid refresh token' } };
      }

      const user = await prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) {
        return { data: null, error: { message: 'Invalid refresh token' } };
      }

      return {
        data: {
          session: {
            access_token: signAccess(user),
            refresh_token: signRefresh(user),
          },
        },
        error: null,
      };
    } catch (err) {
      return {
        data: null,
        error: { message: err.name === 'TokenExpiredError' ? 'expired refresh token' : 'invalid refresh token' },
      };
    }
  },

  getUser: async (token) => {
    try {
      const payload = jwt.verify(token, ACCESS_SECRET);
      if (payload.type !== 'access') {
        return { data: { user: null }, error: { message: 'invalid token' } };
      }
      return { data: { user: { id: payload.sub, email: payload.email } }, error: null };
    } catch (err) {
      return {
        data: { user: null },
        error: { message: err.name === 'TokenExpiredError' ? 'expired token' : 'invalid token' },
      };
    }
  },
};

module.exports = { auth };
