# Backend API

## Entry points

- App factory: `backend/src/app.ts` (`buildApp`) para server y tests.
- Server entry: `backend/src/server.ts`.

## Modules

- `auth`: login/refresh/logout
- `users`: CRUD (admin/manage)
- `catalog`: roles, infrastructure-types
- `locations`: CRUD (unified recursive location tree)
- `actions`: CRUD trabajos
- `materials`: CRUD materiales e inventarios

## Routes (representative)

- `GET /api/v1/health`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/users` (manage)
- `GET /api/v1/locations` (token)
- `POST /api/v1/locations` (write)
- `GET /api/v1/actions` (token)
- `GET /api/v1/materials` (token)

## Testing

- Tests backend usan `app.inject()` (no se levanta servidor HTTP).
- Requiere `TEST_DATABASE_URL`.
