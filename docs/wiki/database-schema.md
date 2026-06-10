# Database Schema (DBML)

## Source of truth

- Prisma schema: `backend/prisma/schema.prisma`
- DBML mirror: `docs/schemabbdd.txt`

## Core entities

- `roles` → `users`
- `infrastructures` → `dependencies` (arbol) → `structures`
- `material_types` → `material_categories`
- `materials` ubicados en infrastructure/dependency/structure
- `action_types` → `actions` (sobre un `material_id`)

## Notes

- `users` e `infrastructures` tienen `deleted_at` para soft delete (aunque el API puede usar hard delete en `DELETE`).
- `actions` es registro de auditoria; no tiene soft delete.
