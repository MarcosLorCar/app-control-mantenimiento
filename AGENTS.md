# AGENTS.md

Guidance for AI coding agents (Antigravity, Claude Code, Cursor, Codex) in this repository.

## Commands

```bash
# Install & Dev
npm install
npm run dev                  # Concurrent backend (:3000) + frontend (:5173)
npm run dev:backend          # Fastify on :3000
npm run dev:frontend         # Vite on :5173

# Tests & Builds
npm run test:backend         # Vitest integration tests (hits DB on :5434)
npm test --workspace=@infragest/frontend # Vitest React tests
npm run build:backend        # tsc → dist/
npm run build --workspace=@infragest/frontend # tsc + vite build → dist/

# Database (PostgreSQL 16 via Docker on port 5434)
docker compose up -d         # Starts infragest-db container (:5434)
cd backend && npx prisma migrate dev  # Apply migrations
cd backend && npx prisma db seed      # Seed roles & dev users
cd backend && npx prisma db push      # Fast schema push
```

## Workspaces & Architecture

Monorepo using `npm workspaces`: `shared`, `backend`, `frontend`.

- **Shared (`shared/src/types.ts`)**: Cross-boundary types (`JwtPayload`, `ApiSuccess<T>`, `ApiError`).
- **Backend (`backend/src/`)**:
  - Fastify 4 + Prisma 5 + PostgreSQL 16.
  - Module pattern in `src/modules/<name>/`: `*.routes.ts`, `*.schema.ts` (Zod), `*.service.ts`.
  - Prefix: `/api/v1/*`.
  - Auth decorators on Fastify: `verifyToken`, `requireWrite`, `requireManage`.
  - JWT: Access token (15m, Bearer header), refresh token (HTTP-only cookie `refreshToken`).
  - Uploads: Stored to `backend/uploads/`, processed with `sharp` to WebP, served at `/uploads/` with 30-day immutable cache.
- **Frontend (`frontend/src/`)**:
  - React 18 + Vite + TypeScript + Tailwind CSS.
  - `src/api/client.ts`: Central `apiFetch` with transparent 401 refresh retry.
  - `src/hooks/use*.ts`: TanStack Query hooks.
  - `src/utils/imageCompression.ts`: Client-side downscaling before upload to avoid payload limits.
  - RBAC: `RoleGuard.tsx` and `ProtectedRoute.tsx`.

## Key Data Model Patterns

- **Location hierarchy**: Uses materialized path (`path` column, e.g. `/rootId/.../selfId/`). Root locations have `parentId === null`.
- **Materials**: Freeform JSON attributes (`attributes` and `customAttributes`). Materials can be installed on both root and sub-locations.
- **Actions**: Maintenance tasks. Materials installed/uninstalled/updated in an action are tracked in `ActionMaterial` with historical `snapshot` JSON.
- **LocationPhoto**: Photos attached to locations or specific actions (`actionId`), converted to WebP.

## Image Subsystem Conventions

- Client-side: Large phone camera files are compressed via `compressImage()` before network upload.
- Server-side: Sharp resizes to max 1600x1600 WebP (quality 85) in `uploads/`.
- Deletion: `deleteLocationPhoto` removes both database record and file from disk.
