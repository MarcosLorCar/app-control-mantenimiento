# Arquitectura control-actions

**Fecha:** 2026-04-07  
**Estado:** aprobado

## Contexto

control-actions es una aplicación de gestión de infraestructuras que registra acciones (inspecciones, reparaciones, instalaciones) realizadas sobre activos físicos, incluyendo los materiales consumidos. El equipo es de 1-2 personas, el despliegue inicial es en VPS propio, y el objetivo a medio plazo es evolucionar hacia un modelo SaaS multi-tenant.

---

## Arquitectura elegida: API REST + SPA (monorepo)

Backend independiente (Node.js + Fastify) y frontend React/Vite como SPA, organizados en un único repositorio git con carpetas separadas. El SPA se compila a archivos estáticos y Nginx los sirve directamente — no requiere proceso de servidor para el frontend.

---

## Stack tecnológico

### Backend
| Tecnología | Motivo |
|-----------|--------|
| Node.js 20 LTS | Runtime estable con soporte largo |
| Fastify | API REST rápida, schema-first, tipado nativo |
| TypeScript | Errores en compilación, tipos compartidos con el frontend |
| Prisma ORM | Migraciones + type safety + excelente DX |
| JWT + bcrypt | Auth stateless, sin estado en servidor |
| Zod | Validación de inputs en runtime |

### Frontend
| Tecnología | Motivo |
|-----------|--------|
| React 18 | Ecosistema maduro |
| Vite | Build ultrarrápido, HMR instantáneo |
| TypeScript | Mismo lenguaje en FE y BE, tipos compartidos |
| TanStack Query | Cache y sincronización con la API sin boilerplate |
| React Router v6 | Routing del SPA |
| Tailwind CSS | Estilado rápido y consistente |

### Infraestructura
| Tecnología | Motivo |
|-----------|--------|
| PostgreSQL 16 | Robusto, JSONB, Row Level Security listo para SaaS |
| Docker + Compose | Entorno reproducible, deploy simple |
| Nginx | Sirve el SPA estático y hace proxy a la API |
| GitHub Actions | CI/CD hacia el VPS |

---

## Estructura del monorepo

```
control-actions/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/           # login, JWT, refresh
│   │   │   ├── users/          # CRUD usuarios
│   │   │   ├── infrastructures/
│   │   │   ├── actions/        # acciones + materiales
│   │   │   └── catalog/        # roles, estados, tipos de acción
│   │   ├── app.ts              # setup Fastify + plugins
│   │   └── server.ts           # entry point
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── api/                # funciones fetch hacia el backend
│   │   └── hooks/              # TanStack Query hooks
│   └── package.json
├── shared/                     # tipos TypeScript compartidos FE↔BE
├── docker-compose.yml
├── docker-compose.prod.yml
└── package.json                # scripts raíz (npm workspaces)
```

---

## Autenticación y autorización

### Flujo JWT
1. `POST /api/auth/login` → verifica credenciales con bcrypt
2. Devuelve **access token** (15 min, en body) + **refresh token** (7 días, cookie `httpOnly`)
3. El SPA guarda el access token **en memoria** (nunca en localStorage)
4. Cada petición lleva `Authorization: Bearer <accessToken>`
5. Al expirar, `POST /api/auth/refresh` renueva con la cookie

### Payload del JWT
```json
{
  "sub": 42,
  "email": "user@acme.com",
  "role": "editor",
  "can_write": true,
  "can_manage": false,
  "iat": 1712345678,
  "exp": 1712346578
}
```

Los permisos viajan dentro del token — el backend no consulta la DB en cada request.

### Guards de Fastify
Dos middleware reutilizables aplicados por ruta:
- `verifyToken` — cualquier usuario autenticado
- `requireWrite` — `can_write === true`
- `requireManage` — `can_manage === true`

Añadir un nuevo rol es insertar una fila en la tabla `roles` — sin cambios en código.

---

## API REST

### Endpoints por módulo

**Auth**
```
POST   /api/auth/login         público
POST   /api/auth/refresh       cookie
POST   /api/auth/logout        token
```

**Usuarios**
```
GET    /api/users              manage
POST   /api/users              manage
PATCH  /api/users/:id          manage
DELETE /api/users/:id          manage
```

**Infraestructuras**
```
GET    /api/infrastructures          token
GET    /api/infrastructures/:id      token
POST   /api/infrastructures          write
PATCH  /api/infrastructures/:id      write
DELETE /api/infrastructures/:id      manage
```

**Acciones**
```
GET    /api/infrastructures/:id/actions   token
GET    /api/actions/:id                   token
POST   /api/infrastructures/:id/actions   write
PATCH  /api/actions/:id                   write
DELETE /api/actions/:id                   manage
```

**Materiales**
```
GET    /api/actions/:id/materials    token
POST   /api/actions/:id/materials    write
PATCH  /api/materials/:id            write
DELETE /api/materials/:id            manage
```

**Catálogos**
```
GET    /api/catalog/roles              manage
GET    /api/catalog/infra-statuses     token
GET    /api/catalog/action-types       token
POST   /api/catalog/infra-statuses     manage
POST   /api/catalog/action-types       manage
```

### Formato de respuesta
```json
// Éxito
{ "data": { ... } }

// Error
{ "error": { "code": "NOT_FOUND", "message": "..." } }
```

---

## Deploy en VPS

### Servicios Docker Compose

| Servicio | Imagen | Exposición | Propósito |
|----------|--------|-----------|-----------|
| `nginx` | nginx:alpine | :80, :443 (público) | Sirve SPA estático + proxy `/api/*` |
| `api` | build ./backend | :3000 (interno) | Fastify + migraciones Prisma al arrancar |
| `postgres` | postgres:16-alpine | :5432 (interno) | BD con volumen persistente en host |

El frontend compilado (`frontend/dist/`) se sirve como archivos estáticos desde Nginx — no hay proceso Node.js para el frontend en producción.

### Pipeline CI/CD (GitHub Actions)
1. Push a `main`
2. Build + typecheck + tests
3. `vite build` → `dist/`
4. Build imagen Docker del backend → push a `ghcr.io`
5. SSH al VPS → `docker compose pull api && docker compose up -d`
6. Prisma corre migraciones pendientes al arrancar el contenedor

### Variables de entorno
Las secrets (`DATABASE_URL`, `JWT_SECRET`, etc.) viven en `.env` en el VPS. Nunca en el repositorio. Se inyectan como GitHub Secrets solo para el paso de deploy.

---

## Camino a SaaS

La arquitectura está diseñada para que la transición a SaaS multi-tenant sea incremental:

1. **Multi-tenancy** — añadir `tenant_id` a las tablas principales + filtro global en Prisma (`$allModels`) para aislar datos por cliente. Los endpoints no cambian.
2. **Billing** — integrar Stripe como módulo independiente en la API.
3. **Escalar BD** — mover PostgreSQL a un servicio gestionado (Supabase, RDS) sin cambiar la API.
4. **Escalar compute** — mover el contenedor `api` a Railway, Fly.io o ECS sin tocar el frontend.
5. **Observabilidad** — logging estructurado con Pino (ya incluido en Fastify) + Sentry para errores.
6. **Row Level Security** — PostgreSQL 16 tiene RLS nativo; activarlo por tenant añade una capa de seguridad extra a nivel de base de datos.
