// Load env
require('dotenv').config({ path: require('path').resolve(__dirname, '../backend/.env') });

// ── Diagnostics: catch module load errors and return them as JSON ──
let app;
try {
  // Log env var presence (not values) for debugging
  console.log('Vercel function env check:', JSON.stringify({
    NODE_ENV: process.env.NODE_ENV,
    hasJWT: !!process.env.JWT_SECRET,
    hasDB: !!process.env.DATABASE_URL,
    hasSU: !!process.env.SUPABASE_URL,
    hasSUKey: !!process.env.SUPABASE_SERVICE_KEY,
    SU_len: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.length : 0,
    SUKey_len: process.env.SUPABASE_SERVICE_KEY ? process.env.SUPABASE_SERVICE_KEY.length : 0,
  }));

  // The Express app IS a request handler — export it directly
  app = require('../backend/src/index');
  console.log('Vercel function: backend module loaded successfully');
} catch (err) {
  console.error('Vercel function: FAILED to load backend module:', err.message, err.stack);
  // Export a fallback handler that returns the error
  app = (req, res) => {
    res.status(500).json({
      error: 'Backend module failed to initialize',
      code: 'MODULE_INIT_ERROR',
      message: err.message,
      details: {
        NODE_ENV: process.env.NODE_ENV,
        hasJWT: !!process.env.JWT_SECRET,
        hasDB: !!process.env.DATABASE_URL,
        hasSU: !!process.env.SUPABASE_URL,
        hasSUKey: !!process.env.SUPABASE_SERVICE_KEY,
        SU_len: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.length : 0,
        SUKey_len: process.env.SUPABASE_SERVICE_KEY ? process.env.SUPABASE_SERVICE_KEY.length : 0,
      },
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
  };
}

// Vercel passes (req, res) — Express handles them natively
module.exports = app;
