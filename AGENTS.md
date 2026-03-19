# AGENTS.md - DevChain Codebase Guide

## Project Overview

DevChain is a blockchain-powered developer marketplace (monorepo with npm workspaces).

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

---

## Build, Lint, and Test Commands

### Root Workspace
```bash
npm run install:all       # Install all workspace dependencies
npm run build             # Backend: npm install + prisma generate
npm start                # Start backend server (node backend/src/index.js)
```

### Backend (`/backend`)
```bash
npm run dev              # Start with nodemon (auto-reload)
npm run start            # Start without reload
npm run test             # Placeholder (no tests yet)
npx prisma generate      # Regenerate Prisma client
npx prisma studio        # Open Prisma admin UI
```

### Web App (`/apps/web`)
```bash
npm run dev              # Start Vite dev server
npm run build            # TypeScript compile + Vite build
npm run lint             # Run ESLint
npm run lint -- --fix    # Auto-fix lint issues
npm run preview          # Preview production build
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
npm run start            # Start Expo dev server
npm run android          # Start for Android
npm run ios              # Start for iOS
npm run web              # Start for web
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

// Component - named export for reuse
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

**Inline styles:** Use `Record<string, React.CSSProperties>` pattern (see existing pages)
- Keep all styles in a `const styles` object at bottom
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

**Query patterns:**
```javascript
const item = await prisma.model.findUnique({ where: { id } });
const items = await prisma.model.findMany({ where, orderBy, take, skip });
await prisma.model.create({ data });
await prisma.model.update({ where: { id }, data });
await prisma.model.delete({ where: { id } }); // or soft delete
```

---

## API Design Conventions

### RESTful Endpoints
- `GET /api/v1/resource` - List
- `GET /api/v1/resource/:id` - Get one
- `POST /api/v1/resource` - Create
- `PUT/PATCH /api/v1/resource/:id` - Update
- `DELETE /api/v1/resource/:id` - Delete

### Authentication
- Bearer token in Authorization header
- JWT access tokens (short-lived, 15m)
- JWT refresh tokens (long-lived, 7d)
- Protected routes use `protect` middleware

### Request/Response
- JSON for all requests/responses
- Validation with Joi on backend
- Return appropriate HTTP status codes
- Never expose sensitive data (passwords, hashes)

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
```

---

## Adding New Features

### Backend
1. Add route in `src/routes/`
2. Add controller in `src/controllers/`
3. Add service/model in `src/services/` or `src/models/` if needed
4. Add middleware in `src/middleware/` if needed
5. Update `src/index.js` to mount route
6. Run `npx prisma generate` if schema changed

### Web App
1. Add page component in `src/pages/`
2. Add API methods in `src/services/api.ts`
3. Add store in `src/store/` if needed
4. Add route in `src/App.tsx`

### Database Changes
1. Edit `backend/prisma/schema.prisma`
2. Run `npx prisma migrate dev --name description`
3. Run `npx prisma generate`

---

## Testing

Currently no tests configured. When adding tests:
- Backend: Use Jest or Mocha in `/backend/tests/`
- Web: Use Vitest (preferred with Vite) or Jest
- Mobile: Use Jest with React Native Testing Library
- Place test files next to source: `Login.test.tsx` alongside `Login.tsx`

---

## Important Notes

1. **Backend uses CommonJS** (`require/module.exports`) - do not convert to ESM
2. **Web app uses ESM** (`import/export`) with TypeScript
3. **Always regenerate Prisma client** after schema changes
4. **API base URL** is hardcoded in web app: `https://devchain.onrender.com/api/v1`
5. **Mobile and web share similar patterns** but have separate codebases
