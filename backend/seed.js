/**
 * DevChain — database seed script (Supabase Auth)
 * Populates the database with demo users, products, and jobs.
 * Creates users in Supabase Auth first, then profiles in public.users.
 * 
 * Run: node seed.js
 */
require('dotenv').config({ path: __dirname + '/.env' });
const prisma = require('./src/config/database');
const { adminClient: supabase } = require('./src/config/supabase');

const DEMO_PASSWORD = 'Demo1234';
const DEMO_USERS = [
  {
    email: 'demo-seller@devchain.dev',
    username: 'democreator',
    bio: 'Full-stack developer & open-source contributor. Building tools for the developer economy.',
    reputationScore: 42,
  },
  {
    email: 'demo-client@devchain.dev',
    username: 'democlient',
    bio: 'Tech startup founder hiring blockchain and AI talent.',
    reputationScore: 28,
  },
  {
    email: 'demo-buyer@devchain.dev',
    username: 'demobuyer',
    bio: 'Indie developer always looking for quality code assets.',
    reputationScore: 15,
  },
];

async function upsertDemoUser({ email, username, bio, reputationScore }) {
  // Step 1: ensure user exists in Supabase Auth
  let authUserId;

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { username },
  });

  if (authError) {
    // "already registered" means the user exists in Auth — fetch them
    if (authError?.message?.includes('already been registered') || authError?.message?.includes('duplicate')) {
      const { data: listData } = await supabase.auth.admin.listUsers();
      const found = listData?.users?.find(u => u.email === email);
      if (found) {
        authUserId = found.id;
        console.log(`  ℹ️  Auth user exists: ${email} (${authUserId.slice(0, 8)}…)`);
      } else {
        throw new Error(`Auth user ${email} not found after "already registered" error: ${authError.message}`);
      }
    } else {
      throw new Error(`Supabase Auth error for ${email}: ${authError.message}`);
    }
  } else {
    authUserId = authData.user.id;
    console.log(`  ✅ Auth user created: ${email} (${authUserId.slice(0, 8)}…)`);
  }

  // Step 2: upsert profile in public.users
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      id: authUserId,
      username,
      bio,
      reputationScore,
      isEmailVerified: true,
    },
    create: {
      id: authUserId,
      username,
      email,
      bio,
      reputationScore,
      isEmailVerified: true,
    },
  });

  console.log(`  ✅ Profile: @${user.username} (${user.id.slice(0, 8)}…)`);
  return user;
}

async function main() {
  console.log('🌱 Seeding DevChain database...\n');

  // ── Demo Users (via Supabase Auth) ──
  const seller = await upsertDemoUser(DEMO_USERS[0]);
  const client = await upsertDemoUser(DEMO_USERS[1]);
  const buyer = await upsertDemoUser(DEMO_USERS[2]);

  // ── Clean existing products & jobs (for idempotency) ──
  await prisma.review.deleteMany({});
  await prisma.ownershipRecord.deleteMany({});
  await prisma.proposal.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.job.deleteMany({});

  // ── Demo Products ──
  const products = [
    {
      title: 'React Component Library',
      description: 'A collection of 40+ accessible UI components built with TypeScript and Tailwind. Includes buttons, modals, forms, data tables, and navigation patterns.',
      price: 2900, category: 'ui-kits', tags: ['react', 'typescript', 'tailwind', 'accessible'],
      sellerId: seller.id,
    },
    {
      title: 'ML Pipeline Toolkit',
      description: 'End-to-end ML pipeline with data processing, feature engineering, model training, and deployment scripts. Supports scikit-learn, PyTorch, and TensorFlow.',
      price: 4900, category: 'python-scripts', tags: ['python', 'machine-learning', 'pipeline', 'data-science'],
      sellerId: seller.id,
    },
    {
      title: 'E-Commerce Mobile Template',
      description: 'React Native iOS/Android storefront with Stripe integration, cart management, order tracking, and admin dashboard. Fully customizable.',
      price: 3900, category: 'mobile-templates', tags: ['react-native', 'ecommerce', 'stripe', 'mobile'],
      sellerId: seller.id,
    },
    {
      title: 'Solidity Smart Contract Pack',
      description: 'Audited ERC-721 + ERC-1155 contracts with deployment scripts, Hardhat config, and comprehensive test suite. OpenZeppelin-based.',
      price: 14900, category: 'blockchain', tags: ['solidity', 'ethereum', 'nft', 'hardhat'],
      sellerId: seller.id,
    },
    {
      title: 'Node.js API Boilerplate',
      description: 'Production-ready Express + Prisma + JWT auth scaffold with PostgreSQL, Redis caching, rate limiting, and structured logging via Pino.',
      price: 1900, category: 'node-packages', tags: ['node', 'express', 'prisma', 'api'],
      sellerId: seller.id,
    },
    {
      title: 'Tailwind Dashboard Kit',
      description: '70+ responsive dashboard components — charts, tables, kanban boards, settings pages, and user management. Dark mode included.',
      price: 3400, category: 'react-components', tags: ['react', 'tailwind', 'dashboard', 'components'],
      sellerId: seller.id,
    },
    {
      title: 'OpenAI Chat API Wrapper',
      description: 'TypeScript SDK for GPT-4o, DALL-E 3, and embeddings. Streaming support, rate limit handling, error recovery, and usage logging.',
      price: 2400, category: 'apis', tags: ['openai', 'typescript', 'api', 'sdk'],
      sellerId: seller.id,
    },
    {
      title: 'GitHub Action Workflows',
      description: '30 reusable CI/CD workflows — lint, test, build, deploy, security scan, Docker build. Supports Node.js, Python, and Go projects.',
      price: 1500, category: 'tools', tags: ['github-actions', 'ci-cd', 'devops', 'workflows'],
      sellerId: seller.id,
    },
  ];

  for (const p of products) {
    const product = await prisma.product.create({ data: p });
    console.log(`  📦 Product: ${product.title} ($${(product.price / 100).toFixed(0)})`);
  }

  // ── Demo Jobs ──
  const jobs = [
    {
      title: 'Senior React Developer — DApp Frontend',
      description: 'Build a decentralized exchange interface with React, ethers.js, and Web3Modal. 3-month contract. Experience with DeFi protocols and wallet integration required.',
      budgetMin: 8000, budgetMax: 12000,
      skillsRequired: ['React', 'TypeScript', 'ethers.js', 'Web3', 'DeFi'],
      deadline: new Date('2026-08-15'),
      clientId: client.id,
    },
    {
      title: 'Rust Solidity Engineer — Smart Contract Audit',
      description: 'Audit 5 DeFi protocols for security vulnerabilities. Must have prior audit experience and knowledge of common DeFi exploit patterns.',
      budgetMin: 5000, budgetMax: 15000,
      skillsRequired: ['Rust', 'Solidity', 'Security', 'DeFi', 'Auditing'],
      deadline: new Date('2026-07-01'),
      clientId: client.id,
    },
    {
      title: 'Full-Stack Python + Next.js Developer',
      description: 'Build an MVP for an AI-powered analytics platform. FastAPI backend, Next.js frontend, PostgreSQL, and real-time data processing with WebSockets.',
      budgetMin: 3000, budgetMax: 6000,
      skillsRequired: ['Python', 'FastAPI', 'Next.js', 'PostgreSQL', 'WebSocket'],
      deadline: new Date('2026-09-01'),
      clientId: client.id,
    },
    {
      title: 'Mobile UI/UX Engineer — React Native',
      description: 'Design and implement cross-platform UI for a fintech app. 10+ screens with complex animations, gesture handling, and secure payments.',
      budgetMin: 4000, budgetMax: 8000,
      skillsRequired: ['React Native', 'TypeScript', 'UI/UX', 'Animations', 'Fintech'],
      deadline: new Date('2026-08-01'),
      clientId: client.id,
    },
    {
      title: 'Go Backend Engineer — High-Throughput API',
      description: 'Build a real-time data ingestion API handling 100K+ req/s. Experience with Kafka, Redis, PostgreSQL sharding, and microservices architecture.',
      budgetMin: 12000, budgetMax: 18000,
      skillsRequired: ['Go', 'Kafka', 'Redis', 'PostgreSQL', 'Microservices'],
      deadline: new Date('2026-10-01'),
      clientId: client.id,
    },
    {
      title: 'DevOps Engineer — Kubernetes Migration',
      description: 'Migrate 12 microservices from Docker Compose to Kubernetes on AWS EKS. Terraform, Helm charts, ArgoCD, and observability stack setup.',
      budgetMin: 10000, budgetMax: 20000,
      skillsRequired: ['Kubernetes', 'AWS', 'Terraform', 'Helm', 'ArgoCD'],
      deadline: new Date('2026-09-15'),
      clientId: client.id,
    },
  ];

  for (const j of jobs) {
    const job = await prisma.job.create({ data: j });
    console.log(`  💼 Job: ${job.title} ($${job.budgetMin}–$${job.budgetMax})`);
  }

  console.log(`\n✨ Seeding complete!`);
  console.log(`   Demo login credentials (all use Supabase Auth):`);
  console.log(`   Seller: democreator / Demo1234`);
  console.log(`   Client: democlient / Demo1234`);
  console.log(`   Buyer:  demobuyer  / Demo1234`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
