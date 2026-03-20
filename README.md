# DevChain 🔗

> A blockchain-powered developer marketplace — buy/sell digital products, hire freelancers, own your work.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native + Expo |
| Backend | Node.js + Express |
| Database | PostgreSQL via Supabase |
| Cache | Redis via Upstash |
| Storage | Firebase Storage |
| Blockchain | Simulated (Polygon planned) |

## Project Structure
```
devchain/
├── apps/mobile/     # Expo app (iOS, Android, Web)
├── apps/backend/    # REST API
└── packages/shared/ # Shared TypeScript types
```

## Getting Started

1. Clone the repo: `git clone https://github.com/YOUR_USERNAME/devchain.git`
2. Install dependencies: `npm install`
3. Copy env template: `cp .env.example .env`
4. Fill in your credentials in `.env`
5. Start backend: `npm run backend`
6. Start mobile: `npm run mobile`

## Environment Setup

See `.env.example` for all required environment variables.
Never commit `.env` files. They are gitignored.

## Cost

- Development: **$0/month**
- MVP scale: **~$50/month**
- Growth: **~$500/month**
```

---

### 💰 Cost of This Step

| Item | Cost |
|---|---|
| GitHub repo | $0 (free) |
| GitHub Actions (2000 min/month) | $0 (free) |
| All tooling (ESLint, Prettier, Husky, TypeScript) | $0 (all open source) |
| **Total** | **$0.00** |

---

### ✅ After Running All This, Your Repo State Is:
```
✅ Git initialized
✅ Monorepo structure created
✅ Shared TypeScript types defined
✅ All environment variables documented
✅ ESLint + Prettier configured
✅ Husky blocks bad commits
✅ GitHub Actions CI running on every push
✅ .gitignore protecting secrets
✅ README.md documenting the project
