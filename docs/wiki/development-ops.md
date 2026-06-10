# Development & Ops

## Install

Desde la raiz del monorepo:

```bash
npm install
```

## Run (dev)

En terminales separadas:

```bash
npm run dev --workspace=backend
npm run dev --workspace=@control-actions/frontend
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
