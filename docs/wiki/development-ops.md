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
./dev.sh          # Linux/Mac
./dev.ps1         # Windows

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

- PostgreSQL en `localhost:5433` (mapeado desde el contenedor en `5432`).
- Migrations y seed via Prisma (ver `backend/prisma/`).

```bash
cd backend && npx prisma migrate dev   # apply migrations
cd backend && npx prisma db seed       # seed roles + dev users
cd backend && npx prisma studio        # GUI browser
```

## Environment variables

`backend/.env` (backend runtime):

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (dev DB) |
| `TEST_DATABASE_URL` | PostgreSQL connection string (test DB) |
| `JWT_SECRET` | Secret for access tokens (15 min) |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens (httpOnly cookie) |
| `GOOGLE_CLIENT_ID` | Google OAuth — omit to disable Google login |
| `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `GOOGLE_CALLBACK_URL` | Google OAuth redirect URI |
| `FRONTEND_URL` | Used for OAuth redirects |

Root `.env` / `.env.example` (Docker Compose):

| Variable | Description |
|---|---|
| `COMPOSE_PROJECT_NAME` | Docker Compose project name |
| `POSTGRES_PASSWORD` | DB root password |
| `ADMIN_EMAIL` | Email for the initial admin account (created by seed) |
| `ADMIN_PASSWORD` | Password for the initial admin account |
| `JWT_SECRET` | Passed through to backend container |
| `JWT_REFRESH_SECRET` | Passed through to backend container |
| `GOOGLE_CLIENT_ID` | Passed through to backend container |
| `GOOGLE_CLIENT_SECRET` | Passed through to backend container |
| `GOOGLE_CALLBACK_URL` | Passed through to backend container |
| `FRONTEND_URL` | Passed through to backend container |

## Google OAuth

Google login is optional. It activates automatically when `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set. The `GET /api/v1/auth/providers` endpoint tells the frontend which providers are available, so the login button appears only when configured.

Google login only works if the user's email already exists in the `users` table.

## Secrets policy

- No guardar secrets en el repositorio.
- No publicar passwords reales en la wiki.
