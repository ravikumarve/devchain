#!/usr/bin/env node
/**
 * Database mode switcher — DevChain dual-mode (SQLite local / PostgreSQL cloud).
 *
 * Usage:
 *   node scripts/db-mode.js sqlite     # local dev — SQLite, zero dependencies
 *   node scripts/db-mode.js postgres   # production — Supabase/PostgreSQL
 *
 * What it does:
 *   1. Picks the matching Prisma schema (schema.sqlite.prisma vs schema.prisma)
 *   2. Persists the active mode to backend/prisma/.active-mode
 *   3. Regenerates the Prisma client with the correct database dialect
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PRISMA_DIR = path.join(ROOT, 'backend', 'prisma');

const MODE = (process.argv[2] || '').trim().toLowerCase();

if (!['sqlite', 'postgres', 'pg', 'supabase', 'local', 'prod'].includes(MODE)) {
  console.error('Usage: node scripts/db-mode.js <sqlite|postgres>');
  process.exit(1);
}

const isSqlite = MODE === 'sqlite' || MODE === 'local';
const schema = isSqlite ? 'schema.sqlite.prisma' : 'schema.prisma';
const schemaRel = `backend/prisma/${schema}`;
const schemaPath = path.join(PRISMA_DIR, schema);

if (!fs.existsSync(schemaPath)) {
  console.error(`Schema not found: backend/prisma/${schema}`);
  process.exit(1);
}

console.log(`\n🔀 Switching Prisma to ${isSqlite ? 'SQLite (local dev)' : 'PostgreSQL (cloud)'} mode...`);
console.log(`   Schema: backend/prisma/${schema}`);

// Persist active mode so other scripts can detect it
fs.writeFileSync(path.join(PRISMA_DIR, '.active-mode'), isSqlite ? 'sqlite' : 'postgres');

// Regenerate the Prisma client with the correct dialect
execSync(`npx prisma generate --schema=${schemaRel}`, { cwd: ROOT, stdio: 'inherit' });

console.log('\n✅ Prisma client regenerated.\n');

if (isSqlite) {
  console.log('Next steps for LOCAL mode:');
  console.log('  1. npx prisma migrate dev --schema=backend/prisma/schema.sqlite.prisma --name init');
  console.log('  2. npm run seed:demo');
  console.log('  3. npm run dev');
} else {
  console.log('Next steps for CLOUD mode:');
  console.log('  1. npx prisma migrate deploy --schema=backend/prisma/schema.prisma');
  console.log('  2. npm start');
}
