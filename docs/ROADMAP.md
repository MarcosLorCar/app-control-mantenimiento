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

## Plan 4 — Deploy (Docker + CI/CD)

| # | Task | Estado |
|---|------|--------|
| 1 | Dockerfile multi-stage del backend | ✅ completado |
| 2 | Backend Fastify sirve la SPA estática + API en un único contenedor (nginx eliminado) | ✅ completado |
| 3 | docker-compose.ghcr.yml + .env.example (producción) | ✅ completado |
| 4 | Configuración inicial del VPS (Docker, SSH, Certbot) | ⬜ pendiente |
| 5 | Pipeline CI/CD con GitHub Actions | ✅ completado |
| 5b | Auto-deploy vía self-hosted runner en Proxmox | ⬜ pendiente |
| 6 | Backup automático de BD + verificación final | ⬜ pendiente |

### Notas — Task 5b (self-hosted runner)

**Objetivo:** que el contenedor Proxmox se actualice solo tras cada push a `main`, sin exponer puertos.

**Approach:** instalar un GitHub Actions self-hosted runner en el contenedor Proxmox. El runner abre conexión saliente a GitHub (no requiere abrir puertos). El workflow añade un job `deploy` que corre en ese runner y ejecuta:

```bash
docker compose -f docker-compose.ghcr.yml pull
docker compose -f docker-compose.ghcr.yml up -d
```

**Pasos para activarlo:**

1. Ir a GitHub repo → Settings → Actions → Runners → **New self-hosted runner**
2. Seguir las instrucciones de Linux que da GitHub en el contenedor Proxmox
3. Registrar como servicio systemd:
   ```bash
   sudo ./svc.sh install && sudo ./svc.sh start
   ```
4. Añadir el job `deploy` a `.github/workflows/docker-build-push.yml`:
   ```yaml
   deploy:
     needs: build-and-push
     runs-on: self-hosted
     if: github.ref == 'refs/heads/main'
     steps:
       - uses: actions/checkout@v4
       - name: Pull and restart containers
         run: |
           docker compose -f docker-compose.ghcr.yml pull
           docker compose -f docker-compose.ghcr.yml up -d
   ```

**Bloqueado en:** acceso a Settings del repo de GitHub para obtener el token de registro del runner.
