# Roadmap — control-actions

Arquitectura: monorepo · API REST (Fastify) + SPA (React/Vite) · PostgreSQL · Docker + Nginx

Spec completo: [`docs/superpowers/specs/2026-04-07-arquitectura-design.md`](superpowers/specs/2026-04-07-arquitectura-design.md)

---

## Plan 1 — Backend API
> Plan detallado: [`docs/superpowers/plans/2026-04-07-backend-api.md`](superpowers/plans/2026-04-07-backend-api.md)

| # | Task | Estado |
|---|------|--------|
| 1 | Monorepo scaffold (package.json, workspaces, shared/, tsconfig) | ✅ completado |
| 2 | Prisma schema + migración inicial | ✅ completado |
| 3 | Seed de datos iniciales (roles, estados, tipos de acción, usuarios) | ✅ completado |
| 4 | App Fastify + plugins base (prisma, auth guards, helpers de test) | ✅ completado |
| — | *Hardening pre-Task 5: indexes, soft delete, API v1, error handler, env validation* | ✅ completado |
| 5 | Módulo Auth (login, refresh, logout) con TDD | ✅ completado |
| 6 | Módulo Usuarios (CRUD) con TDD | ✅ completado |
| 7 | Módulo Catálogos (roles, estados, tipos) con TDD | ✅ completado |
| 8 | Módulo Infraestructuras (CRUD) con TDD | ✅ completado |
| 9 | Módulo Acciones + Materiales (CRUD) con TDD | ✅ completado |
| 10 | Verificación final (suite completa + typecheck + prueba manual) | ✅ completado |

---

## Plan 2 — Frontend SPA
> Plan detallado: [`docs/superpowers/plans/2026-04-07-frontend-spa.md`](superpowers/plans/2026-04-07-frontend-spa.md)

| # | Task | Estado |
|---|------|--------|
| 1 | Scaffold React + Vite + TypeScript + Tailwind | ✅ completado |
| 2 | API client + AuthContext (JWT en memoria, refresh automático) | ✅ completado |
| 3 | Routing, Layout (sidebar) y página Login | ✅ completado |
| 4 | API hooks con TanStack Query | ✅ completado |
| 5 | Página Infraestructuras (listado + detalle + formulario) | ✅ completado |
| 6 | Formularios de Acciones y Materiales | ✅ completado |
| 7 | Páginas de administración (usuarios y catálogos) | ✅ completado |
| 8 | Build y verificación final | ✅ completado |

---

## Plan 3 — Alineación Frontend con Diseño
> Plan detallado: [`docs/superpowers/plans/2026-04-09-frontend-diseño.md`](superpowers/plans/2026-04-09-frontend-diseño.md)

| # | Task | Estado |
|---|------|--------|
| 1 | Design tokens CSS + instalar lucide-react | ⬜ pendiente |
| 2 | Rediseño Sidebar + Topbar (Layout.tsx) | ⬜ pendiente |
| 3 | Rediseño lista de Infraestructuras (cards ricas) | ⬜ pendiente |
| 4 | Backend: endpoints globales GET /actions y GET /materials | ⬜ pendiente |
| 5 | Tipos y hooks frontend para queries globales | ⬜ pendiente |
| 6 | ActionForm con selector de infraestructura opcional | ⬜ pendiente |
| 7 | Página Acciones (/actions) — tabla + panel lateral | ⬜ pendiente |
| 8 | Página Materiales (/materials) — tabla global | ⬜ pendiente |
| 9 | Rutas en App.tsx + verificación end-to-end | ⬜ pendiente |

---

## Plan 4 — Deploy (Docker + Nginx + CI/CD)
> Plan detallado: [`docs/superpowers/plans/2026-04-07-deploy.md`](superpowers/plans/2026-04-07-deploy.md)

| # | Task | Estado |
|---|------|--------|
| 1 | Dockerfile multi-stage del backend | ⬜ pendiente |
| 2 | Configuración Nginx (TLS + proxy /api + SPA estático) | ⬜ pendiente |
| 3 | docker-compose.prod.yml + .env.prod.example | ⬜ pendiente |
| 4 | Configuración inicial del VPS (Docker, SSH, Certbot) | ⬜ pendiente |
| 5 | Pipeline CI/CD con GitHub Actions | ⬜ pendiente |
| 6 | Backup automático de BD + verificación final | ⬜ pendiente |

---

## Cómo usar este roadmap

Di **"implementar Plan 1 Task 3"** (o el número que quieras) y ejecuto ese task exacto siguiendo el plan detallado. Cuando termines un task, actualizo su estado a ✅.

Los planes 2 y 3 se escriben con detalle cuando llegues a ellos — solo pídelos.
