// Load env
require('dotenv').config({ path: require('path').resolve(__dirname, '../backend/.env') });

// ── Diagnostics: catch module load errors and return them as JSON ──
let app;
try {
  // The Express app IS a request handler — export it directly
  app = require('../backend/src/index');
  console.log('Vercel function: backend module loaded successfully');
} catch (err) {
  console.error('Vercel function: FAILED to load backend module:', err);
  // Export a fallback handler that returns the error
  app = (req, res) => {
    res.status(500).json({
      error: 'Backend module failed to initialize',
      code: 'MODULE_INIT_ERROR',
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
  };
}

// Vercel passes (req, res) — Express handles them natively
module.exports = app;
