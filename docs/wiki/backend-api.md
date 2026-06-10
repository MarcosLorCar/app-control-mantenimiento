# Backend API

## Entry points

- App factory: `backend/src/app.ts` (`buildApp`) para server y tests.
- Server entry: `backend/src/server.ts`.

## Modules

- `auth`: login/refresh/logout
- `users`: CRUD (admin/manage)
- `catalog`: roles, action-types, infrastructure-types, material-types, material-categories
- `infrastructures`: CRUD
- `actions`: CRUD acciones
- `materials`: CRUD materiales

## Routes (representative)

> Nota: el listado exacto vive en `docs/plan1-backend-resumen.md`.

- `GET /api/v1/health`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/users` (manage)
- `GET /api/v1/infrastructures` (token)
- `POST /api/v1/infrastructures` (write)

## Testing

- Tests backend usan `app.inject()` (no se levanta servidor HTTP).
- Requiere `TEST_DATABASE_URL`.
