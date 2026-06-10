# Frontend SPA

## App

- React Router v6 para routing.
- AuthContext: access token en memoria + refresh automatico ante `401`.
- API client: wrapper `apiFetch` que adjunta `Authorization` y reintenta tras refresh.

## Data fetching

- TanStack Query para queries y mutations.
- Hooks `use*` encapsulan el acceso a API por recurso.

## Pages

- Login
- Dashboard
- Infraestructuras
- Acciones
- Materiales
- Admin (usuarios y catalogos)
