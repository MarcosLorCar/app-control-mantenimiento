# control-actions

Sistema de gestión de infraestructuras y acciones operativas.

Stack: React 18 + Vite + TypeScript + Tailwind (frontend) · Fastify + Prisma + PostgreSQL (backend)

---

## Requisitos previos

- Node.js 20+
- PostgreSQL corriendo en `localhost:5432`
- Base de datos y variables de entorno configuradas (ver `backend/.env`)

---

## Instalación

Desde la raíz del monorepo:

```bash
npm install
```

---

## Levantar el frontend (dev)

```bash
npm run dev --workspace=@control-actions/frontend
```

Abre: [http://localhost:5173](http://localhost:5173)

El frontend hace proxy de `/api` hacia `localhost:3000` (backend). Necesita el backend corriendo para funcionar.

---

## Levantar el backend (dev)

```bash
npm run dev --workspace=backend
```

API disponible en: [http://localhost:3000/api/v1](http://localhost:3000/api/v1)

Health check: `GET /api/v1/health`

---

## Stack completo (frontend + backend en paralelo)

Desde dos terminales:

```bash
# Terminal 1
npm run dev --workspace=backend

# Terminal 2
npm run dev --workspace=@control-actions/frontend
```

---

## Usuarios de desarrollo (seed)

Ejecutar el seed para crear los usuarios iniciales:

```bash
cd backend && npx prisma db seed
```

| Email | Password | Rol |
|-------|----------|-----|
| `admin@example.com` | `admin1234` | admin (todos los permisos) |
| `editor@example.com` | `editor1234` | editor (solo escritura) |

---

## Tests

```bash
# Backend
npm test --workspace=backend

# Frontend
npm test --workspace=@control-actions/frontend
```

---

## Build de producción

```bash
# Frontend
npm run build --workspace=@control-actions/frontend

# Backend
npm run build:backend
```
