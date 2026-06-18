/**
 * Shared Prisma mock factory for integration tests.
 *
 * CRITICAL: All controllers call `new PrismaClient()` at module load time.
 * This factory creates a SINGLE prismaInstance that ALL `new PrismaClient()`
 * calls (controller + test) share, so test code can control mock state
 * that controllers observe.
 *
 * Usage in each test file:
 *   jest.mock('@prisma/client', () => require('../helpers/prismaMock')());
 *   const { PrismaClient } = require('@prisma/client');
 *   const prisma = new PrismaClient();
 *
 * NOTE: `jest.mock` factory only supports arrow functions (hoisted).
 * The require() call works because the factory runs lazily when the
 * module is first imported, at which point require is fully available.
 */

function createMockModel() {
  return {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  };
}

let prismaInstance = null;

function getPrismaInstance() {
  if (!prismaInstance) {
    prismaInstance = {
      user: createMockModel(),
      product: createMockModel(),
      order: createMockModel(),
      ownershipRecord: createMockModel(),
      job: createMockModel(),
      proposal: createMockModel(),
      review: createMockModel(),
      $queryRaw: jest.fn(),
      $disconnect: jest.fn(),
      $on: jest.fn(),
      $connect: jest.fn(),
      $use: jest.fn(),
      $transaction: jest.fn((fn) => fn({})),
    };
  }
  return prismaInstance;
}

/**
 * Returns the jest.mock factory value.
 * `jest.fn(() => getPrismaInstance())` ensures every `new PrismaClient()`
 * returns the SAME singleton instance.
 */
function getPrismaMockFactory() {
  return { PrismaClient: jest.fn(() => getPrismaInstance()) };
}

module.exports = getPrismaMockFactory;
