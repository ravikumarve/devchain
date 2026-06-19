// Load env
require('dotenv').config({ path: require('path').resolve(__dirname, '../backend/.env') });

// ── Pre-test: verify env var integrity and supabase client creation ──
let supaTest = null;
try {
  const suVal = process.env.SUPABASE_SERVICE_KEY;
  // Validate the key character by character
  const keyInfo = {
    exists: suVal !== undefined,
    type: typeof suVal,
    len: suVal ? suVal.length : 0,
    isString: typeof suVal === 'string',
    startsCorrectly: suVal ? suVal.startsWith('eyJ') : false,
    endsCorrectly: suVal ? suVal.endsWith('EfA') : false,
    hasNewline: suVal ? suVal.includes('\n') : false,
    charCodes: suVal ? [suVal.charCodeAt(0), suVal.charCodeAt(1), suVal.charCodeAt(suVal.length-1)] : [],
    equalsLocal: false,
    localTest: null,
  };
  
  // Try creating a supabase client
  try {
    const { createClient } = require('@supabase/supabase-js');
    const testOpts = { auth: { autoRefreshToken: false, persistSession: false }, realtime: { enabled: false } };
    createClient(process.env.SUPABASE_URL || '', suVal || '', testOpts);
    keyInfo.clientOk = true;
  } catch (clientErr) {
    keyInfo.clientOk = false;
    keyInfo.clientError = clientErr.message;
  }
  
  supaTest = keyInfo;
} catch (e) {
  supaTest = { error: e.message };
}

// The Express app IS a request handler — export it directly
let app;
try {
  app = require('../backend/src/index');
} catch (err) {
  console.error('Vercel function: FAILED to load backend module:', err.message, err.stack);
  // Fallback handler for initialization failures
  app = (req, res) => {
    res.status(500).json({
      error: 'Backend module failed to initialize',
      code: 'MODULE_INIT_ERROR',
      message: err.message,
      diagnostics: supaTest,
    });
  };
}

// Vercel passes (req, res) — Express handles them natively
module.exports = app;
