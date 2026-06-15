# INFRAGEST (control-actions)

Sistema de gestión de infraestructuras y acciones operativas (Departamentos, Trabajos, Materiales).

Stack: React 18 + Vite + TypeScript + Tailwind (frontend) · Fastify + Prisma + PostgreSQL (backend)

---

## Requisitos previos

- Node.js 20+
- PostgreSQL corriendo (puedes usar el docker-compose de la raíz)
- Base de datos y variables de entorno configuradas (ver `backend/.env`)

---

## Instalación

Desde la raíz del monorepo:

```bash
npm install
```

---

## Levantar el stack de desarrollo

### Opción A: Script automático (Levanta DB + Backend + Frontend)
Si utilizas un entorno Unix o Git Bash, puedes ejecutar el script preparado para arrancar la base de datos de Docker, correr migraciones e iniciar los servidores:

```bash
./dev.sh
```

### Opción B: Ejecutar la aplicación concurrentemente (DB externa o ya levantada)
Si ya tienes la base de datos corriendo, arranca todo el stack en paralelo desde la raíz:

```bash
npm run dev
```

Abre: [http://localhost:5173](http://localhost:5173)

---

## Levantar por separado (Opcional)

Si necesitas ejecutar los servicios en terminales independientes:

### Backend (dev)
```bash
npm run dev:backend
```
API disponible en: [http://localhost:3000/api/v1](http://localhost:3000/api/v1)
Health check: `GET /api/v1/health`

### Frontend (dev)
```bash
npm run dev:frontend
```
Abre: [http://localhost:5173](http://localhost:5173) (El frontend hace proxy de `/api` hacia `localhost:3000`).

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

## Google OAuth (opcional)

El botón de Google solo aparece en el login si el servidor tiene las credenciales configuradas.

### 1. Crear credenciales en Google Cloud Console

1. [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials → **Create OAuth 2.0 Client ID** (tipo: Web application)
2. Añadir URI de redirección autorizado:
   - Dev: `http://localhost:3000/api/v1/auth/google/callback`
   - Prod: `https://tudominio.com/api/v1/auth/google/callback`

### 2. Variables de entorno (`backend/.env`)

Dev (`backend/.env`):
```env
GOOGLE_CLIENT_ID=<client id>
GOOGLE_CLIENT_SECRET=<client secret>
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/google/callback
FRONTEND_URL=https://localhost:5173
```

Prod:
```env
GOOGLE_CLIENT_ID=<client id>
GOOGLE_CLIENT_SECRET=<client secret>
GOOGLE_CALLBACK_URL=https://tudominio.com/api/v1/auth/google/callback
FRONTEND_URL=https://tudominio.com
```

### Notas

- Google OAuth **no crea usuarios** — el email debe existir previamente en el sistema.
- Si el email no está registrado o el usuario está inactivo, redirige a `/login?error=not_registered`.
- En dev local, Google permite redirect URIs con `http://localhost` sin necesidad de HTTPS.

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
