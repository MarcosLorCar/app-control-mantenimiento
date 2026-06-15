#!/usr/bin/env bash
# Levanta DB, backend y frontend

set -e

cleanup() {
  echo ""
  echo "→ Deteniendo procesos..."
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
  wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
  stty sane
}
trap cleanup EXIT INT TERM

echo "→ Iniciando base de datos..."
docker compose up -d db || true

echo "→ Esperando a PostgreSQL..."
until docker exec infragest-db pg_isready -U postgres -q; do
  sleep 1
done

echo "→ Ejecutando migraciones..."
npm run db:migrate --workspace=@infragest/backend

echo "→ Arrancando backend y frontend..."
npm run dev --workspace=@infragest/backend &
BACKEND_PID=$!
npm run dev --workspace=@infragest/frontend &
FRONTEND_PID=$!

wait
