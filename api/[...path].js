// Load env
require('dotenv').config({ path: require('path').resolve(__dirname, '../backend/.env') });

// The Express app IS a request handler — export it directly
let app;
try {
  app = require('../backend/src/index');
} catch (err) {
  console.error('Vercel function: FAILED to load backend module:', err.message);
  // Fallback handler for initialization failures
  app = (req, res) => {
    res.status(500).json({
      error: 'Backend module failed to initialize',
      code: 'MODULE_INIT_ERROR',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    });
  };
}

// Vercel passes (req, res) — Express handles them natively
module.exports = app;
