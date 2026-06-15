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
until docker exec control-actions-db pg_isready -U postgres -q; do
  sleep 1
done

echo "→ Ejecutando migraciones..."
npm run db:migrate --workspace=@control-actions/backend

echo "→ Arrancando backend y frontend..."
npm run dev --workspace=@control-actions/backend &
BACKEND_PID=$!
npm run dev --workspace=@control-actions/frontend &
FRONTEND_PID=$!

wait
