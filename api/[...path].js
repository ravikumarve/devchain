// Load env
require('dotenv').config({ path: require('path').resolve(__dirname, '../backend/.env') });

// The Express app IS a request handler — export it directly
const app = require('../backend/src/index');

// Vercel passes (req, res) — Express handles them natively
module.exports = app;
