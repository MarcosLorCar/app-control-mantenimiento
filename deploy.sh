#!/usr/bin/env bash
set -e

COMPOSE="docker compose -f docker-compose.ghcr.yml"

echo "→ Pulling latest images..."
$COMPOSE pull

echo "→ Starting services..."
$COMPOSE up -d

echo "→ Done. Logs:"
$COMPOSE logs --tail=20 --no-log-prefix
