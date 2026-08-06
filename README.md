<p align="center">
  <h1 align="center">MarketFoundry 🚀</h1>
  <p align="center">
    <strong>Two-sided marketplace boilerplate</strong> — sell digital products, run a job board with escrow, and let buyers & sellers chat — all in your own code. No Next.js lock-in. No Docker.
  </p>
</p>

<p align="center">
  <a href="https://github.com/ravikumarve/devchain/stargazers">
    <img src="https://img.shields.io/github/stars/ravikumarve/devchain?style=social" alt="GitHub Stars" />
  </a>
  <a href="https://web-vert-mu-22.vercel.app">
    <img src="https://img.shields.io/badge/demo-live-7C3AED?style=for-the-badge&logo=vercel" alt="Live Demo" />
  </a>
  <a href="https://web-vert-mu-22.vercel.app/api/v1">
    <img src="https://img.shields.io/badge/API-live-059669?style=for-the-badge" alt="API Live" />
  </a>
  <a href="https://github.com/ravikumarve/devchain/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/ravikumarve/devchain" alt="License" />
  </a>
  <img src="https://img.shields.io/badge/typescript-5.0+-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/node.js-20+-339933?logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/react-19-61DAFB?logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/React%20Native-Expo-000020?logo=expo&logoColor=white" alt="React Native Expo" />
  <img src="https://img.shields.io/badge/no%20docker-local%20first-22C55E" alt="No Docker" />
  <img src="https://img.shields.io/badge/tests-187%20passing-22C55E" alt="187 tests passing" />
</p>

MarketFoundry (formerly DevChain) is a production-ready **Gumroad + Fiverr + GitHub Marketplace** hybrid. It ships with the hard parts of a two-sided marketplace already solved — **escrow payments, in-app chat, seller analytics, ownership verification, and an Expo mobile app** — backed by **187 automated tests**.

Run it on your laptop in 5 minutes with **SQLite + local file storage (no Docker, no Supabase account)**, then flip a switch and deploy to **Supabase + Vercel + Render** on free tiers.

---

## ✨ Features

### 🛍️ Product Marketplace
- Sell digital products (templates, tools, courses, scripts, design assets)
- Instant file delivery via storage adapter (local disk in dev, signed URLs in production)
- SHA-256 ownership certificates for every purchase
- Reviews & ratings system with verified-purchase enforcement

### 💼 Job Board & Escrow
- Post development jobs with budget ranges and skill requirements
- Freelancers submit proposals with rates and delivery timelines
- **Escrow-based payment protection** — fund held until work is released
- Full lifecycle: propose → accept → fund → work → release

### 🔔 In-App Notifications
- Real-time alerts for: proposals received/accepted/rejected, new sales, new reviews, escrow events
- Notification bell in navbar with unread badge
- Auto-created on all key events (fire-and-forget, non-blocking)

### 💬 Direct Messaging
- Real-time chat between clients and freelancers
- Conversation list with last message preview
- Optimistic sends with error recovery
- Message read tracking (mark as read on open)

### 👤 User Profiles
- Bio, avatar, reputation score display
- Tabbed view: purchases, sales, products, jobs
- Edit profile (bio) from the web UI

### 📊 Seller Analytics
- Revenue tracking, sales performance, product metrics
- Rating breakdown (1-5 star distribution)
- Top-rated products with average ratings
- Insight cards (praise, warnings, nudges)

### 🔐 Authentication
- JWT access + refresh tokens (15m / 7d)
- Automatic silent token refresh on 401
- Axios interceptor queues failed requests during refresh

### 📱 Mobile App (React Native + Expo)
- Cross-platform iOS/Android/web from one codebase
- All core screens: Marketplace, Jobs, Analytics, Profile
- Notifications, Chat, My Jobs, My Proposals
- Auth flow with token persistence (AsyncStorage)

---

## 🔄 Two Modes, One Codebase

MarketFoundry runs identically in two modes — you pick with a single command:

| | 🖥️ **Local mode** (default) | ☁️ **Cloud mode** |
|---|---|---|
| **Database** | SQLite (`backend/prisma/dev.db`) | PostgreSQL via Supabase |
| **Storage** | Local disk (`backend/uploads/`) | Supabase Storage (signed URLs) |
| **Auth** | Built-in JWT + bcrypt | Supabase Auth (same API shape) |
| **Setup** | `npm run setup:local` — Node only | `.env` + Supabase/Stripe keys |
| **Cost** | $0, no accounts | Free tiers |
| **Use it for** | Development, demos, tutorials | Production launch |

The backend detects the mode from `DATABASE_URL` (`file:` → local) and swaps in the right storage and auth providers through a tiny compatibility layer (`backend/src/utils/dbCompat.js`). All 187 tests run in cloud mode and the full flow is verified in local mode.

---

## 🚀 Quick Start

### ⚡ Option A — Local mode (5 minutes, no Docker, no accounts)

Requires only **Node.js 20+**. Uses SQLite + local disk storage + JWT/bcrypt auth.

```bash
# 1. One command: install deps, create local DB, seed demo data
npm run setup:local

# 2. Start backend (:10000) and web app (:5173) — two terminals
npm run dev --prefix backend
npm run dev --prefix apps/web

# 3. Open http://localhost:5173 and log in
#    demo-seller@devchain.dev / Demo1234
#    demo-client@devchain.dev / Demo1234
#    demo-buyer@devchain.dev  / Demo1234
```

Demo data includes 8 products, 6 jobs, and 3 user roles — chat, escrow, and analytics all work against it.

### ☁️ Option B — Cloud mode (Supabase + Stripe)

```bash
# 1. Install dependencies
npm ci

# 2. Configure environment
cp backend/.env.example backend/.env
cp apps/web/.env.example apps/web/.env
# Add SUPABASE_URL, SUPABASE_SERVICE_KEY, JWT secrets, STRIPE keys

# 3. Switch Prisma to PostgreSQL + push schema
node scripts/db-mode.js postgres
npx prisma db push --schema=backend/prisma/schema.prisma

# 4. Seed + start
npm run seed:demo
npm run start --prefix backend  # Backend on :10000
cd apps/web && npm run dev      # Web on :5173
```

### Switching modes anytime

```bash
node scripts/db-mode.js sqlite     # → local mode (SQLite)
node scripts/db-mode.js postgres   # → cloud mode (PostgreSQL)
```

The mode switch only regenerates the Prisma client — no code changes needed. See the [docs](docs/) folder for API, testing, and contribution guides.

---

## 🏗️ Architecture

```
devchain/                          (npm workspaces monorepo)
├── apps/
│   ├── web/                       # React 19 + TypeScript + Vite
│   │   └── src/
│   │       ├── pages/             # 16 pages (Marketplace, Jobs, Profile, Chat, etc.)
│   │       ├── components/        # Navbar, NotificationBell, EmptyState, etc.
│   │       ├── services/api.ts    # Axios client with token refresh interceptor
│   │       └── store/authStore.ts # Zustand auth store
│   └── mobile/                    # React Native + Expo (SDK 55)
│       └── src/
│           ├── screens/           # 14 screens (native parity with web)
│           ├── navigation/        # Stack + Tab navigator
│           ├── services/api.ts    # Mobile API client
│           └── store/authStore.ts # Zustand with AsyncStorage persistence
├── backend/                       # Node.js + Express + Prisma
│   ├── prisma/
│   │   ├── schema.prisma          # PostgreSQL schema (cloud mode)
│   │   └── schema.sqlite.prisma   # SQLite variant (local mode)
│   └── src/
│       ├── controllers/           # 11 controllers (auth, products, jobs, escrow, chat, etc.)
│       ├── routes/                # 11 route files with Joi validation
│       ├── middleware/            # auth, errorHandler, cors, validate, rateLimit
│       ├── services/              # storageService (local|supabase), localAuthProvider, emailService
│       ├── utils/                 # dbCompat, errors, logger, asyncHandler
│       └── config/                # env validation, database, supabase (guarded)
├── scripts/
│   ├── setup.js                   # One-command local setup (npm run setup:local)
│   └── db-mode.js                 # Prisma schema switcher (sqlite|postgres)
├── .github/workflows/
│   └── ci.yml                     # Lint → TypeCheck → Audit → Test → Deploy
└── docs/                          # Documentation
```

### Tech Stack

| Layer          | Local mode                    | Cloud mode (production)         |
| -------------- | ----------------------------- | ------------------------------- |
| **Web**        | React 19 + TypeScript + Vite  | Same                            |
| **Mobile**     | React Native 0.83 + Expo 55   | Same                            |
| **Backend**    | Node.js 20 + Express + Prisma | Same                            |
| **Database**   | SQLite (`dev.db`)             | PostgreSQL (Supabase) + Prisma  |
| **Storage**    | Local disk (`backend/uploads`)| Supabase Storage (signed URLs)  |
| **Auth**       | JWT + bcrypt (built-in)       | Supabase Auth (same JWT shape)  |
| **Payments**   | Stripe test mode              | Stripe (escrow + checkout)      |
| **Tests**      | Jest — 187 passing            | Same                            |
| **Deploy**     | — (local dev)                 | Vercel + Render + Supabase (free tiers) |

---

## 📋 API Reference

**Base URL (production):** `https://web-vert-mu-22.vercel.app/api/v1`

### Authentication

| Method | Endpoint          | Description          | Auth |
| ------ | ----------------- | -------------------- | ---- |
| POST   | `/auth/register`  | Create account       | ❌   |
| POST   | `/auth/login`     | Log in               | ❌   |
| GET    | `/auth/me`        | Get current user     | ✅   |
| PUT    | `/auth/me`        | Update profile (bio) | ✅   |
| POST   | `/auth/refresh`   | Refresh JWT tokens   | ❌   |

### Products

| Method | Endpoint              | Description              | Auth     |
| ------ | --------------------- | ------------------------ | -------- |
| GET    | `/products`           | List products (paginated)| ❌       |
| GET    | `/products/search`    | Search products          | ❌       |
| GET    | `/products/trending`  | Top products             | ❌       |
| GET    | `/products/:id`       | Product details          | ❌       |
| GET    | `/products/mine`      | Seller's own products    | ✅ Seller|
| POST   | `/products`           | Create product           | ✅ Seller|
| PUT    | `/products/:id`       | Update product           | ✅ Owner |
| DELETE | `/products/:id`       | Delete product           | ✅ Owner |

### Jobs & Proposals

| Method | Endpoint                                  | Description              | Auth     |
| ------ | ----------------------------------------- | ------------------------ | -------- |
| GET    | `/jobs`                                   | List jobs (paginated)    | ❌       |
| GET    | `/jobs/:id`                               | Job details              | ❌       |
| POST   | `/jobs`                                   | Create job               | ✅ Client|
| GET    | `/jobs/me/jobs`                           | My posted jobs           | ✅ Client|
| GET    | `/jobs/me/proposals`                      | My proposals             | ✅ User  |
| POST   | `/jobs/:id/proposals`                     | Submit proposal          | ✅ User  |
| GET    | `/jobs/:id/proposals`                     | Job's proposals          | ✅ Owner |
| PATCH  | `/jobs/proposals/:id/accept`              | Accept proposal          | ✅ Client|
| PATCH  | `/jobs/proposals/:id/reject`              | Reject proposal          | ✅ Client|
| PATCH  | `/jobs/:id/close`                         | Close job                | ✅ Client|

### Escrow (Job Payments)

| Method | Endpoint                              | Description                | Auth     |
| ------ | ------------------------------------- | -------------------------- | -------- |
| GET    | `/escrow/mine`                        | My escrows                 | ✅ User  |
| GET    | `/escrow/:proposalId`                 | Get escrow details         | ✅ User  |
| POST   | `/escrow/:proposalId/fund`            | Fund escrow (client)       | ✅ Client|
| POST   | `/escrow/:proposalId/request-release` | Request release (freelancer)| ✅ Freelancer|
| POST   | `/escrow/:proposalId/release`         | Release payment (client)   | ✅ Client|

### Ownership Certificates

| Method | Endpoint                      | Description                      | Auth |
| ------ | ----------------------------- | -------------------------------- | ---- |
| POST   | `/ownership/purchase`         | Purchase product + get cert      | ✅   |
| GET    | `/ownership/verify/:hash`     | Verify ownership certificate     | ❌   |
| GET    | `/ownership/my-purchases`     | My purchased products            | ✅   |
| GET    | `/ownership/my-sales`         | My sales                         | ✅ Seller|

### Reviews & Ratings

| Method | Endpoint                           | Description                | Auth  |
| ------ | ---------------------------------- | -------------------------- | ----- |
| POST   | `/reviews`                         | Create review              | ✅    |
| GET    | `/reviews/product/:productId`      | Product reviews            | ❌    |
| GET    | `/reviews/product/:productId/mine` | My review for this product | ✅    |
| GET    | `/reviews/seller/:sellerId`        | Seller's reviews           | ❌    |
| PUT    | `/reviews/:id`                     | Update review              | ✅    |
| DELETE | `/reviews/:id`                     | Delete review              | ✅    |

### Notifications

| Method | Endpoint                    | Description          | Auth |
| ------ | --------------------------- | -------------------- | ---- |
| GET    | `/notifications`            | My notifications     | ✅   |
| PATCH  | `/notifications/read-all`   | Mark all as read     | ✅   |
| PATCH  | `/notifications/:id/read`   | Mark one as read     | ✅   |
| DELETE | `/notifications/:id`        | Delete notification  | ✅   |

### Chat

| Method | Endpoint                              | Description               | Auth |
| ------ | ------------------------------------- | ------------------------- | ---- |
| GET    | `/chat`                               | My conversations          | ✅   |
| POST   | `/chat`                               | Create/find conversation  | ✅   |
| GET    | `/chat/:conversationId/messages`      | Get messages (paginated)  | ✅   |
| POST   | `/chat/:conversationId/messages`      | Send message (optmistic)  | ✅   |

### Payments

| Method | Endpoint                            | Description               | Auth |
| ------ | ----------------------------------- | ------------------------- | ---- |
| POST   | `/payments/create-checkout-session` | Stripe checkout link      | ✅   |
| POST   | `/payments/webhook`                 | Stripe webhook handler    | ❌   |

### Analytics

| Method | Endpoint                | Description              | Auth     |
| ------ | ----------------------- | ------------------------ | -------- |
| GET    | `/analytics/seller`     | Seller dashboard metrics | ✅ Seller|
| GET    | `/analytics/reviews`    | Review insights           | ✅ Seller|

### Files (Upload/Download)

| Method | Endpoint                             | Description             | Auth     |
| ------ | ------------------------------------ | ----------------------- | -------- |
| POST   | `/uploads/product/:productId`        | Upload product file     | ✅ Owner |
| GET    | `/uploads/product/:productId/download`| Download purchased file | ✅ Buyer |
| GET    | `/uploads/product/:productId/info`   | File metadata           | ✅ Buyer |

---

## 🧪 Testing

**187 integration tests** across **14 test suites** covering every API endpoint.

### Run Tests

```bash
# All backend tests (from monorepo root)
npm test

# With coverage
cd backend && npx jest --coverage

# Single test suite
cd backend && npx jest tests/routes/jobs.test.js
```

### Test Suites

| Suite          | Tests | Coverage                                |
| -------------- | ----- | --------------------------------------- |
| errors         | 24    | 8 custom error classes                  |
| asyncHandler   | 3     | Success & error forwarding              |
| validate       | 13    | Joi body/query/params validation        |
| auth middleware | 11   | JWT protect + optionalAuth              |
| errorHandler   | 20    | Prisma, JWT, Stripe, Multer errors      |
| cors           | 3     | Dev mode, preflight                     |
| health         | 3     | DB health check                         |
| auth routes    | 17    | Register, login, me, refresh            |
| products       | 14    | CRUD, search, filter                    |
| jobs           | 33    | CRUD, proposals, accept/reject          |
| ownership      | 15    | Purchase, verify, purchases, sales      |
| uploads        | 17    | Upload/download/info, access control    |
| payments       | 10    | Checkout session, webhooks              |
| analytics      | 4     | Seller analytics, review insights       |

### Frontend

```bash
cd apps/web
npm run lint          # ESLint
npx tsc --noEmit      # TypeScript check
```

---

## 🚀 Deployment

### Web App + API (Vercel)
- Frontend and API deployed together as serverless functions
- Connected to `main` branch — automatic deployments on push
- Environment variables configured in Vercel dashboard

### Database (Supabase PostgreSQL)
- Project: `igrrgytacxqsetksrmqs` (South Asia / Mumbai)
- Storage bucket: `devchain-files`

### Database Migrations
```bash
cd backend
npx prisma migrate deploy    # Apply pending migrations
npx prisma generate          # Regenerate client
```

### CI/CD Pipeline (GitHub Actions)
On push to `main`:
1. ✅ ESLint linting
2. ✅ TypeScript type check
3. 🔒 Security audit (npm audit)
4. 🧪 Run 187 integration tests
5. 🚀 Auto-deploy to Vercel

---

## 🗺️ Roadmap

### ✅ Phase 1: Core Marketplace
- [x] User authentication (JWT + refresh tokens)
- [x] Product marketplace with search/filter
- [x] Seller analytics dashboard
- [x] File upload/download via Supabase Storage
- [x] Job board with proposals
- [x] SHA-256 ownership certificates
- [x] Reviews & ratings with verified-purchase enforcement

### ✅ Phase 2: Enhanced Features
- [x] In-app notifications (bell + auto-create on events)
- [x] Escrow-based job payments (fund → release)
- [x] Direct messaging (conversations + real-time ready)
- [x] User profile editing (bio)
- [x] Mobile app parity (14 React Native screens)
- [x] Token refresh (silent 401 recovery)
- [x] CI/CD pipeline (GitHub Actions → Vercel)

### 🔜 Phase 3: Growth & Polish
- [ ] Stripe live keys (real PaymentIntents)
- [ ] Push notifications (mobile)
- [ ] Email notifications (welcome, purchase receipt, etc.)
- [ ] Supabase Realtime for live chat (WebSocket)
- [ ] Mobile app store deployment
- [ ] Advanced search (full-text, filters)

---

## 🛠️ Dev Commands Quick Reference

```bash
# Monorepo root
npm run setup:local         # One-command local setup (deps + DB + seed)
npm run db:sqlite           # Switch Prisma to SQLite (local)
npm run db:postgres         # Switch Prisma to PostgreSQL (cloud)
npm run seed:demo           # Seed demo users/products/jobs
npm test                    # Run all backend tests
npm run lint                # Run ESLint across workspace
npm run typecheck           # TypeScript type check all workspaces

# Backend
cd backend
npm run dev                 # Start API on :10000 (nodemon)
npx prisma studio           # Prisma admin UI
npx prisma migrate dev      # Create new migration (cloud mode)

# Web App
cd apps/web
npm run dev                 # Vite dev server (:5173)
npm run build               # Production build

# Mobile App
cd apps/mobile
npm run start               # Expo dev server
npm run android             # Run on Android
npm run ios                 # Run on iOS
npm run web                 # Run in browser
```

---

## 🤝 Contributing

1. **Fork** the repository
2. **Create a feature branch**: `git checkout -b feat/amazing-feature`
3. **Make changes** following existing patterns (CommonJS backend, inline styles)
4. **Commit** using [Conventional Commits](https://conventionalcommits.org)
5. **Push**: `git push origin feat/amazing-feature`
6. **Open a Pull Request**

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

Looking for the commercial boilerplate (one-time license, unlimited projects)? See the [MarketFoundry listing](docs/gumroad-listing.md) — includes the Expo mobile app, extended deployment guide, and priority support.

## 🛒 Support the Project

Star the repo, share it, or grab the Pro tier: [Buy on Gumroad](https://ravikumarve.gumroad.com)

---

<p align="center">
  <strong>MarketFoundry</strong> — the marketplace you own. Escrow, chat, analytics, and 187 tests — on your laptop in 5 minutes, in production by the weekend.
  <br>
  <sub>Built with ❤️ by developers, for developers</sub>
</p>