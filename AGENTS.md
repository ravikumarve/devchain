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

## Deployment & Infrastructure

| Layer     | Service                        | URL / ID                              |
|-----------|-------------------------------|---------------------------------------|
| Frontend  | Vercel                         | `devchain-app.vercel.app`             |
| Backend   | Render                         | `devchain.onrender.com`               |
| Database  | PostgreSQL (via Render/Prisma) | See `DATABASE_URL` in `.env`          |
| Storage   | Supabase Storage               | Project ID: `ldqpqggbvqjgucucxeny`    |
| S3 Bucket | `devchain-files`               | Used for file upload/download         |

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
export function Navbar() { }
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
