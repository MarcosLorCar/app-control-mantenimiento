# Architecture

## Approach

Arquitectura elegida: API REST + SPA, en un monorepo.

- Backend independiente (Fastify) y frontend SPA (React/Vite).
- En produccion el SPA se compila a estaticos y se sirve por Nginx.

## Authentication & authorization

- Login entrega access token JWT (corto) y refresh token (cookie HttpOnly).
- Guards reutilizables:
  - `verifyToken`: autenticado
  - `requireWrite`: permisos de escritura
  - `requireManage`: permisos de administracion

## API conventions

- Base URL: `/api/v1/`
- Exito: `{ data: T }`
- Error: `{ error: { code: string, message: string } }`
