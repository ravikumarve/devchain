/**
 * Shared Supabase clients for DevChain backend
 * 
 * Two clients:
 * - adminClient: Uses service_role key (bypasses RLS, for server-side operations)
 * - anonClient: Uses anon key (respects RLS, for user-facing operations)
 */
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase credentials — SUPABASE_URL and SUPABASE_SERVICE_KEY required');
}

// Provide ws polyfill for Node 20 which lacks native WebSocket.
// Supabase Realtime client requires WebSocket for its transport.
let WebSocket;
try {
  WebSocket = require('ws');
} catch {
  // ws might not be installed — fall back to global WebSocket (Node 22+)
}

const sharedOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  realtime: WebSocket ? { transport: WebSocket } : { enabled: false },
};

const adminClient = createClient(supabaseUrl, serviceRoleKey, sharedOptions);

// Anon client for operations that should respect RLS
const anonClient = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY || serviceRoleKey, sharedOptions);

module.exports = { supabase: adminClient, adminClient, anonClient };
