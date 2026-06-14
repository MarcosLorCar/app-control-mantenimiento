# Database Schema (DBML)

## Source of truth

- Prisma schema: `backend/prisma/schema.prisma`
- DBML mirror: `docs/schemabbdd.txt`

## Core entities

- `roles` → `users`
- `infrastructure_types` → `locations` (recursive tree using `parentId` and `path`)
- `material_types` (includes custom attributes spec in JSON)
- `materials` located at a specific `location_id`
- `actions` (performed at a `location_id`)
- `action_materials` (link between actions and materials with snapshot auditing)
- `location_photos` (photos of locations linked optionally to actions)

## Notes

- `users`, `locations`, `infrastructure_types`, and `material_types` have a `deleted_at` field for soft delete support.
- `actions` is an immutable audit log; it does not have soft delete.
