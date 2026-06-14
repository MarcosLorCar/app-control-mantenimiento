#!/bin/sh
set -e

echo "Running prisma migrations..."
npx prisma migrate deploy

echo "Starting the Fastify backend server..."
exec node dist/backend/src/server.js
