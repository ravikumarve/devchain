#!/usr/bin/env node
/**
 * DevChain — one-command LOCAL setup (zero dependencies, no Docker).
 *
 *   npm run setup:local
 *
 * What it does:
 *   1. Creates backend/.env + apps/web/.env from examples (never overwrites)
 *   2. Installs workspace dependencies (npm install)
 *   3. Switches Prisma to SQLite mode + generates client
 *   4. Pushes the schema into a local SQLite file (backend/prisma/dev.db)
 *   5. Seeds demo users, products & jobs (bcrypt passwords, local auth)
 *   6. Ensures the local uploads directory exists
 *   7. Prints the commands to start backend + web
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BACKEND_ENV = path.join(ROOT, 'backend', '.env');
const WEB_ENV = path.join(ROOT, 'apps', 'web', '.env');
const UPLOADS_DIR = path.join(ROOT, 'backend', 'uploads');

function run(cmd, cwd = ROOT) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { cwd, stdio: 'inherit', env: process.env });
}

function copyIfMissing(src, dest, label) {
  if (fs.existsSync(dest)) {
    console.log(`  ℹ️  ${label} already exists — keeping it (${dest})`);
    return;
  }
  fs.copyFileSync(src, dest);
  console.log(`  ✅ Created ${label} → ${dest}`);
}

console.log('╔════════════════════════════════════════════╗');
console.log('║  DevChain — Local Setup (SQLite, no Docker) ║');
console.log('╚════════════════════════════════════════════╝');

// 1. Environment files
copyIfMissing(
  path.join(ROOT, 'backend', '.env.example'),
  BACKEND_ENV,
  'backend/.env'
);
copyIfMissing(
  path.join(ROOT, 'apps', 'web', '.env.example'),
  WEB_ENV,
  'apps/web/.env'
);

// 2. Install dependencies
console.log('\n📦 Installing dependencies (this can take a few minutes)...');
run('npm install');

// 3. Switch Prisma to SQLite + generate client
console.log('\n🔀 Switching to SQLite mode...');
run('node scripts/db-mode.js sqlite');

// 4. Push schema into local SQLite file
console.log('\n🗄️  Creating local database...');
run('npx prisma db push --schema=backend/prisma/schema.sqlite.prisma --skip-generate');

// 5. Seed demo data
console.log('\n🌱 Seeding demo data...');
run('node backend/seed.js');

// 6. Local uploads directory
fs.mkdirSync(UPLOADS_DIR, { recursive: true });
console.log('\n📁 Ensured backend/uploads/ exists for local file storage');

console.log('\n╔════════════════════════════════════════════╗');
console.log('║  ✅ Local setup complete!                  ║');
console.log('╚════════════════════════════════════════════╝');
console.log('\nStart the backend:');
console.log('  npm run dev --prefix backend   (or: cd backend && npm run dev)');
console.log('\nStart the web app:');
console.log('  npm run dev --prefix apps/web  (or: cd apps/web && npm run dev)');
console.log('\nOpen http://localhost:5173 and login with:');
console.log('  demo-seller@devchain.dev / Demo1234');
console.log('  demo-client@devchain.dev / Demo1234');
console.log('  demo-buyer@devchain.dev  / Demo1234');
console.log('\nTo switch to cloud mode later: npm run db:postgres');
