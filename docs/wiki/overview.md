# InfraGest

Sistema de gestion de infraestructuras y acciones operativas.

## Stack

- Frontend: React 18 + Vite + TypeScript + Tailwind
- Backend: Fastify + TypeScript + Prisma
- Database: PostgreSQL 16

## High-level flow

- Auth: access token JWT (corto) en `Authorization: Bearer ...` + refresh token en cookie HttpOnly.
- Frontend: guarda access token en memoria; ante `401` intenta refresh y reintenta.
- Backend: API REST versionada bajo `/api/v1`.

## Local development

- Frontend dev: http://localhost:5173
- Backend API: http://localhost:3000/api/v1
- Health: `GET /api/v1/health`

## Repo structure (monorepo)

```
backend/   Fastify API + Prisma
frontend/  React SPA
shared/    tipos TypeScript compartidos
docs/      documentación
```

## Docs source of truth

- DBML: `docs/schemabbdd.txt` (debe reflejar `backend/prisma/schema.prisma`).
- Roadmap: `docs/ROADMAP.md`.
