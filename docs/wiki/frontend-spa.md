# Frontend SPA

## App

- React 18 + Vite + TypeScript + Tailwind.
- React Router v6 para routing.
- AuthContext: access token en memoria + refresh automatico ante `401`.
- API client: wrapper `apiFetch` que adjunta `Authorization` y reintenta tras refresh.
- PWA habilitado via `vite-plugin-pwa` (manifest name: "INFRAGEST — Control de Mantenimiento").

## Data fetching

- TanStack Query para queries y mutations.
- Hooks `use*` encapsulan el acceso a API por recurso.

## Pages

- **Login** — credenciales o Google OAuth (si está configurado)
- **ChangePassword** — cambio de contraseña obligatorio en primer login; también accesible desde perfil
- **Locations** — navegador de ubicaciones (árbol), ficha de ubicación, mapa (Leaflet)
- **Actions** — listado de trabajos, detalle de acción, formulario de acción
- **Materials** — inventario global de materiales
- **Admin / Users** — gestión de usuarios (manage)
- **Admin / Catalog** — tipos de infraestructura, roles, configuración del sistema (manage)
- **Dashboard** — página de inicio

## Map

Leaflet + react-leaflet se usa en `LocationsMapPage` para visualizar ubicaciones geolocalizadas. Las coordenadas (`latitude`, `longitude`) se almacenan en el modelo `Location`. El geocodificado inverso usa la API de Nominatim (OpenStreetMap) para obtener `placeId` y `formattedAddress`.
