#!/bin/bash
# DevChain — start local dev environment
# Prerequisites: Docker, Node.js

set -e

echo "🚀 Starting DevChain development environment..."

# 1. Start PostgreSQL if not running
if ! docker ps --format '{{.Names}}' | grep -q devchain-pg; then
  echo "📦 Starting PostgreSQL container..."
  docker start devchain-pg 2>/dev/null || docker run -d --name devchain-pg \
    -e POSTGRES_USER=devchain \
    -e POSTGRES_PASSWORD=devchain123 \
    -e POSTGRES_DB=devchain \
    -p 5432:5432 \
    postgres:16-alpine
  sleep 2
fi
echo "  ✅ PostgreSQL is running"

# 2. Push Prisma schema if needed
echo "🗄️  Syncing database schema..."
(cd backend && npx prisma db push --skip-generate 2>/dev/null)
echo "  ✅ Schema synced"

# 3. Seed database if empty
PRODUCT_COUNT=$(cd backend && node -e "const{PrismaClient}=require('@prisma/client');new PrismaClient().product.count().then(c=>{console.log(c);process.exit()})" 2>/dev/null || echo "0")
if [ "$PRODUCT_COUNT" = "0" ] || [ -z "$PRODUCT_COUNT" ]; then
  echo "🌱 Seeding database..."
  node backend/seed.js
fi

# 4. Start backend
echo "⚙️  Starting API server on :5000..."
node backend/src/index.js &
BACKEND_PID=$!
echo "  ✅ Backend running (PID: $BACKEND_PID)"

# 5. Start frontend
echo "🎨 Starting frontend on :5173..."
(cd apps/web && npx vite --host) &
FRONTEND_PID=$!
echo "  ✅ Frontend running (PID: $FRONTEND_PID)"

echo ""
echo "═══════════════════════════════════════"
echo "  🛒  Marketplace: http://localhost:5173"
echo "  🔑  Login: democreator / Demo1234"
echo "═══════════════════════════════════════"
echo ""
echo "Press Ctrl+C to stop both servers."

wait
