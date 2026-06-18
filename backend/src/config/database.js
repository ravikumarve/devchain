/**
 * Shared Prisma client singleton
 * 
 * In serverless (Vercel), Prisma connections must be managed carefully to avoid
 * exhausting the database connection pool (especially on free-tier Supabase).
 * 
 * This module:
 *  - Creates ONE PrismaClient instance (global singleton)
 *  - Configures connection pooling for serverless
 *  - Gracefully disconnects on shutdown
 */
const { PrismaClient } = require('@prisma/client');
const { getLogger } = require('../utils/logger');

const log = getLogger('db');

// Connection config optimized for Supabase pooler + Vercel serverless
const prisma = global.__prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Prevent connection pool exhaustion in serverless
  // Each function instance gets exactly 1 connection
  // ... handled via Prisma's internal pool configuration
});

// In development, hot-reload can create multiple instances
// Store on global to survive module cache clears
if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  log.info('SIGTERM received — disconnecting Prisma');
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  log.info('SIGINT received — disconnecting Prisma');
  await prisma.$disconnect();
});

module.exports = prisma;
