# Development & Ops

## Install

Desde la raiz del monorepo:

```bash
npm install
```

## Run (dev)

Arranca todo el stack en paralelo con un único comando:

```bash
# Levanta la base de datos, corre migraciones e inicia servidores
./dev.sh

# O si la DB ya está levantada, corre concurrentemente los dev servers:
npm run dev
```

O en terminales independientes:

```bash
# Terminal 1: Backend
npm run dev:backend

# Terminal 2: Frontend
npm run dev:frontend
```

## Database

- PostgreSQL en `localhost:5432`.
- Migrations y seed via Prisma (ver `backend/prisma/`).

## Environment variables

Variables tipicas (ejemplos, no valores):

- `DATABASE_URL`
- `TEST_DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`

## Secrets policy

- No guardar secrets en el repositorio.
- No publicar passwords reales en la wiki.
