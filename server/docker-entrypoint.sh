#!/bin/sh
set -e

echo "[entrypoint] Applying database migrations..."
npx prisma migrate deploy --schema ./prisma/schema.prisma

echo "[entrypoint] Seeding admin user (if missing)..."
node ./dist-seed/seed.js || echo "[entrypoint] Seeding skipped (will continue on next start)."

echo "[entrypoint] Starting server..."
exec node ./dist/main.js