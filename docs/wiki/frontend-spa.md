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
- Departamentos (Navegador de Ubicaciones / Ficha de Ubicación)
- Trabajos (Acciones / Mantenimiento)
- Materiales (Inventario)
- Usuarios (Administración)
- Configuración (Catálogos y propiedades)
