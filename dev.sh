#!/usr/bin/env bash
# Usage: ./dev.sh
# Starts the dev DB, runs any pending migrations, then launches backend + frontend.
set -e

echo "→ Starting DB container..."
docker compose up -d

echo "→ Waiting for DB to be ready..."
for i in $(seq 1 30); do
  docker compose exec db pg_isready -U postgres -d infragest_dev > /dev/null 2>&1 && break
  [ "$i" -eq 30 ] && echo "DB did not become ready in time." && exit 1
  sleep 1
done
echo "  DB ready."

echo "→ Running migrations..."
(cd backend && npx prisma migrate dev)

read -r -p "→ Run seed? This will wipe and recreate all dev data [y/N] " answer
if [[ "$answer" =~ ^[Yy]$ ]]; then
  echo "→ Seeding..."
  (cd backend && npx prisma db seed)
fi

echo "→ Starting dev servers..."
npm run dev
