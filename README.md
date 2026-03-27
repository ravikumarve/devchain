# DevChain 🚀

**The Blockchain-Powered Developer Marketplace** — Gumroad meets Fiverr meets GitHub Marketplace for developers

[![Live Demo](https://img.shields.io/badge/demo-live-7C3AED?style=for-the-badge&logo=vercel)](https://devchain-app.vercel.app)
[![Backend API](https://img.shields.io/badge/API-live-059669?style=for-the-badge)](https://devchain.onrender.com/api/v1)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg?style=for-the-badge)](LICENSE)

DevChain is a next-generation marketplace where developers can sell digital products, offer services, and connect with clients — all secured by blockchain ownership verification.

## ✨ Why DevChain?

- **🛍️ Sell Anything Digital**: Templates, tools, courses, scripts, design assets
- **🔐 Blockchain Ownership**: Every purchase gets a verifiable SHA-256 certificate
- **📊 Real Analytics**: Track sales, revenue, and performance metrics
- **⚡ Instant Delivery**: Automated file delivery via Supabase Storage
- **🌐 Full-Stack**: Web + mobile apps with TypeScript everywhere

## 🚀 Quick Start

Get up and running in 5 minutes:

```bash
# Clone and setup
npm run install:all

# Environment setup
cp .env.example .env
cp backend/.env.example backend/.env

# Database setup
cd backend && npx prisma migrate dev

# Start everything
npm start              # Backend API (port 10000)
npm run web:dev        # Web app (port 5173)
npm run mobile:start   # Mobile app
```

## 🏗️ Architecture Overview

```
devchain/
├── apps/
│   ├── web/           # React 19 + TypeScript + Vite
│   └── mobile/        # React Native + Expo
├── backend/           # Node.js + Express + Prisma
├── packages/
│   └── shared/        # Shared types and utilities
└── docs/              # Documentation
```

### 📊 Tech Stack

| Layer          | Technology                   | Purpose                          |
| -------------- | ---------------------------- | -------------------------------- |
| **Frontend**   | React 19 + TypeScript + Vite | Modern web app with type safety  |
| **Mobile**     | React Native + Expo          | Cross-platform mobile experience |
| **Backend**    | Node.js + Express            | RESTful API server               |
| **Database**   | PostgreSQL + Prisma          | Type-safe database operations    |
| **Storage**    | Supabase Storage             | Secure file upload/download      |
| **Auth**       | JWT + bcrypt                 | Secure authentication system     |
| **Deployment** | Vercel + Render              | Scalable cloud infrastructure    |

## 🎯 Core Features

### 🛒 Marketplace

- Browse and search digital products
- Filter by category, price, tags
- Secure checkout with blockchain verification

### 👨‍💼 Seller Dashboard

- **Analytics**: Revenue tracking, sales performance
- **Product Management**: Create, edit, manage listings
- **File Delivery**: Automated upload/download system

### 💼 Job Board

- Post development jobs
- Apply with proposals
- Hire developers securely

### 🔐 Authentication

- JWT-based auth with refresh tokens
- Protected routes with role-based access
- Secure file access controls

## 📋 API Reference

The REST API follows consistent patterns:

### Base URL

```
https://devchain.onrender.com/api/v1
```

### Endpoints

| Method | Endpoint              | Description                | Auth Required |
| ------ | --------------------- | -------------------------- | ------------- |
| `GET`  | `/products`           | List products with filters | ❌            |
| `POST` | `/products`           | Create new product         | ✅ Seller     |
| `GET`  | `/products/:id`       | Get product details        | ❌            |
| `GET`  | `/products/seller/me` | Get seller's products      | ✅ Seller     |
| `POST` | `/auth/login`         | User login                 | ❌            |
| `POST` | `/auth/register`      | User registration          | ❌            |
| `GET`  | `/auth/me`            | Get current user           | ✅            |

### Example: Create Product

```javascript
POST /api/v1/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "React Dashboard Template",
  "description": "Modern dashboard with dark mode support",
  "price": 29.99,
  "category": "templates",
  "tags": ["react", "dashboard", "typescript"],
  "previewUrl": "https://github.com/example/repo"
}
```

## ⚙️ Configuration

### Environment Variables

#### Root (.env)

| Variable   | Description      | Default       |
| ---------- | ---------------- | ------------- |
| `NODE_ENV` | Environment mode | `development` |

#### Backend (backend/.env)

| Variable                 | Description                  | Required |
| ------------------------ | ---------------------------- | -------- |
| `DATABASE_URL`           | PostgreSQL connection string | ✅       |
| `JWT_SECRET`             | JWT signing secret           | ✅       |
| `JWT_REFRESH_SECRET`     | Refresh token secret         | ✅       |
| `JWT_EXPIRES_IN`         | Access token expiry          | `15m`    |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry         | `7d`     |
| `PORT`                   | Server port                  | `10000`  |
| `SUPABASE_URL`           | Supabase project URL         | ✅       |
| `SUPABASE_SERVICE_KEY`   | Supabase service role key    | ✅       |

## 🚀 Deployment

### Web App (Vercel)

- Connected to `main` branch
- Automatic deployments on push
- Environment variables in Vercel dashboard

### Backend API (Render)

- Connected to `main` branch
- Automatic deployments on push
- PostgreSQL database provisioned
- Environment variables in Render dashboard

### Database Migrations

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

## 🛠️ Development Commands

### Root Workspace

```bash
npm run install:all    # Install all dependencies
npm run build          # Build backend + generate Prisma client
npm start              # Start backend server
```

### Web App

```bash
cd apps/web
npm run dev            # Start dev server (port 5173)
npm run build          # Build for production
npm run lint           # Run ESLint
npm run preview        # Preview production build
```

### Backend

```bash
cd backend
npm run dev            # Start with nodemon (auto-reload)
npm run start          # Start production server
npx prisma generate    # Regenerate Prisma client
npx prisma studio      # Open database admin UI
```

## 📈 Roadmap

### 🎯 Phase 1: Core Marketplace (Current)

- [x] User authentication system
- [x] Product marketplace with search/filter
- [x] Seller dashboard with analytics
- [x] File upload/download system
- [x] Job board for services

### 🔐 Phase 2: Blockchain Integration (Q2 2025)

- [ ] Polygon blockchain integration
- [ ] Smart contracts for digital ownership
- [ ] NFT-based certificates for purchases
- [ ] On-chain verification system

### 💰 Phase 3: Monetization (Q3 2025)

- [ ] Stripe payment processing
- [ ] Seller payout system
- [ ] Subscription models
- [ ] Escrow services for jobs

### 🚀 Phase 4: Growth (Q4 2025)

- [ ] Review and rating system
- [ ] Seller verification (KYC)
- [ ] Advanced analytics
- [ ] Mobile app completion

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](docs/CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📖 [Documentation](docs/) - Detailed guides and API references
- 🐛 [Issue Tracker](https://github.com/your-org/devchain/issues) - Report bugs or request features
- 💬 [Discussions](https://github.com/your-org/devchain/discussions) - Questions and community support

## 🙏 Acknowledgments

- Built with ❤️ by developers, for developers
- Inspired by Gumroad, Fiverr, and GitHub Marketplace
- Powered by modern web technologies and blockchain innovation

---

**DevChain** - Where code meets commerce, secured by blockchain. 🚀
