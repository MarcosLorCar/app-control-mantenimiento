# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## MemPalace

Este proyecto tiene un palace inicializado. Al inicio de cada sesión, ejecuta `wake-up` para cargar el contexto previo:

```bash
PYTHONUTF8=1 python -m mempalace wake-up
```

Para buscar en el palace:

```bash
PYTHONUTF8=1 python -m mempalace search "query"
```

Para minar nuevos archivos tras cambios significativos:

```bash
PYTHONUTF8=1 python -m mempalace mine "C:\Users\javie\Proyectos\control-actions"
```

> `mempalace` no está en el PATH — siempre usar `python -m mempalace` con `PYTHONUTF8=1`.

# Instrucciones de orquestación

## Subagentes disponibles via MCP (run_subagent)

Cuando ejecutes tareas del plan, delega usando run_subagent según el tipo:

| Tarea | Agent |
|-------|-------|
| Generar código, componentes, queries SQL/Prisma | `subagent-code` |
| Análisis, revisión de arquitectura, decisiones complejas | `subagent-analysis` |
| Tareas simples, formateo, transformaciones | `subagent-fast` |
| Tareas con imágenes o contexto muy amplio | `subagent-vision` |

## Flujo esperado

1. `/plan` → Opus planifica (tú)
2. Ejecución → delega cada tarea al subagente apropiado via run_subagent
3. Opus revisa el resultado y continúa

## Regla general

Si una tarea no requiere tu contexto completo del proyecto ni decisiones arquitectónicas, 
delégala a un subagente en lugar de resolverla tú directamente.

## Project Overview

**control-actions** is an infrastructure management system for tracking actions (inspections, repairs, installations, etc.) performed on physical infrastructures. It manages materials consumed per action and users/roles.

Stack: React 18 + Vite + TypeScript + Tailwind (frontend) · Fastify + Prisma + PostgreSQL (backend) · npm workspaces monorepo.

## Development Commands

```bash
# Full stack (DB via Docker + backend + frontend)
./dev.sh

# Individual services
npm run dev:backend          # backend on :3000
npm run dev:frontend         # frontend on :5173 (proxies /api → :3000)

# Database
docker compose up -d db      # start PostgreSQL in Docker
npm run db:migrate --workspace=@control-actions/backend    # run migrations
npm run db:seed --workspace=@control-actions/backend       # seed dev users
npm run db:studio --workspace=@control-actions/backend     # Prisma Studio

# Tests (backend only — use real DB via TEST_DATABASE_URL)
npm run test:backend         # run all backend tests
npm run test:watch --workspace=@control-actions/backend    # watch mode

# Build
npm run build:backend
npm run build --workspace=@control-actions/frontend
```

Backend tests require `TEST_DATABASE_URL` env var. Tests run sequentially (`fileParallelism: false`) and use `app.inject()` — no HTTP server needed.

Dev seed users: `admin@example.com / admin1234` (admin) · `editor@example.com / editor1234` (editor).

## Architecture

### Monorepo structure

```
backend/src/
  app.ts              — Fastify app factory (buildApp)
  server.ts           — entrypoint, reads env and calls buildApp
  plugins/
    prisma.plugin.ts  — registers PrismaClient on app instance
    auth.plugin.ts    — decorates app with verifyToken / requireWrite / requireManage
  modules/
    auth/             — login, logout, refresh, change-password
    users/            — CRUD users (requireManage)
    catalog/          — CRUD roles & action_types (requireManage)
    infrastructures/  — CRUD infrastructures (requireWrite)
    actions/          — CRUD actions + action_materials (requireWrite)

shared/src/types.ts   — TypeScript types shared by frontend and backend (JwtPayload, etc.)

frontend/src/
  App.tsx             — routing tree (React Router v6)
  contexts/AuthContext.tsx — auth state, token in memory (refresh via HttpOnly cookie)
  api/client.ts       — apiFetch wrapper: attaches Bearer token, auto-refresh on 401
  api/*.ts            — per-resource API functions
  hooks/use*.ts       — TanStack Query hooks wrapping the API functions
  pages/              — Login, Dashboard, ChangePassword, infrastructures/*, admin/*
  components/         — Layout, ProtectedRoute, shared UI
```

### Auth flow

- Login → backend returns `accessToken` (short-lived JWT) in body + `refreshToken` in HttpOnly cookie.
- `apiFetch` stores `accessToken` in memory (lost on reload). On 401, it auto-calls `/auth/refresh` using the cookie, then retries.
- Route guards: `verifyToken` (any authenticated user) · `requireWrite` (can_write=true) · `requireManage` (can_manage=true).
- First-login flag on user forces redirect to `/change-password` before accessing the app.

### API conventions

- Base URL: `/api/v1/`
- Error shape: `{ error: { code: string, message: string } }`
- Success shape: `{ data: ... }` (list endpoints include pagination/meta where relevant)
- Health check: `GET /api/v1/health`

## Database Schema (DBML)

Source of truth: `schemabbdd.txt`. ER diagram: `esquema_infraestructuras.png`.

Core relationships:
```
roles → users → actions → action_materials
infrastructures → actions
action_types → actions
```

**Key design decisions:**
- `action_types.consumes_materials` flag controls whether an action type tracks material consumption
- `action_materials` has no pre-existing catalog — materials are registered at the moment of consumption (freeform `name`, `unit`, `quantity`, `unit_cost`, `total_cost`, `supplier`)
- Reference tables (`roles`, `action_types`) are extensible without migrations
- `users` and `infrastructures` use soft delete (`deleted_at`) — never hard-deleted
- All FK columns have DB indexes for query performance

**Tables:**
| Table | Purpose |
|-------|---------|
| `roles` | User roles with `can_write` and `can_manage` permission flags |
| `users` | Authenticated users, linked to a role; soft delete via `deleted_at` |
| `infrastructures` | Physical assets with a location; soft delete via `deleted_at` |
| `actions` | Events on an infrastructure: who did what, when, and what type |
| `action_types` | Catalog of action types (inspection, repair, installation…) |
| `action_materials` | Materials consumed during an action (cost tracking included) |

## Working with Design Files

The `.pen` file requires the Pencil desktop app to be running. Use the `pencil` MCP tools (`get_editor_state`, `batch_get`, `batch_design`) — never `Read` or `Grep` on `.pen` files.

## Plan 2 — Frontend SPA

Before implementing any Plan 2 task, read [`docs/plan2-aidesigner-guide.md`](docs/plan2-aidesigner-guide.md).

For UI tasks (Tasks 3, 5, 6, 7):
1. Inspect `frontwabb.pen` with `pencil` MCP tools first (`batch_get`)
2. Follow the AIDesigner workflow in the guide (generate → capture → adopt → implement)
3. Read `.aidesigner/DESIGN.md` to brief AIDesigner consistently

Tasks 1, 2, 4, 8 are pure code — skip AIDesigner for those.
