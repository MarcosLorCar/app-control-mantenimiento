# Database Schema

## Source of truth

- Prisma schema: `backend/prisma/schema.prisma`
- DBML mirror: `docs/schemabbdd.txt`

## Core entities

- `roles` → `users`
- `infrastructure_types` → `locations` (recursive tree using `parentId` and `path`)
- `infrastructure_types` ↔ `material_types` (many-to-many: an infrastructure type can have compatible material types and vice versa)
- `material_types` (includes custom attributes spec in JSON)
- `materials` located at a specific `location_id`
- `actions` (performed at a `location_id`, linked to a `user`)
- `action_materials` (link between actions and materials with operation type and snapshot)
- `location_photos` (photos linked to a location and optionally to an action)
- `system_settings` (key/value runtime config)
- `fixed_properties` (planned — no routes yet)

## Notes

- `users`, `locations`, `infrastructure_types`, `material_types`, and `materials` have a `deleted_at` field for soft delete support.
- `actions` support updates (`PATCH`) and hard deletes (`DELETE`). They do not have soft delete.
- `Location.path` uses a materialized path format (`/rootId/.../selfId/`) for fast subtree queries.
- `Location.placeId` and `Location.formattedAddress` store the result of reverse geocoding via Nominatim (OpenStreetMap).
- `MaterialType.customAttributes` and `Material.attributes` are freeform JSON columns.
- `ActionMaterial.snapshot` captures the material state at the time of the action (denormalized audit trail).
