#!/bin/sh
set -e

echo "Running prisma migrations..."
npx prisma migrate deploy

echo "Running bootstrap (roles + admin)..."
node dist/prisma/bootstrap.js

echo "Starting the Fastify backend server..."
exec node dist/src/server.js
