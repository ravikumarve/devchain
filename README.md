# DevChain

**Gumroad + Fiverr for developers, powered by blockchain**

[Live Demo](https://web-vert-mu-22.vercel.app) | [API Documentation](./docs/API.md)

DevChain is a blockchain-powered developer marketplace that connects developers with clients for digital products, services, and job opportunities.

## ✨ Features

- ✅ **Authentication System** - JWT-based auth with refresh tokens
- ✅ **Marketplace** - Browse and purchase developer products
- ✅ **Seller Dashboard** - Analytics and sales tracking
- ✅ **File Delivery** - Secure file upload/download via Supabase Storage
- ✅ **Job Board** - Post and apply for development jobs
- ✅ **User Profiles** - Portfolio and transaction history

## 🛠️ Tech Stack

| Layer      | Technology                      |
| ---------- | ------------------------------- |
| Frontend   | React 19 + TypeScript + Vite    |
| Mobile     | React Native + Expo             |
| Backend    | Node.js + Express               |
| Database   | PostgreSQL + Prisma ORM         |
| Storage    | Supabase Storage                |
| Auth       | JWT + bcrypt                    |
| Deployment | Vercel (Web) + Render (Backend) |

## 📁 Monorepo Structure

```
devchain/
├── apps/
│   ├── web/          # React web app (Vite + TypeScript)
│   └── mobile/       # React Native app (Expo)
├── backend/          # Node.js API server (Express + Prisma)
├── packages/
│   └── shared/       # Shared types and utilities
├── docs/             # Documentation
└── scripts/          # Build and deployment scripts
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- Supabase account (for file storage)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd devchain
   ```

2. **Install dependencies**

   ```bash
   npm run install:all
   ```

3. **Environment setup**

   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   ```

4. **Configure environment variables** (see table below)

5. **Database setup**

   ```bash
   cd backend
   npx prisma migrate dev
   npx prisma generate
   ```

6. **Start development servers**

   ```bash
   # Backend (port 10000)
   npm run backend

   # Web app (port 5173)
   npm run web

   # Mobile app
   npm run mobile
   ```

## 🔧 Environment Variables

### Root .env

| Variable   | Description      | Example       |
| ---------- | ---------------- | ------------- |
| `NODE_ENV` | Environment mode | `development` |

### Backend .env

| Variable                 | Description                  | Example                                          |
| ------------------------ | ---------------------------- | ------------------------------------------------ |
| `DATABASE_URL`           | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/devchain` |
| `JWT_SECRET`             | JWT signing secret           | `your-secret-key`                                |
| `JWT_REFRESH_SECRET`     | Refresh token secret         | `your-refresh-secret`                            |
| `JWT_EXPIRES_IN`         | Access token expiry          | `15m`                                            |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry         | `7d`                                             |
| `PORT`                   | Server port                  | `10000`                                          |
| `SUPABASE_URL`           | Supabase project URL         | `https://project.supabase.co`                    |
| `SUPABASE_SERVICE_KEY`   | Supabase service role key    | `sbp_xxx`                                        |

## 🚀 Deployment

### Web App (Vercel)

- Connected to main branch
- Automatic deployments on push
- SPA routing configured via `vercel.json`

### Backend API (Render)

- Connected to main branch
- Automatic deployments on push
- Environment variables configured in Render dashboard
- PostgreSQL database provisioned

### Database Migrations

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

## 📋 Roadmap

- [ ] **Blockchain integration** (Polygon) - Digital ownership verification
- [ ] **Mobile app completion** (Expo) - Full iOS/Android support
- [ ] **Review & rating system** - Trust and reputation management
- [ ] **Seller verification** - KYC and identity verification
- [ ] **Payment processing** - Stripe integration for payouts
- [ ] **Smart contracts** - Escrow and dispute resolution
- [ ] **Notifications** - Real-time updates and emails
- [ ] **Admin dashboard** - Content moderation and analytics

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.
