# Design Brief — control-actions

**Tipo de app:** SPA de gestión de infraestructuras para equipo de operaciones (herramienta interna)
**Target:** Desktop-first. Usuarios técnicos, no público general.
**Tono:** Profesional, denso en datos, funcional. Sin elementos decorativos.

## Layout

- Sidebar fijo oscuro (gray-900) + área de contenido clara (white/gray-50)
- 2 columnas. Nav vertical con secciones: Infraestructuras, Admin (solo can_manage)

## Color system

- Sidebar bg: gray-900 · texto: gray-100 · hover: gray-700/gray-800
- Content bg: white · bordes: gray-200/gray-300
- Primario (botones, focus): gray-900
- Status badges: green-700 (activo) · yellow-600 (mantenimiento) · gray-500 (inactivo)
- Action type badge: blue-700 sobre blue-50
- Error: red-600 · Loading: gray-500

## Tipografía

- Sistema sans-serif (sin Google Fonts)
- Body: text-sm · Labels: text-sm font-medium · Headings: text-2xl font-bold (h1), text-lg font-semibold (h2)
- Focus ring: ring-2 ring-gray-900

## Componentes base

- **Buttons:** rounded-md, bg-gray-900 text-white (primary), border border-gray-300 (secondary)
- **Inputs/Selects:** border border-gray-300 rounded-md, focus ring gray-900
- **Tables:** thead gris claro, filas con divide-y, hover:bg-gray-50
- **Modals:** overlay negro/50, panel blanco centrado con título y botón X
- **Badges:** pill redondeado, text-xs font-medium, color según estado
