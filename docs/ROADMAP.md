# Roadmap — InfraGest

Arquitectura: monorepo · API REST (Fastify) + SPA (React/Vite) · PostgreSQL · Docker (contenedor único; el backend sirve la SPA)

---

## Plan 1 — Backend API

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

| # | Task | Estado |
|---|------|--------|
| 1 | Scaffold React + Vite + TypeScript + Tailwind | ✅ completado |
| 2 | API client + AuthContext (JWT en memoria, refresh automático) | ✅ completado |
| 3 | Routing, Layout (sidebar) y página Login | ✅ completado |
| 4 | API hooks con TanStack Query | ✅ completado |
| 5 | Página Infraestructuras (listado + detalle + formulario) | ✅ completado |
| 6 | Formularios de Acciones y Materiales | ✅ completado |
| 7 | Páginas de administración (usuarios y catálogos) | ✅ completado |
| — | *Flujo primer login: página cambiar contraseña + guard en ProtectedRoute* | ✅ completado |
| 8 | Build y verificación final | ✅ completado |
| — | *Bug: rol de usuario no se muestra en página admin (fix: apiFetch no envía Content-Type en GETs)* | ✅ completado |
| — | *Separador visual en sidebar entre links generales y sección solo-admin* | ✅ completado |

---

## Plan 3 — Alineación Frontend con Diseño

| # | Task | Estado |
|---|------|--------|
| 1 | Design tokens CSS + instalar lucide-react | ✅ completado |
| 2 | Rediseño Sidebar + Topbar (Layout.tsx) | ✅ completado |
| 3 | Rediseño lista de Infraestructuras (cards ricas) | ✅ completado |
| 4 | Backend: endpoints globales GET /actions y GET /materials | ✅ completado |
| 5 | Tipos y hooks frontend para queries globales | ✅ completado |
| 6 | ActionForm con selector de infraestructura opcional | ✅ completado |
| 7 | Página Acciones (/actions) — tabla + panel lateral | ✅ completado |
| 8 | Página Materiales (/materials) — tabla global | ✅ completado |
| 9 | Rutas en App.tsx + verificación end-to-end | ✅ completado |

---

## Plan 4 — Deploy (Azure App Service + CI/CD)

Producción: **Azure App Service for Containers** en `https://infragest.azurewebsites.net`, sirviendo una imagen única co-hospedada (backend + SPA) desde GHCR. Migrado desde el autoalojamiento en Proxmox (ya retirado).

| # | Task | Estado |
|---|------|--------|
| 1 | Dockerfile multi-stage (backend + SPA en un solo contenedor) | ✅ completado |
| 2 | Backend Fastify sirve la SPA estática + API en un único contenedor (nginx eliminado) | ✅ completado |
| 3 | Pipeline CI/CD (GitHub Actions → GHCR `infragest-app:latest`) | ✅ completado |
| 4 | Azure App Service for Containers (pull de GHCR, puerto 3000, TLS gestionado) | ✅ completado |
| 5 | Azure Database for PostgreSQL (Flexible Server) + migración de datos | ✅ completado |
| 6 | Persistencia de uploads (Azure Files montado en `/app/backend/uploads`) | ✅ completado |
| 7 | Google OAuth (env vars + callback) | ✅ completado |
| 8 | Continuous Deployment (webhook GHCR → App Service re-pull en cada push a `main`) | ✅ completado |
| 9 | Probar una restauración de backup | ⬜ pendiente |

### Notas

- **TLS:** Azure termina HTTPS automáticamente en `*.azurewebsites.net`; no hace falta Certbot. Sin dominio personalizado (el host de Azure es suficiente).
- **Backups:** Azure Postgres Flexible Server hace backups automáticos point-in-time (retención 7 días por defecto). Lo único pendiente es **probar una restauración** alguna vez para verificar el procedimiento.
- **Autoalojamiento (Proxmox/VPS):** descartado. El path de `docker-compose.ghcr.yml` + Caddy/Certbot (ver `docs/DEPLOY-TLS.md`) sigue siendo válido si alguien quiere autoalojar, pero ya no es la producción.
