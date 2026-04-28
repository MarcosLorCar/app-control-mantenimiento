#!/usr/bin/env bash
# Levanta DB, backend y frontend

set -e
trap 'kill 0' EXIT

echo "→ Iniciando base de datos..."
if ! docker inspect -f '{{.State.Running}}' control-actions-db 2>/dev/null | grep -q '^true$'; then
  docker compose up -d db
fi

echo "→ Esperando a PostgreSQL..."
until docker exec control-actions-db pg_isready -U postgres -q; do
  sleep 1
done

echo "→ Ejecutando migraciones..."
npm run db:migrate --workspace=@control-actions/backend

echo "→ Arrancando backend y frontend..."
npm run dev --workspace=@control-actions/backend &
npm run dev --workspace=@control-actions/frontend &

wait
