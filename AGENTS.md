# AGENTS.md - DevChain Codebase Guide

## Project Overview

DevChain is a blockchain-powered developer marketplace — a "Gumroad + Fiverr + GitHub Marketplace"
for developers. Built as a monorepo with npm workspaces.

```
devchain/
├── apps/
│   ├── mobile/     # React Native + Expo
│   └── web/        # React + TypeScript + Vite
├── backend/        # Node.js + Express + Prisma
├── shared/         # Shared types and utilities
├── docs/           # Documentation
└── scripts/        # Build/deployment scripts
```

> **Important:** Always run npm commands from the **monorepo root** (`~/devchain/`), not from
> subdirectories. This is required due to npm workspaces.

---

### [2025-04-22] - Sprint Alpha Execution
- **State**: Success (90% Complete)
- **MCP Data Used**: code_tree for architecture analysis, file system operations for implementation
- **Agents Deployed**: Direct implementation (backend-architect, frontend-developer, docs, github-profile-polish patterns)
- **Architectural Decision**: Enhanced Stripe payment flow with comprehensive webhook handling, SHA-256 ownership verification, and download security
- **Next Turn Directive**: Complete end-to-end testing with sample products, create social preview images, and prepare for production launch

### [2025-04-22] - Sprint Beta Execution
- **State**: Success (58% Complete)
- **MCP Data Used**: Chrome headless for image generation, file system operations for documentation
- **Agents Deployed**: Direct implementation (frontend-developer, docs, asset creation)
- **Architectural Decision**: Created professional social preview assets and comprehensive testing documentation
- **Next Turn Directive**: Complete manual backend testing, configure Stripe test mode, and finalize production deployment

---

## Deployment & Infrastructure

| Layer     | Service                        | URL / ID                           |
| --------- | ------------------------------ | ---------------------------------- |
| Frontend  | Vercel                         | `devchain-app.vercel.app`          |
| Backend   | Render                         | `devchain.onrender.com`            |
| Database  | PostgreSQL (via Render/Prisma) | See `DATABASE_URL` in `.env`       |
| Storage   | Supabase Storage               | Project ID: `ldqpqggbvqjgucucxeny` |
| S3 Bucket | `devchain-files`               | Used for file upload/download      |

**Do not suggest:** Docker-based deployments, AWS, GCP, self-hosted VPS, or any paid infra
upgrades without being explicitly asked.

---

## Machine Constraints

- **OS:** Linux Mint (Ubuntu-based)
- **Hardware:** CPU-only — no GPU available
- **Budget:** Lean/minimal — avoid suggesting paid third-party APIs or services
- Do not suggest GPU-dependent packages (CUDA, torch with GPU, etc.)
- Prefer lightweight, zero-cost dependencies where possible

---

## Current Feature Status

These features are **already built** — do not re-scaffold or overwrite them:

- ✅ Auth system (JWT access + refresh tokens, `protect` middleware)
- ✅ Product detail page
- ✅ Seller analytics dashboard
- ✅ File upload/download via Supabase Storage
- ✅ Marketplace search and filter UI

When adding new features, extend existing patterns — do not replace or refactor working code
unless explicitly asked.

---

## 🛡️ Backend Hardening (Sprint — June 18, 2026)

The backend was comprehensively hardened. Key changes:

### New Files Created
| File | Purpose |
|------|---------|
| `backend/src/utils/errors.js` | 7 custom error classes (BadRequest, Unauthorized, Forbidden, NotFound, Conflict, Validation, RateLimit) |
| `backend/src/utils/logger.js` | Pino structured JSON logging with pino-pretty in dev |
| `backend/src/utils/asyncHandler.js` | Wraps async controllers to forward errors to centralized handler |
| `backend/src/config/env.js` | Validates required env vars at startup (DATABASE_URL, JWT_SECRET, SUPABASE_URL, SUPABASE_SERVICE_KEY) |
| `backend/src/middleware/validate.js` | Joi schema validation middleware for body/query/params |
| `backend/src/middleware/errorHandler.js` | Centralized error handler — catches Prisma, Stripe, JWT, Multer, Supabase errors |
| `backend/src/routes/analytics.js` | Analytics route (was missing) |

### Files Modified
| File | Changes |
|------|---------|
| `backend/src/index.js` | Env validation on boot, graceful shutdown (SIGTERM/SIGINT), health check with DB ping, pino http logger, auth-specific rate limiter (20/15min), strict Helmet CSP in prod, tightened middleware ordering |
| `backend/src/middleware/auth.js` | Enhanced JWT error handling, added `optionalAuth` middleware |
| `backend/src/middleware/cors.js` | Whitelist-based CORS in prod (devchain-app.vercel.app, devchain.onrender.com), 24h preflight cache |
| All 7 controllers | Replaced try-catch with `asyncHandler`, replaced `console.error` with structured `log.error`, replaced inline 400/404/403 responses with error classes |
| All 6 route files | Added Joi validation schemas for every endpoint |
| `backend/src/services/emailService.js` | Replaced console.log with pino logger |
| `.env.example` | Documented REQUIRED vs optional vars, added LOG_LEVEL, FRONTEND_URL, OWNERSHIP_HASH_SECRET |

### Security Improvements
1. Helmet CSP in production
2. CORS whitelist (production)
3. Auth rate limit: 20 req/15min
4. JWT refresh token rotation (random UUID per token)
5. Stronger password validation (min 8 chars, 1 letter + 1 number)
6. File upload: extension whitelist, filename sanitization, 50MB limit
7. No stack traces in production error responses
8. Prisma error handling (unique constraint, FK, connection, not found)
9. Request body redaction (passwords, tokens, secrets from logs)

---

## Build, Lint, and Test Commands

### Root Workspace

```bash
npm run install:all       # Install all workspace dependencies
npm run build             # Backend: npm install + prisma generate
npm start                 # Start backend server (node backend/src/index.js)
```

### Backend (`/backend`)

```bash
npm run dev               # Start with nodemon (auto-reload)
npm run start             # Start without reload
npm run test              # Placeholder (no tests yet)
npx prisma generate       # Regenerate Prisma client
npx prisma studio         # Open Prisma admin UI
```

### Web App (`/apps/web`)

```bash
npm run dev               # Start Vite dev server
npm run build             # TypeScript compile + Vite build
npm run lint              # Run ESLint
npm run lint -- --fix     # Auto-fix lint issues
npm run preview           # Preview production build
```

**Run single file lint:**

```bash
npx eslint src/pages/Login.tsx
npx eslint src/pages/Login.tsx --fix
```

**Run single test (if tests added):**

```bash
npx vitest run src/pages/Login.test.tsx
npx vitest src/pages/Login.test.tsx --watch
```

### Mobile App (`/apps/mobile`)

```bash
npm run start             # Start Expo dev server
npm run android           # Start for Android
npm run ios               # Start for iOS
npm run web               # Start for web
```

---

## TypeScript Configuration

### Web App (`apps/web/tsconfig.app.json`)

- Target: ES2022
- Strict mode: **enabled**
- `noUnusedLocals`: true
- `noUnusedParameters`: true
- `verbatimModuleSyntax`: true
- `erasableSyntaxOnly`: true

### Mobile App (`apps/mobile/tsconfig.json`)

- Standard Expo TypeScript config (React Native)

---

## Code Style Guidelines

### General

- Use **2 spaces** for indentation
- Use **semicolons** at end of statements
- Use **template literals** for string interpolation
- Maximum line length: ~100 characters (soft)
- No trailing whitespace

### Backend (JavaScript - CommonJS)

**Critical:** Backend uses **CommonJS only** (`require` / `module.exports`).
Do **not** convert to ESM. Do not use `import`/`export` in backend files.

**File naming:** `camelCase.js` (e.g., `authController.js`, `productService.js`)

**Imports:**

```javascript
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { protect } = require('../middleware/auth');
```

**Error handling pattern:**

```javascript
const controller = async (req, res) => {
  try {
    // logic
    res.status(201).json({ data });
  } catch (err) {
    console.error('ControllerName error:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};
```

**Response structure:**

- Success: `res.status(X).json({ message?, data? })`
- Errors: `res.status(X).json({ error: 'Descriptive message' })`
- Always return after sending response

**Middleware ordering:** Security → Body Parser → Routes → 404 → Error Handler

### Frontend (React + TypeScript)

**Web app uses ESM** (`import`/`export`) with TypeScript — do not use `require()`.

**File naming:**

- Components: `PascalCase.tsx` (e.g., `Navbar.tsx`, `FileManager.tsx`)
- Pages: `PascalCase.tsx` (e.g., `Login.tsx`, `Marketplace.tsx`)
- Stores/Utilities: `camelCase.ts` (e.g., `authStore.ts`, `api.ts`)

**Imports order:**

1. React/native imports
2. Third-party libraries
3. Internal components/stores
4. Relative imports (../)

```typescript
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Navbar from '../components/Navbar';
```

**Component patterns:**

```typescript
// Page component - default export
export default function Login() {
  // hooks at top
  // handlers
  // render
}

// Reusable component - named export
export function Navbar() {}
```

**Zustand store pattern:**

```typescript
interface State {
  data: Type;
  isLoading: boolean;
  error: string | null;
  action: () => Promise<void>;
}

export const useStore = create<State>((set) => ({
  data: null,
  isLoading: false,
  error: null,
  action: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api();
      set({ data: res.data });
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed' });
    } finally {
      set({ isLoading: false });
    }
  },
}));
```

**Inline styles:** Use `Record<string, React.CSSProperties>` pattern (see existing pages).

- Keep all styles in a `const styles` object at the bottom of the file
- Use camelCase for CSS properties

**Error handling:**

```typescript
try {
  await action();
} catch (err: any) {
  setError(err.response?.data?.error || 'Something went wrong');
}
```

### Database (Prisma)

**Schema conventions:**

- Table names: `snake_case` (via `@@map`)
- Field names: `camelCase`
- Use `@default(uuid())` for IDs
- Use soft deletes with `deletedAt DateTime?`

**Always run `npx prisma generate` after any schema change.**

**Query patterns:**

```javascript
const item = await prisma.model.findUnique({ where: { id } });
const items = await prisma.model.findMany({ where, orderBy, take, skip });
await prisma.model.create({ data });
await prisma.model.update({ where: { id }, data });
await prisma.model.delete({ where: { id } }); // or soft delete via update({ deletedAt: new Date() })
```

---

## API Design Conventions

### RESTful Endpoints

- `GET /api/v1/resource` — List (with pagination: `?page=1&limit=20`)
- `GET /api/v1/resource/:id` — Get one
- `POST /api/v1/resource` — Create
- `PUT/PATCH /api/v1/resource/:id` — Update
- `DELETE /api/v1/resource/:id` — Delete

### Authentication

- Bearer token in Authorization header
- JWT access tokens (short-lived, 15m)
- JWT refresh tokens (long-lived, 7d)
- Protected routes use `protect` middleware

### Request/Response

- JSON for all requests/responses
- Validation with Joi on backend
- Return appropriate HTTP status codes
- Never expose sensitive data (passwords, hashes, tokens)

### API Base URL

- Hardcoded in web app: `https://devchain.onrender.com/api/v1`
- Do not change this without explicit instruction

---

## File Storage (Supabase)

Files are uploaded/downloaded via Supabase Storage — do not replace with local disk storage
or other providers.

```javascript
// Supabase project ID: ldqpqggbvqjgucucxeny
// Storage bucket: devchain-files
// Use signed URLs for secure access
```

---

## Environment Variables

Required in `/backend/.env`:

```
DATABASE_URL=postgresql://...
JWT_SECRET=<random-string>
JWT_REFRESH_SECRET=<random-string>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
PORT=10000
NODE_ENV=development
SUPABASE_URL=https://ldqpqggbvqjgucucxeny.supabase.co
SUPABASE_SERVICE_KEY=<service-role-key>
```

---

## Adding New Features

### Backend

1. Add route file in `src/routes/`
2. Add controller in `src/controllers/`
3. Add service/model in `src/services/` or `src/models/` if needed
4. Add middleware in `src/middleware/` if needed
5. Mount the route in `src/index.js`
6. Run `npx prisma generate` if schema changed
7. Run `npx prisma migrate dev --name <description>` for schema migrations

### Web App

1. Add page component in `src/pages/`
2. Add API methods in `src/services/api.ts`
3. Add Zustand store in `src/store/` if needed
4. Register route in `src/App.tsx`

### Database Changes

1. Edit `backend/prisma/schema.prisma`
2. Run `npx prisma migrate dev --name <description>`
3. Run `npx prisma generate`

---

## Testing

No tests currently configured. When adding:

- Backend: Jest or Mocha in `/backend/tests/`
- Web: Vitest (preferred with Vite)
- Mobile: Jest + React Native Testing Library
- Place test files next to source: `Login.test.tsx` alongside `Login.tsx`

---

## Agent Behaviour Rules

1. **Never convert CommonJS to ESM** in the backend
2. **Never replace Supabase Storage** with another file storage solution
3. **Always regenerate Prisma client** after schema changes
4. **Ask before adding new dependencies** that have a cost or are heavy
5. **Do not refactor working features** unless explicitly asked
6. **Run all npm commands from monorepo root** (`~/devchain/`)
7. **Prefer extending existing patterns** over introducing new architectural patterns
8. When uncertain about scope, **ask a clarifying question** rather than making assumptions
9. **Use shadcn/ui for all new page UI** — do not use raw HTML inputs or custom button styles on new pages
10. **Never run shadcn init again** — it is already configured
11. **Ask before installing new shadcn components** not in the list above

---

## UI Component Library (shadcn/ui)

shadcn/ui is installed in `apps/web`. Components live in `apps/web/src/components/ui/`.

**Import pattern:**

```typescript
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
```

**Rules:**

- Use shadcn components for all new forms, inputs, buttons, dialogs, and cards
- Do NOT replace shadcn with custom HTML inputs on new pages
- Existing pages use inline styles (const styles pattern) — do not refactor them to shadcn
- Only new pages (Sprint 1 onwards) should use shadcn

**Available components (installed):**
button, input, textarea, select, form, label, badge, card, dialog

**Adding new components:**

```bash
cd apps/web && npx shadcn@latest add <component-name>
```

---

## 💾 Session Memory Ledger

### [2026-06-18 15:00] - Empty State Redesign (Marketplace, Jobs, Analytics)
- **State**: Success
- **MCP Data Used**: Direct file reads of 3 pages + 1 CSS file, write for 1 new component + 4 edits
- **Agents Deployed**: Orchestrator (direct execution)
- **Architectural Decision**:
  - Created `EmptyState.tsx` — a shared component with 3 skeleton variants (card/list/chart), demo preview cards, feature education blocks, and configurable CTAs
  - **Marketplace**: Shows 4 skeleton placeholder cards + 4 demo product previews (UI Kit, ML Pipeline, Mobile Template, Solidity Pack) + "What You Can Sell" education block. CTA directs to /sell or /login.
  - **Jobs**: Shows 3 skeleton list cards + 3 demo job listings (React DApp, Solidity Audit, Full-Stack MVP) + features (Escrow, Global Talent, Quick Matching). CTA directs to /post-job or /login.
  - **Analytics**: Completely restructured — when no products AND no sales, shows full-page EmptyState with chart skeleton + 4 feature education blocks + "Create First Product" CTA. Sub-sections now show enhanced empty states with icons and action buttons instead of bare text.
  - Added CSS: `@keyframes shimmer`, `.skeleton`, `.skeleton-card`, `.skeleton-block`, `.demo-card`, `.feature-grid`, `.feature-block`
  - Fixed `hasActiveFilters` type from `string | boolean` to `boolean` (Marketplace)
  - Fixed React purity violation (`Math.random` → deterministic height array)
- **Commit**: `002c8f4` — 5 files, 533 insertions, 45 deletions.
- **Next Turn Directive**: Add seed/demo data script to populate DB with sample products and jobs for first-time visitors, or set up CI pipeline to run tests on push.

### [2026-06-18] - All Route Tests Complete (183 tests)
- **State**: Success
- **MCP Data Used**: Direct file reads of 5 route + 5 controller files, write for 5 new test files
- **Agents Deployed**: Orchestrator (direct execution)
- **Architectural Decision**:
  - Created `tests/helpers/prismaMock.js` — shared mock factory so all test files share the same singleton pattern for `@prisma/client` mocking
  - `@prisma/client` uses `exports` map → manual mocks break → inline factory with `jest.fn(() => sharedInstance)` is the only reliable approach
  - Same singleton pattern applied to `stripe` mock (factory creates one instance in closure)
  - Multer fileFilter errors now handled as 400 in errorHandler (was falling through to 500)
- **Test Coverage**: 14 suites, 183 tests:
  - jobs (33): list/search/filter, get by ID, create, proposals (submit/own/duplicate/closed), my jobs/proposals, close (owner/non-owner/missing)
  - ownership (15): certificate verify (valid/invalid/wrong hash), purchase (success/own/duplicate/missing/not found/inactive), my-purchases, my-sales
  - uploads (17): upload (auth/owner/file-type/missing), download (auth/access control/seller/buyer), file info (seller/buyer/no-access)
  - payments (10): checkout session (auth/product/duplicate), webhooks (completed/failed/invalid signature/missing)
  - analytics (4): seller analytics with comparison metrics, empty state
- **Commit**: `f0ce7c9` — 7 files, 1447 insertions.
- **Next Turn Directive**: Begin frontend redesign, or set up CI pipeline to run tests on push.

### [2026-06-18] - Backend Test Suite (104 tests passing)
- **State**: Success
- **MCP Data Used**: Direct file reads/writes for test files and mock implementation
- **Agents Deployed**: Orchestrator (direct execution)
- **Architectural Decision**:
  - Inline `jest.mock('@prisma/client', factory)` with shared `prismaInstance` singleton via `jest.fn(() => prismaInstance)` — required because `@prisma/client` uses `exports` map in `package.json` which breaks manual mock resolution (`__mocks__/` dir approach).
  - Each test file's `jest.mock` factory creates the singleton once; all controllers and test code calling `new PrismaClient()` get the same object.
  - Jest 29 (not 30) due to `clearMocksOnScope` compatibility with Node 20.
  - `forceExit: true` in jest config to handle Express `app.listen()` TCPSERVERWRAP handles from `require()`-ing index.js.
- **Test Coverage**: 9 suites, 104 tests — errors (24), asyncHandler (3), validate (13), auth middleware (11), cors (3), errorHandler (20), health (3), auth routes (17), products (14).
- **NPM test script**: Updated to `"jest"` (was `"echo 'No tests yet'"`).
- **Commit**: `ccc67e6` — 12 files, 1470 insertions, 1 deletion.
- **Next Turn Directive**: Add integration tests for remaining routes (jobs, ownership, uploads, payments, analytics), or begin frontend redesign.

### [2026-06-18 23:30] - Proposal Lifecycle + Review Analytics
- **State**: Success
- **MCP Data Used**: explore agent for full codebase mapping, direct file reads/writes for all edits
- **Agents Deployed**: Orchestrator (direct execution)
- **Architectural Decision**:
  - **Backend Proposal Endpoints**: Accept proposal → sets status='accepted', rejects all OTHER pending proposals via $transaction, marks job as 'in_progress'. Reject → single proposal status='rejected'. Routes reordered so `/me/jobs`, `/me/proposals` come BEFORE `/:id` to avoid Express param collision
  - **deliveryDays field**: Added to Proposal model. Frontend was sending `deliveryDays` but backend never stored it — data loss fixed
  - **getMyJobs enhanced**: Returns proposals with freelancer info so client can manage from a single page
  - **Analytics reviews**: `averageRating`, `ratingBreakdown` (1-5 star counts), `topRatedProducts` (sorted by avg rating). Review-based insights (praise for 4.5+, warning for <3, nudge to encourage reviews)
  - **MyProposals.tsx**: Freelancer dashboard — status badges (pending/accepted/rejected), bid amount, delivery days, job title, client info. Empty state with CTA
  - **MyJobs.tsx**: Client dashboard — expandable accordion per job, shows proposals with accept/reject buttons, status badges. Rejects pending only, hides actions for processed proposals
- **Files Changed**: 10 files — schema.prisma, jobController.js, jobs.js, analyticsController.js, api.ts, JobDetail.tsx, Analytics.tsx, MyProposals.tsx (new), MyJobs.tsx (new), App.tsx, Navbar.tsx, analytics.test.js, migration files
- **Test Coverage**: 187 tests (14 suites) — all pass. Analytics test updated to mock `review.findMany`
- **Commit**: `679be46` — 292 files (inc. agent registry), our changes: ~10 files
- **Next Turn Directive**: Set up Stripe payment integration with real keys, or begin mobile app parity pass

### [2026-06-18 20:00] - Vercel + Supabase Full Deployment
- **State**: Success
- **MCP Data Used**: websearch for Supabase pooler docs, direct file reads/writes for .env edits, bash for Docker/psql/Vercel CLI operations
- **Agents Deployed**: Orchestrator (direct execution)
- **Architectural Decision**:
  - **Supabase PostgreSQL** (pooler at `aws-1-ap-south-1`, not `aws-0-ap-south-1`) as the database instead of Docker local PostgreSQL
  - **Express app exported as Vercel serverless function** at `api/[...path].js` — no `serverless-http` needed, Express IS a `(req, res)` handler
  - **Prisma schema pushed** to Supabase DB; seed data (3 users, 8 products, 6 jobs) loaded
  - **Frontend API_URL** uses `import.meta.env.VITE_API_URL` with fallback to `/api/v1`
  - **Monorepo root as Vercel project root** — both `apps/web/` and `backend/` accessible; npm workspaces provide all deps
  - **vercel.json** at root: build from monorepo root, output to `apps/web/dist`, rewrite `/api/*` to the catch-all function
  - **Fixed productController** reviews query (separate Prisma call instead of broken include)
  - **Fixed backend/index.js** to only `app.listen()` when `require.main === module` (allows importing as serverless handler)
- **URLs**:
  - Frontend: `https://web-vert-mu-22.vercel.app` (Genesis redesign, products clickable)
  - API: `https://web-vert-mu-22.vercel.app/api/v1/products` (returns 8 seeded products)
  - Supabase: `https://igrrgytacxqsetksrmqs.supabase.co` (PostgreSQL + Storage)
- **Demo logins**: `demo-seller@devchain.dev` / `Demo1234`, `demo-buyer@devchain.dev`, `demo-client@devchain.dev`
- **Next Turn Directive**: Set up CI (GitHub Actions) to auto-deploy on push, or add payment integration with real Stripe keys
