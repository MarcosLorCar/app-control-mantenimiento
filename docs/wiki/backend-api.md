# Backend API

## Entry points

- App factory: `backend/src/app.ts` (`buildApp`) para server y tests.
- Server entry: `backend/src/server.ts`.

## Modules

- `auth`: login, refresh, logout, change password, Google OAuth
- `users`: CRUD (admin/manage)
- `catalog`: roles, infrastructure-types, system-settings
- `locations`: CRUD (unified recursive location tree)
- `actions`: CRUD trabajos
- `materials`: CRUD materiales e inventarios

## Routes (representative)

- `GET  /api/v1/health`
- `GET  /api/v1/auth/providers` — returns which OAuth providers are enabled
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout` (token)
- `POST /api/v1/auth/refresh`
- `PATCH /api/v1/auth/password` (token) — change own password
- `GET  /api/v1/auth/google/callback` — OAuth callback (conditional, only if Google vars set)
- `GET  /api/v1/users` (manage)
- `GET  /api/v1/roles` (manage)
- `GET  /api/v1/infrastructure-types` (token)
- `GET  /api/v1/system-settings` (token)
- `POST /api/v1/system-settings` (manage)
- `GET  /api/v1/locations` (token)
- `POST /api/v1/locations` (write)
- `GET  /api/v1/actions` (token)
- `GET  /api/v1/materials` (token)

## Testing

- Tests backend usan `app.inject()` (no se levanta servidor HTTP).
- Requiere `TEST_DATABASE_URL`.
