# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install (from root)
npm install

# Dev — runs backend + frontend concurrently
npm run dev

# Individual services
npm run dev:backend      # Fastify on :3000
npm run dev:frontend     # Vite on :5173

# Tests
npm run test:backend     # vitest run (integration, hits real DB)
npm test --workspace=@infragest/frontend

# Build
npm run build:backend    # tsc → dist/
npm run build --workspace=@infragest/frontend

# DB
cd backend && npx prisma migrate dev   # apply migrations
cd backend && npx prisma db seed       # seed roles + dev users
cd backend && npx prisma studio        # GUI browser

# Docker DB (port 5433 → 5432 inside container)
docker-compose up -d
```

Backend tests require a real PostgreSQL instance (no mocks). Setup is in `backend/tests/helpers/db.ts`. Tests run serially (`fileParallelism: false`), timeout 30 s.

## Architecture

**Monorepo** (`npm workspaces`): `shared`, `backend`, `frontend`.

### Shared (`shared/src/types.ts`)
Single source of truth for cross-boundary types: `JwtPayload`, `ApiSuccess<T>`, `ApiError`. Both backend and frontend import from `@control-actions/shared`.

### Backend (`backend/`)
- **Fastify 4** + **Prisma 5** + **PostgreSQL 16**
- Entry: `src/server.ts` → `src/app.ts` (`buildApp`)
- Plugins registered in order: rate-limit → cookie → JWT (access + refresh namespaces) → multipart → static (`/uploads/`) → prisma → auth decorators → OAuth2 (conditional)
- Auth decorators on `FastifyInstance`: `verifyToken`, `requireWrite`, `requireManage` — added by `plugins/auth.plugin.ts`
- JWT: access token (15 min, Bearer header), refresh token (httpOnly cookie `refreshToken`). Access token lives in memory on the frontend and is restored via `/api/v1/auth/refresh` on page load.
- Module pattern: each domain in `src/modules/<name>/` has `*.routes.ts`, `*.schema.ts` (Zod), `*.service.ts`
- API prefix: `/api/v1/*`
- Uploads stored to `backend/uploads/`, served as static at `/uploads/`

### Frontend (`frontend/`)
- **React 18 + Vite + TypeScript + Tailwind**
- `src/api/client.ts` — central `apiFetch` wrapper: injects Bearer token, auto-retries once after transparent refresh on 401
- `src/contexts/AuthContext.tsx` — session state; restores from refresh cookie on mount
- `src/api/*.ts` — one file per domain, all use `apiFetch`
- `src/hooks/use*.ts` — data-fetching hooks wrapping the api layer
- `src/components/RoleGuard.tsx` + `ProtectedRoute.tsx` — RBAC in the router
- Vite dev server proxies `/api` → `localhost:3000`

### Data model highlights
- `Location` uses **materialized path** (`path` column, format `/rootId/.../selfId/`) for fast subtree queries
- `Material.attributes` and `MaterialType.customAttributes` are `Json` columns — schema is freeform, typed via frontend convention
- `ActionMaterial.snapshot` captures material state at time of action (denormalized)
- Soft deletes via `deletedAt` on `User`, `Location`, `MaterialType`, `Material`
- `Role` drives permissions: `canWrite` → `requireWrite`, `canManage` → `requireManage`
- `SystemSetting` key/value table for runtime config
- `FixedProperty` exists in schema but has no routes/services yet

### Auth flow
1. POST `/api/v1/auth/login` → returns `accessToken` (body) + sets `refreshToken` cookie
2. Frontend stores access token in module-level variable (`api/client.ts`)
3. On 401, `apiFetch` calls `/api/v1/auth/refresh` silently; on success retries original request
4. Google OAuth: redirects through `/api/v1/auth/google` → callback sets same tokens. Google login only works if the email already exists in `users` table.

### Env vars
Root `.env.example` is for Docker Compose (`POSTGRES_PASSWORD`, `JWT_SECRET`, `JWT_REFRESH_SECRET`).
Backend reads `backend/.env` directly at runtime (`DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, optional Google vars).
