/**
 * Environment variable validation and configuration
 * Validates required variables at startup and provides defaults
 */
const { logger } = require('../utils/logger');

const REQUIRED_VARS = [
  { name: 'DATABASE_URL', description: 'PostgreSQL connection string (Prisma)' },
  { name: 'JWT_SECRET', description: 'JWT signing secret (min 32 chars)' },
  { name: 'SUPABASE_URL', description: 'Supabase project URL' },
  { name: 'SUPABASE_SERVICE_KEY', description: 'Supabase service role key' },
];

const OPTIONAL_VARS = [
  { name: 'JWT_REFRESH_SECRET', description: 'JWT refresh token secret (defaults to JWT_SECRET if unset)' },
  { name: 'JWT_EXPIRES_IN', description: 'Access token expiry', default: '15m' },
  { name: 'JWT_REFRESH_EXPIRES_IN', description: 'Refresh token expiry', default: '7d' },
  { name: 'PORT', description: 'Server port', default: '10000' },
  { name: 'NODE_ENV', description: 'Environment', default: 'development' },
  { name: 'FRONTEND_URL', description: 'Frontend URL for CORS', default: 'http://localhost:5173' },
  { name: 'STRIPE_SECRET_KEY', description: 'Stripe secret key' },
  { name: 'STRIPE_WEBHOOK_SECRET', description: 'Stripe webhook signing secret' },
  { name: 'OWNERSHIP_HASH_SECRET', description: 'Secret for ownership hash generation' },
  { name: 'SMTP_HOST', description: 'SMTP server host', default: 'smtp.gmail.com' },
  { name: 'SMTP_PORT', description: 'SMTP server port', default: '587' },
  { name: 'SMTP_USER', description: 'SMTP username/email' },
  { name: 'SMTP_PASS', description: 'SMTP password' },
];

function validateEnv() {
  const missing = [];

  for (const varDef of REQUIRED_VARS) {
    if (!process.env[varDef.name]) {
      missing.push(`  ❌ ${varDef.name} — ${varDef.description}`);
    }
  }

  if (missing.length > 0) {
    logger.error('Missing required environment variables:\n' + missing.join('\n'));
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      logger.warn('Running in development mode with missing env vars — this may cause runtime errors');
    }
  }

  // Apply defaults for optional vars
  for (const varDef of OPTIONAL_VARS) {
    if (!process.env[varDef.name] && varDef.default) {
      process.env[varDef.name] = varDef.default;
    }
  }

  // If JWT_REFRESH_SECRET is not set, derive it from JWT_SECRET
  if (!process.env.JWT_REFRESH_SECRET) {
    process.env.JWT_REFRESH_SECRET = process.env.JWT_SECRET + '_refresh';
    logger.warn('JWT_REFRESH_SECRET not set — derived from JWT_SECRET (less secure)');
  }

  // Validate JWT_SECRET length
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    logger.warn('JWT_SECRET is less than 32 characters — consider using a longer secret');
  }

  logger.info({
    env: process.env.NODE_ENV,
    port: process.env.PORT,
    frontendUrl: process.env.FRONTEND_URL,
    hasStripe: !!process.env.STRIPE_SECRET_KEY,
    hasSupabase: !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY),
    hasSmtp: !!(process.env.SMTP_USER && process.env.SMTP_PASS),
  }, 'Environment validated');

  return true;
}

module.exports = { validateEnv };
