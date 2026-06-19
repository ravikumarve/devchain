// Load env
require('dotenv').config({ path: require('path').resolve(__dirname, '../backend/.env') });

// The Express app IS a request handler — export it directly
let app;
try {
  app = require('../backend/src/index');
} catch (err) {
  console.error('Vercel function: FAILED to load backend module:', err.message, err.stack);
  // Log env summary for debugging
  console.error('Vercel function env summary:', JSON.stringify({
    NODE_ENV: process.env.NODE_ENV,
    hasJWT: !!process.env.JWT_SECRET,
    hasDB: !!process.env.DATABASE_URL,
    hasSU: !!process.env.SUPABASE_URL,
    hasSUKey: !!process.env.SUPABASE_SERVICE_KEY,
    SU_len: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.length : 0,
    SUKey_len: process.env.SUPABASE_SERVICE_KEY ? process.env.SUPABASE_SERVICE_KEY.length : 0,
  }));
  // Fallback handler for initialization failures
  app = (req, res) => {
    res.status(500).json({
      error: 'Backend module failed to initialize',
      code: 'MODULE_INIT_ERROR',
      message: err.message,
    });
  };
}

// Vercel passes (req, res) — Express handles them natively
module.exports = app;
