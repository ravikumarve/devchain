/**
 * Integration tests for health check endpoint
 *
 * NOTE: jest.mock factory creates a SINGLE shared prismaInstance so that
 * the health handler's inline `new PrismaClient()` uses the same mock
 * object we can control from the test.
 */
jest.mock('@prisma/client', () => {
  const mockModel = () => ({
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  });
  const prismaInstance = {
    user: mockModel(),
    product: mockModel(),
    order: mockModel(),
    ownershipRecord: mockModel(),
    job: mockModel(),
    proposal: mockModel(),
    review: mockModel(),
    $queryRaw: jest.fn(),
    $disconnect: jest.fn(),
    $on: jest.fn(),
    $connect: jest.fn(),
    $use: jest.fn(),
    $transaction: jest.fn((fn) => fn({})),
  };
  return { PrismaClient: jest.fn(() => prismaInstance) };
});

const request = require('supertest');
const app = require('../../src/index');

describe('GET /health', () => {
  it('should return 200 with status ok when DB is reachable', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: 'ok',
      version: '1.0.0',
    });
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('uptime');
    expect(res.body.database).toBe('connected');
  });

  it('should return JSON content type', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['content-type']).toMatch(/json/);
  });
});

describe('GET /', () => {
  it('should return API info', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      name: 'DevChain API',
      status: 'live',
    });
    expect(res.body).toHaveProperty('version');
    expect(res.body).toHaveProperty('environment');
  });
});
