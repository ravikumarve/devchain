/**
 * Shared auth/storage clients for DevChain backend.
 *
 * TWO MODES:
 *  - CLOUD (production): real Supabase clients using service_role / anon keys
 *  - LOCAL (dev): when Supabase credentials are absent, auth transparently
 *    falls back to the local JWT + bcrypt provider so the whole stack runs
 *    with zero external dependencies (SQLite + local disk).
 *
 * Clients exposed:
 *  - adminClient: service_role (bypasses RLS, server-side operations)
 *  - anonClient:  anon key (respects RLS, user-facing operations)
 *  - supabase:    alias of adminClient
 */
const { createClient } = require('@supabase/supabase-js');
const { getLogger } = require('../utils/logger');

const log = getLogger('supabase');

const supabaseUrl = (process.env.SUPABASE_URL || '').trim();
const serviceRoleKey = (process.env.SUPABASE_SERVICE_KEY || '').trim();

const isCloudAuth = Boolean(supabaseUrl && serviceRoleKey);

let adminClient;
let anonClient;
let supabase;

// ── LOCAL MODE — no Supabase credentials → local JWT/bcrypt auth provider ──
if (!isCloudAuth) {
  const { auth } = require('../services/localAuthProvider');
  log.warn('Supabase credentials not configured — using LOCAL auth provider (JWT + bcrypt). Configure SUPABASE_URL + SUPABASE_SERVICE_KEY for cloud mode.');
  adminClient = { auth };
  anonClient = { auth };
  supabase = { auth };
} else {
  // ── CLOUD MODE — real Supabase clients ──

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

  adminClient = createClient(supabaseUrl, serviceRoleKey, sharedOptions);

  // Anon client for operations that should respect RLS
  anonClient = createClient(supabaseUrl, (process.env.SUPABASE_ANON_KEY || serviceRoleKey).trim(), sharedOptions);
  supabase = adminClient;
}

module.exports = { supabase, adminClient, anonClient, isCloudAuth };
