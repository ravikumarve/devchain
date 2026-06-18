/**
 * Integration tests for jobs API endpoints
 */
jest.mock('@prisma/client', () => require('../helpers/prismaMock')());
jest.mock('@supabase/supabase-js', () => {
  const mockAuth = {
    getUser: jest.fn(),
    signInWithPassword: jest.fn(),
    refreshSession: jest.fn(),
    admin: {
      createUser: jest.fn(),
      deleteUser: jest.fn(),
    },
  };
  const supabaseInstance = { auth: mockAuth };
  return { createClient: jest.fn(() => supabaseInstance) };
});
const { PrismaClient } = require('@prisma/client');
const request = require('supertest');
const app = require('../../src/index');

const prisma = new PrismaClient();
const { createClient } = require('@supabase/supabase-js');
const authMock = createClient().auth;

const mockUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'test@test.com',
  username: 'testuser',
  passwordHash: 'hashed_password_placeholder',
  isActive: true,
};

const otherUserId = '660e8400-e29b-41d4-a716-446655440099';

const mockJob = {
  id: '770e8400-e29b-41d4-a716-446655440001',
  title: 'Build a React Dashboard with TypeScript and Tailwind CSS for a SaaS platform',
  description: 'We are looking for an experienced React developer to build a comprehensive dashboard... '.repeat(3).trim(),
  budgetMin: 500,
  budgetMax: 2000,
  status: 'open',
  skillsRequired: ['react', 'typescript', 'tailwind'],
  deadline: null,
  clientId: mockUser.id,
  deletedAt: null,
  createdAt: new Date().toISOString(),
  client: { id: mockUser.id, username: 'testuser', avatarUrl: null, reputationScore: 0 },
  _count: { proposals: 0 },
  proposals: [],
};

async function getAuthToken(userOverride) {
  const user = userOverride || mockUser;
  authMock.signInWithPassword.mockReset();
  authMock.getUser.mockReset();
  authMock.signInWithPassword.mockResolvedValue({
    data: { session: { access_token: 'sb-token', refresh_token: 'sb-refresh' }, user: { id: user.id, email: user.email } },
    error: null,
  });
  authMock.getUser.mockResolvedValue({
    data: { user: { id: user.id, email: user.email } },
    error: null,
  });
  prisma.user.findUnique.mockReset();
  prisma.user.findUnique.mockResolvedValue(user);
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'test@test.com', password: 'password1' });
  return res.body.accessToken;
}

// ──────────────────────────────────────────────
// GET /api/v1/jobs
// ──────────────────────────────────────────────
describe('GET /api/v1/jobs', () => {
  beforeEach(() => {
    prisma.job.findMany.mockReset();
    prisma.job.count.mockReset();
    prisma.job.findMany.mockResolvedValue([mockJob]);
    prisma.job.count.mockResolvedValue(1);
  });

  it('should list all jobs', async () => {
    const res = await request(app).get('/api/v1/jobs');
    expect(res.status).toBe(200);
    expect(res.body.jobs).toBeDefined();
    expect(Array.isArray(res.body.jobs)).toBe(true);
    expect(res.body.jobs.length).toBe(1);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.total).toBe(1);
  });

  it('should accept search query', async () => {
    const res = await request(app).get('/api/v1/jobs?search=react');
    expect(res.status).toBe(200);
  });

  it('should accept skill filter', async () => {
    const res = await request(app).get('/api/v1/jobs?skill=react');
    expect(res.status).toBe(200);
  });

  it('should accept minBudget filter', async () => {
    const res = await request(app).get('/api/v1/jobs?minBudget=100');
    expect(res.status).toBe(200);
  });

  it('should accept maxBudget filter', async () => {
    const res = await request(app).get('/api/v1/jobs?maxBudget=5000');
    expect(res.status).toBe(200);
  });

  it('should default status to open', async () => {
    const res = await request(app).get('/api/v1/jobs');
    expect(res.status).toBe(200);
    // The controller default status is 'open'
    expect(prisma.job.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'open' }),
      })
    );
  });

  it('should paginate results', async () => {
    const res = await request(app).get('/api/v1/jobs?page=1&limit=5');
    expect(res.status).toBe(200);
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(5);
  });

  it('should return empty array when no jobs', async () => {
    prisma.job.findMany.mockReset();
    prisma.job.findMany.mockResolvedValue([]);
    prisma.job.count.mockReset();
    prisma.job.count.mockResolvedValue(0);
    const res = await request(app).get('/api/v1/jobs');
    expect(res.status).toBe(200);
    expect(res.body.jobs).toEqual([]);
    expect(res.body.pagination.total).toBe(0);
  });
});

// ──────────────────────────────────────────────
// GET /api/v1/jobs/:id
// ──────────────────────────────────────────────
describe('GET /api/v1/jobs/:id', () => {
  beforeEach(() => {
    prisma.job.findUnique.mockReset();
  });

  it('should return a job by ID', async () => {
    prisma.job.findUnique.mockResolvedValue(mockJob);
    const res = await request(app).get(`/api/v1/jobs/${mockJob.id}`);
    expect(res.status).toBe(200);
    expect(res.body.job).toBeDefined();
    expect(res.body.job.id).toBe(mockJob.id);
  });

  it('should return 404 for non-existent job', async () => {
    prisma.job.findUnique.mockResolvedValue(null);
    const res = await request(app).get(
      '/api/v1/jobs/770e8400-e29b-41d4-a716-446655440999'
    );
    expect(res.status).toBe(404);
  });

  it('should return 404 for deleted job', async () => {
    prisma.job.findUnique.mockResolvedValue({ ...mockJob, deletedAt: new Date().toISOString() });
    const res = await request(app).get(`/api/v1/jobs/${mockJob.id}`);
    expect(res.status).toBe(404);
  });

  it('should return 422 for invalid UUID', async () => {
    const res = await request(app).get('/api/v1/jobs/not-a-uuid');
    expect(res.status).toBe(422);
  });
});

// ──────────────────────────────────────────────
// POST /api/v1/jobs
// ──────────────────────────────────────────────
describe('POST /api/v1/jobs', () => {
  beforeEach(() => {
    prisma.job.create.mockReset();
    prisma.user.findUnique.mockReset();
    prisma.user.findUnique.mockResolvedValue(mockUser);
    prisma.job.create.mockResolvedValue(mockJob);
  });

  const validJob = {
    title: 'Build a React Dashboard with TypeScript',
    description: 'We need an experienced developer to build a comprehensive dashboard application with authentication, data visualization, and real-time updates.'.repeat(2).substring(0, 200),
    budgetMin: 500,
    budgetMax: 2000,
    skillsRequired: ['react', 'typescript'],
  };

  it('should create a job when authenticated', async () => {
    const token = await getAuthToken();
    const res = await request(app)
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send(validJob);
    expect(res.status).toBe(201);
    expect(res.body.message).toBeDefined();
    expect(res.body.job).toBeDefined();
  });

  it('should reject when not authenticated', async () => {
    const res = await request(app)
      .post('/api/v1/jobs')
      .send(validJob);
    expect(res.status).toBe(401);
  });

  it('should reject missing title', async () => {
    const token = await getAuthToken();
    const res = await request(app)
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validJob, title: undefined });
    expect(res.status).toBe(422);
  });

  it('should reject short title', async () => {
    const token = await getAuthToken();
    const res = await request(app)
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validJob, title: 'ab' });
    expect(res.status).toBe(422);
  });

  it('should reject short description', async () => {
    const token = await getAuthToken();
    const res = await request(app)
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validJob, description: 'Too short' });
    expect(res.status).toBe(422);
  });

  it('should reject missing budget fields', async () => {
    const token = await getAuthToken();
    const res = await request(app)
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Valid Title Here', description: 'x'.repeat(50) });
    expect(res.status).toBe(422);
  });

  it('should reject negative budget', async () => {
    const token = await getAuthToken();
    const res = await request(app)
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validJob, budgetMin: -100 });
    expect(res.status).toBe(422);
  });
});

// ──────────────────────────────────────────────
// POST /api/v1/jobs/:id/proposals
// ──────────────────────────────────────────────
describe('POST /api/v1/jobs/:id/proposals', () => {
  beforeEach(() => {
    prisma.job.findUnique.mockReset();
    prisma.proposal.findFirst.mockReset();
    prisma.proposal.create.mockReset();
    prisma.user.findUnique.mockReset();
    prisma.user.findUnique.mockResolvedValue(mockUser);
    prisma.job.findUnique.mockResolvedValue(mockJob);
    prisma.proposal.findFirst.mockResolvedValue(null);
    prisma.proposal.create.mockResolvedValue({
      id: '880e8400-e29b-41d4-a716-446655440001',
      jobId: mockJob.id,
      freelancerId: otherUserId,
      coverLetter: 'I am an experienced developer with 5 years in React... '.repeat(5),
      proposedRate: 750,
      freelancer: { id: otherUserId, username: 'freelancer', avatarUrl: null, reputationScore: 0 },
      job: { id: mockJob.id, title: mockJob.title },
    });
  });

  it('should submit a proposal when authenticated', async () => {
    const token = await getAuthToken({ ...mockUser, id: otherUserId });
    const res = await request(app)
      .post(`/api/v1/jobs/${mockJob.id}/proposals`)
      .set('Authorization', `Bearer ${token}`)
      .send({ coverLetter: 'I am the perfect fit for this job... '.repeat(5), proposedRate: 750 });
    expect(res.status).toBe(201);
    expect(res.body.proposal).toBeDefined();
  });

  it('should reject proposal on own job', async () => {
    const token = await getAuthToken(); // uses mockUser, which is the job clientId
    const res = await request(app)
      .post(`/api/v1/jobs/${mockJob.id}/proposals`)
      .set('Authorization', `Bearer ${token}`)
      .send({ coverLetter: 'I am the perfect fit for this job... '.repeat(5), proposedRate: 750 });
    expect(res.status).toBe(400);
  });

  it('should reject duplicate proposal', async () => {
    const token = await getAuthToken();
    // Use a different user than the job owner for the auth token
    prisma.user.findUnique.mockResolvedValue({ ...mockUser, id: otherUserId });
    // Mock existing proposal
    prisma.proposal.findFirst.mockResolvedValue({ id: 'existing' });
    const res = await request(app)
      .post(`/api/v1/jobs/${mockJob.id}/proposals`)
      .set('Authorization', `Bearer ${token}`)
      .send({ coverLetter: 'I am the perfect fit for this job... '.repeat(5), proposedRate: 750 });
    expect(res.status).toBe(400);
  });

  it('should reject proposal on closed job', async () => {
    const token = await getAuthToken();
    prisma.user.findUnique.mockResolvedValue({ ...mockUser, id: otherUserId });
    prisma.job.findUnique.mockResolvedValue({ ...mockJob, status: 'closed' });
    const res = await request(app)
      .post(`/api/v1/jobs/${mockJob.id}/proposals`)
      .set('Authorization', `Bearer ${token}`)
      .send({ coverLetter: 'I am the perfect fit for this job... '.repeat(5), proposedRate: 750 });
    expect(res.status).toBe(400);
  });

  it('should reject when not authenticated', async () => {
    const res = await request(app)
      .post(`/api/v1/jobs/${mockJob.id}/proposals`)
      .send({ coverLetter: 'x'.repeat(30), proposedRate: 100 });
    expect(res.status).toBe(401);
  });

  it('should reject invalid proposal data', async () => {
    const token = await getAuthToken();
    const res = await request(app)
      .post(`/api/v1/jobs/${mockJob.id}/proposals`)
      .set('Authorization', `Bearer ${token}`)
      .send({ coverLetter: 'Too short', proposedRate: -5 });
    expect(res.status).toBe(422);
  });
});

// ──────────────────────────────────────────────
// GET /api/v1/jobs/me/jobs
// ──────────────────────────────────────────────
describe('GET /api/v1/jobs/me/jobs', () => {
  beforeEach(() => {
    prisma.job.findMany.mockReset();
    prisma.user.findUnique.mockReset();
    prisma.user.findUnique.mockResolvedValue(mockUser);
    prisma.job.findMany.mockResolvedValue([mockJob]);
  });

  it('should return my jobs when authenticated', async () => {
    const token = await getAuthToken();
    const res = await request(app)
      .get('/api/v1/jobs/me/jobs')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.jobs).toBeDefined();
    expect(Array.isArray(res.body.jobs)).toBe(true);
  });

  it('should reject when not authenticated', async () => {
    const res = await request(app).get('/api/v1/jobs/me/jobs');
    expect(res.status).toBe(401);
  });
});

// ──────────────────────────────────────────────
// GET /api/v1/jobs/me/proposals
// ──────────────────────────────────────────────
describe('GET /api/v1/jobs/me/proposals', () => {
  beforeEach(() => {
    prisma.proposal.findMany.mockReset();
    prisma.user.findUnique.mockReset();
    prisma.user.findUnique.mockResolvedValue(mockUser);
    prisma.proposal.findMany.mockResolvedValue([
      {
        id: '880e8400-e29b-41d4-a716-446655440001',
        jobId: mockJob.id,
        freelancerId: mockUser.id,
        coverLetter: 'Experienced developer...',
        proposedRate: 750,
        createdAt: new Date().toISOString(),
        job: {
          ...mockJob,
          client: { id: mockUser.id, username: 'client', avatarUrl: null, reputationScore: 0 },
          _count: { proposals: 1 },
        },
      },
    ]);
  });

  it('should return my proposals when authenticated', async () => {
    const token = await getAuthToken();
    const res = await request(app)
      .get('/api/v1/jobs/me/proposals')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.proposals).toBeDefined();
    expect(Array.isArray(res.body.proposals)).toBe(true);
  });

  it('should reject when not authenticated', async () => {
    const res = await request(app).get('/api/v1/jobs/me/proposals');
    expect(res.status).toBe(401);
  });
});

// ──────────────────────────────────────────────
// PATCH /api/v1/jobs/:id/close
// ──────────────────────────────────────────────
describe('PATCH /api/v1/jobs/:id/close', () => {
  beforeEach(() => {
    prisma.job.findUnique.mockReset();
    prisma.job.update.mockReset();
    prisma.user.findUnique.mockReset();
    prisma.user.findUnique.mockResolvedValue(mockUser);
    prisma.job.findUnique.mockResolvedValue(mockJob);
    prisma.job.update.mockResolvedValue({ ...mockJob, status: 'closed' });
  });

  it('should close a job when authenticated as owner', async () => {
    const token = await getAuthToken();
    const res = await request(app)
      .patch(`/api/v1/jobs/${mockJob.id}/close`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toBeDefined();
    expect(res.body.job.status).toBe('closed');
  });

  it('should reject close by non-owner', async () => {
    const token = await getAuthToken({ ...mockUser, id: otherUserId });
    const res = await request(app)
      .patch(`/api/v1/jobs/${mockJob.id}/close`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('should reject close of non-existent job', async () => {
    const token = await getAuthToken();
    prisma.job.findUnique.mockResolvedValue(null);
    const res = await request(app)
      .patch(`/api/v1/jobs/${mockJob.id}/close`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('should reject close without auth', async () => {
    const res = await request(app)
      .patch(`/api/v1/jobs/${mockJob.id}/close`);
    expect(res.status).toBe(401);
  });
});
