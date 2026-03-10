# DevChain 🔗

> Blockchain-powered developer marketplace — Buy, sell, and own digital products forever.

## What is DevChain?
DevChain is a cross-platform marketplace where developers buy and sell code, templates, and digital products. Every purchase is backed by a blockchain ownership certificate.

## Tech Stack
- **Frontend:** React Native + Expo (Web, iOS, Android)
- **Backend:** Node.js + Express
- **Database:** PostgreSQL (Supabase)
- **Cache:** Redis (Upstash)
- **Storage:** Firebase Storage
- **Blockchain:** Simulated → Polygon (Phase 2)

## Project Structure
\`\`\`
devchain/
├── apps/
│   ├── mobile/     # React Native + Expo app
│   └── web/        # Web-specific frontend
├── backend/        # Node.js + Express API
├── blockchain/     # Smart contracts (Phase 2)
├── shared/         # Shared types and utilities
└── docs/           # Documentation
\`\`\`

## Getting Started
\`\`\`bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/devchain.git
cd devchain

# Install dependencies
npm run install:all

# Start backend
npm run backend

# Start mobile app
npm run mobile
\`\`\`

## Roadmap
- [x] Architecture planning
- [x] Project setup
- [ ] User auth (register/login)
- [ ] Product listings
- [ ] Stripe payments
- [ ] Ownership certificates
- [ ] Freelancer job board
- [ ] Blockchain integration

## License
MIT
