# Icons & Colors for Action Types and Infrastructure Types — Design Spec

**Date:** 2026-04-11  
**Status:** Approved

## Problem

Action types display as plain text badges with no visual differentiation. Infrastructure type icons are hardcoded in the frontend with no way to change them. Admins need a way to assign distinctive icons/colors to action types and upload custom icons for infrastructure types from the admin panel.

## Scope

Two independent but related sub-features delivered together:

1. **Action types** — assign a Lucide icon + hex color from the admin panel. Shown as colored icon badge throughout the app.
2. **Infrastructure types** — upload a custom image (SVG/PNG) from the admin panel. Shown in the infrastructure list card, falling back to the current hardcoded Lucide map if no image is set.

---

## Sub-Feature 1: Action Type Icon + Color

### Data Model

Add to `action_types` table:
- `icon String?` — Lucide icon component name (e.g. `"Wrench"`, `"Eye"`, `"ClipboardCheck"`)
- `color String?` — CSS hex color string (e.g. `"#2563EB"`)

Both nullable. Existing records unaffected.

### Backend

- Prisma migration: add `icon` and `color` nullable String columns
- `CreateActionTypeSchema`: add `icon?: string`, `color?: string`
- New endpoint: `PATCH /catalog/action-types/:id` (requireManage) — updates name, description, consumesMaterials, icon, color
- Service: add `updateActionType(db, id, body)`

### Admin Panel (Catalog.tsx)

- Action type rows show colored icon preview
- "Crear tipo" form includes:
  - Icon picker: grid of 20 relevant Lucide icons (Wrench, Eye, Hammer, Zap, Shield, ClipboardCheck, Paintbrush, Trash2, Settings2, AlertTriangle, Droplets, Leaf, Flame, Gauge, Plug, Cable, HardHat, Shovel, Drill, Lightbulb)
  - Color input: `<input type="color">` defaulting to `#6B7280`
- Each existing row has an "Editar" inline form to update icon/color

### Usage Throughout App

- `Badge` component (or inline badges) updated to accept optional `icon` + `color` and render a small colored Lucide icon next to the type name
- `InfrastructureDetail` action table: colored icon in the side panel header badge
- `ActionsPage` side panel: same badge

### Frontend Types

```ts
export interface ActionType {
  id: number
  name: string
  description: string | null
  consumesMaterials: boolean
  icon: string | null
  color: string | null
}
```

---

## Sub-Feature 2: Infrastructure Type Custom Icon Upload

### Data Model

Add to `infrastructure_types` table:
- `iconUrl String?` — relative URL path (e.g. `/uploads/infra-type-3.png`)

### Backend

- Prisma migration: add `iconUrl` nullable String column
- Install `@fastify/multipart` and `@fastify/static`
- Fastify serves `backend/uploads/` directory at `/uploads/`
- New endpoint: `POST /catalog/infrastructure-types/:id/icon` (requireManage, multipart)
  - Accepts a single file field `file` (PNG/SVG/JPEG, max 500 KB)
  - Saves to `backend/uploads/infra-type-{id}.{ext}` (overwriting previous)
  - Updates `iconUrl` in the DB
  - Returns updated InfrastructureType
- New endpoint: `PATCH /catalog/infrastructure-types/:id` (requireManage) — edits name/description
- Service: add `updateInfrastructureType(db, id, body)` and `setInfrastructureTypeIcon(db, id, iconUrl)`

### Admin Panel (Catalog.tsx)

- Infrastructure type rows show current icon (`<img>` if `iconUrl` set, else small placeholder square)
- Each row has a "Subir icono" button → triggers `<input type="file" accept="image/*">` → uploads via `POST /.../icon` multipart
- Upload feedback: spinner while uploading, icon preview updates on success, error message on failure

### InfrastructureList

- If `infra.infraType.iconUrl` is set: render `<img src={infraType.iconUrl} className="w-5 h-5 object-contain" />`
- Otherwise: fall back to current `TYPE_ICONS` hardcoded Lucide map (Warehouse as ultimate fallback)

### Frontend Types

```ts
export interface InfrastructureType {
  id: number
  name: string
  description: string | null
  iconUrl: string | null
}
```

---

## File Storage

- Upload directory: `backend/uploads/` (created if missing)
- Naming: `infra-type-{id}.{ext}` — deterministic, overwrite on re-upload
- Served by Fastify static at `/uploads/` (proxied via Vite dev server as `/uploads/` → `localhost:3000/uploads/`)
- Max file size: 500 KB
- Accepted types: PNG, SVG, JPEG

---

## Admin Panel Layout (after changes)

### Action Types section
```
[Wrench icon, blue] Inspección          [consumesMaterials: no]  [Editar]
[Hammer icon, red]  Reparación          [consumesMaterials: sí]  [Editar]
[Plug icon, green]  Instalación         [consumesMaterials: sí]  [Editar]
                                                          [+ Nuevo tipo]
```

### Infrastructure Types section
```
[img/icon] Colegios               [Subir icono]
[img/icon] Fuentes                [Subir icono]
[img/icon] Pistas deportivas      [Subir icono]
                                  [+ Nuevo tipo]
```

---

## Not In Scope

- Deleting action types or infrastructure types
- Reordering types
- Per-user icon preferences
- CDN or cloud storage for uploads
