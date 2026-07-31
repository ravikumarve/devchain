# 🛒 Gumroad Listing — MarketFoundry

> **Working name:** MarketFoundry (alternatives: DevMarket, TwoSided, MarketDeck)
> **Category:** Development > Boilerplates & Starter Kits
> **Price anchor researched:** ShipFast Marketplace $349 · MakerKit Marketplace $299/yr · Fiverr clones $499-3,000
> **Status:** Draft v1 — ready for copy review, screenshots to be added

---

## TITLE (60 char max)

**MarketFoundry — Gumroad + Fiverr Marketplace Boilerplate (Express + React + Expo)**

*Alt title if too long: MarketFoundry — Marketplace Boilerplate with Escrow, Chat & Mobile App*

---

## SUBTITLE (one line, shown under title)

The only Gumroad + Fiverr marketplace boilerplate NOT locked to Next.js — escrow, chat, seller analytics, Expo mobile app, and 187 passing tests. Docker-free local setup. Deploy free on Supabase + Vercel + Render.

---

## HERO PITCH (top of description, above the fold)

**Stop rebuilding the hardest parts of a two-sided marketplace.**

You've seen the "ship in a weekend" boilerplates. They give you auth, Stripe, and a landing page — then you're on your own for the parts that actually make a marketplace work.

MarketFoundry is a **production-ready, two-sided developer marketplace** — a Gumroad + Fiverr + GitHub Marketplace hybrid — with every hard edge case already solved:

- ✅ **Escrow payments** with Stripe webhooks (not just a payment split)
- ✅ **In-app chat** between buyers and sellers (auto-creates conversations)
- ✅ **Seller analytics dashboard** — revenue, ratings, top products, insights
- ✅ **Expo mobile app** — same backend, 5 screens shipped
- ✅ **187 automated tests** — the only marketplace boilerplate that ships a test suite
- ✅ **Docker-free local mode** — runs on any laptop with just Node installed
- ✅ **No Next.js lock-in** — clean Express API + React/Vite frontend, the architecture mobile apps are actually built on

**And when you're ready to launch:** the Supabase + Vercel + Render pipeline is included and tested. Free tiers cover everything.

---

## THE PROBLEM (validation hook)

Building a two-sided marketplace is genuinely harder than standard SaaS:

- Two user types with different dashboards
- Payments that must split between you and every seller
- Escrow — holding money safely until work is delivered
- Trust infrastructure — reviews, ratings, ownership verification
- Buyers and sellers who need to talk *inside* your platform
- A mobile story your users will ask for on day one

ShipFast's marketplace edition doesn't do escrow. MakerKit's marketplace costs $299 **per year**. Fiverr clone scripts are $499-3,000 of PHP/CodeIgniter from 2015. And Sharetribe charges $299/month for the privilege of renting their platform.

**MarketFoundry gives you all of it, in your own code, for $149.**

---

## WHAT YOU GET (feature blocks)

### 🛒 The Marketplace
- Product listings with search & filters — sell code, templates, courses, anything digital
- Job/gig listings with proposals, bidding, delivery days, accept/reject lifecycle
- **Ownership verification** — SHA-256 proof-of-purchase so only real buyers can download
- Secure file delivery via signed URLs (Supabase Storage)

### 💰 Escrow Payments
- Stripe checkout → funds held → released on completion (webhook-verified)
- Duplicate-purchase protection, product ownership checks, download security
- Works with Stripe **test mode** out of the box — no live keys needed to try it

### 💬 Chat & Trust
- Buyer ↔ seller messaging with auto-conversation creation
- Message buttons on every job/product page
- Reviews & ratings with star breakdowns feeding the analytics dashboard

### 📊 Seller Analytics
- Revenue, sales, and comparison metrics
- Average rating, 5-star breakdown, top-rated products
- Actionable insights (praise, warnings, nudges)

### 📱 Mobile App (Pro tier)
- Expo + React Native — Android & iOS
- Login, marketplace, chat, analytics, jobs — 5 screens wired to the same API
- One backend, two frontends

### 🧪 Tests & Quality
- **187 passing Jest tests** across auth, products, jobs, payments, uploads, analytics
- Backend hardening: Joi validation, rate limiting, centralized error handling, pino logging, CORS whitelist
- **AGENTS.md included** — AI coding tools (Cursor, Claude Code) understand the conventions and produce code that fits, not fights

---

## THE STACK

| Layer | Tech |
|---|---|
| Monorepo | npm workspaces |
| Backend | Node.js + Express (CommonJS) + Prisma |
| Web | React 19 + TypeScript + Vite + shadcn/ui |
| Mobile | React Native + Expo |
| Database | SQLite (local) → PostgreSQL/Supabase (prod) |
| Storage | Local disk (dev) → Supabase Storage (prod) |
| Payments | Stripe (test mode ready) |
| Auth | JWT access + refresh rotation |
| Tests | Jest — 187 passing |
| Deploy | Vercel + Render + Supabase (free tiers) |

---

## RUN IT LOCALLY IN 5 MINUTES — NO DOCKER

```
./setup.sh
```
That's it. No Docker, no Supabase account, no cloud dependencies. SQLite + local file storage means the entire stack boots on your laptop with **just Node installed**. You'll see the marketplace, chat, escrow, and analytics running against real demo data in minutes.

**When you're ready to launch**, flip three env vars and deploy to Supabase + Vercel + Render — the exact pipeline this boilerplate was built and tested on. A complete deployment guide walks you through it.

---

## VS THE ALTERNATIVES

| | **MarketFoundry** | ShipFast Marketplace | MakerKit Marketplace | Fiverr clone scripts |
|---|---|---|---|---|
| Price | **$149** 1× | $349 1× | $299/**yr** | $499-3,000 1× |
| Stack | Express + React + Expo | Next.js | Next.js | PHP/CodeIgniter |
| Escrow | ✅ Built | ❌ Not included | ⚠️ Manual only | ⚠️ Varies |
| In-app chat | ✅ Built | ❌ | ❌ | ⚠️ Varies |
| Seller analytics | ✅ Built | ❌ | ❌ | ❌ |
| Mobile app | ✅ Pro tier | ❌ | ❌ | Extra $ |
| Test suite | ✅ 187 tests | ❌ | ❌ | ❌ |
| Docker-free local | ✅ SQLite | ❌ | ❌ | ⚠️ |
| Source ownership | ✅ Yours | ✅ | ⚠️ Subscription | ✅ |

---

## WHO THIS IS FOR

- **Indie hackers** launching a niche marketplace (courses, templates, services, code)
- **Agencies** that need a proven two-sided platform foundation for client work
- **Developers** who prefer Express + React over the Next.js monoculture
- **Founders** who want to own their code — not rent a platform at $299/month

## WHO THIS IS NOT FOR

- People who want a no-code platform — use Sharetribe or Prometora
- Teams needing multi-vendor Stripe Connect split payouts out of the box — this uses direct seller payments + platform fee (Roadmap: Connect)
- People who refuse to read a README

---

## PRICING

### 🚀 Starter — $149 (one-time)
- Full web app + backend source code
- Escrow, chat, analytics, ownership verification
- SQLite local mode + demo data
- 187 tests
- Deployment guide (Supabase + Vercel + Render)
- Lifetime updates

### 🏆 Pro — $249 (one-time)
- Everything in Starter
- **Expo mobile app** (5 screens, same API)
- Extended deployment + mobile build guide
- Priority email support

*One-time purchase. No subscriptions. No per-project licensing. Use it on unlimited projects.*

---

## WHAT'S IN THE DOWNLOAD

```
devchain/
├── apps/
│   ├── mobile/          # Expo + React Native (Pro)
│   └── web/             # React 19 + Vite + shadcn/ui
├── backend/             # Express + Prisma + 187 tests
│   └── prisma/          # Schema + migrations + seed
├── shared/              # Shared types & utilities
├── docs/                # SETUP, ARCHITECTURE, API, DEPLOYMENT
├── scripts/             # setup.sh, db-mode, seed
└── AGENTS.md            # AI-coding conventions
```

---

## FAQ

**Q: Do I need Docker?**
A: No. Local mode uses SQLite + local file storage. Node.js 18+ is the only requirement.

**Q: Can I really run this in 5 minutes?**
A: Yes. `./setup.sh` copies config, installs deps, migrates the DB, seeds demo data, and starts both servers. Then open http://localhost:5173.

**Q: What about payments? Do I need a Stripe account?**
A: Stripe test mode works out of the box — you can walk the full escrow flow with test cards. Live mode needs free Stripe keys, configured in `.env`.

**Q: How do I deploy to production?**
A: The included DEPLOYMENT.md walks you through Supabase (database + storage), Vercel (frontend), and Render (backend) — all free tiers. This exact pipeline has been tested end-to-end.

**Q: Can I use this for client work?**
A: Yes. Unlimited projects, one-time license. (No reselling the boilerplate itself.)

**Q: Is there a mobile app?**
A: Pro tier includes the Expo mobile app with marketplace, chat, analytics, and jobs screens.

**Q: The code is Express, not Next.js — why?**
A: The API/mobile/web separation is the architecture real products use. Your mobile app reuses the same API, and you're not locked into a single framework's ecosystem. If you're building on Next.js, this isn't for you.

**Q: Do you offer refunds?**
A: 30-day money-back guarantee — if the boilerplate doesn't do what the listing says, email us for a full refund.

**Q: What if I get stuck?**
A: Email support included (Pro gets priority). The repo ships with AGENTS.md so AI coding tools can help you navigate and extend it.

---

## LICENSE & LEGAL

- **License:** Commercial license — use on unlimited personal & client projects. You may NOT resell or redistribute the source as a competing boilerplate.
- **Trademarks:** "Stripe", "Gumroad", "Fiverr", "Supabase", "Vercel", "Render", "Next.js" are property of their respective owners. This product is not affiliated with or endorsed by them.

---

## ABOUT THE MAKER

Built solo over 6 months — every feature in this boilerplate ran in production on a live demo marketplace: 8 products, 6 jobs, real chat threads, real analytics. When a Vercel env var crash took down the API, the fix went back into the boilerplate — you're buying code that has been **broken in production and fixed**, not a fresh scaffold.

---

## SCREENSHOT PLAN (to capture)

1. Hero: marketplace grid with demo products
2. Product detail with "Message Seller" + escrow/buy flow
3. Chat thread view
4. Seller analytics dashboard (charts + ratings)
5. Job detail with proposals
6. Mobile app screens (2-3)
7. `./setup.sh` terminal output (5-min proof)

---

## LAUNCH NOTES

- **Affiliate program:** 30% revshare (ShipFast's affiliate engine made it #1 — same playbook)
- **Founding discount:** $97 for first 20 buyers (anchors "goes up to $149")
- **Demo URL required:** deploy the live demo before listing goes live — buyers click before they pay
- **Content pipeline:** 3 Dev.to posts (architecture, escrow build, why not Next.js) + 1 Loom walkthrough video
