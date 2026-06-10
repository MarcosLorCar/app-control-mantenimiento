# Plan 1 — Backend API: Resumen de implementación

**Estado:** Completado · 28/28 tests · 0 errores TypeScript  
**Commits:** Tasks 5–10 (Tasks 1–4 ya existían al inicio de la sesión de desarrollo)

---

## Arquitectura actual

```
control-actions/                     ← monorepo (npm workspaces)
├── shared/
│   └── src/types.ts                 ← JwtPayload, ApiSuccess<T>, ApiError
│
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma            ← fuente de verdad del modelo de datos
│   │   ├── migrations/              ← 3 migraciones aplicadas
│   │   └── seed.ts                  ← datos iniciales (roles, usuarios, action types)
│   │
│   ├── src/
│   │   ├── server.ts                ← entrada (puerto 3000, valida env vars)
│   │   ├── app.ts                   ← buildApp() — factory usada también en tests
│   │   ├── plugins/
│   │   │   ├── prisma.plugin.ts     ← fastify.db (PrismaClient)
│   │   │   └── auth.plugin.ts       ← guards: verifyToken / requireWrite / requireManage
│   │   └── modules/
│   │       ├── auth/                ← login, logout
│   │       ├── users/               ← CRUD usuarios (solo admin)
│   │       ├── catalog/             ← roles, action-types
│   │       ├── infrastructures/     ← CRUD infraestructuras
│   │       └── actions/             ← CRUD acciones + materiales
│   │
│   └── tests/
│       ├── helpers/
│       │   ├── app.ts               ← buildTestApp(), getXxxToken()
│       │   └── db.ts                ← clearDb(), seedTestData(), testDb
│       ├── auth.test.ts             ← 6 tests
│       ├── users.test.ts            ← 6 tests
│       ├── catalog.test.ts          ← 4 tests
│       ├── infrastructures.test.ts  ← 5 tests
│       └── actions.test.ts          ← 7 tests
│
└── docs/
    ├── schemabbdd.txt               ← DBML fuente (ajustado durante Plan 1)
    └── ROADMAP.md
```

---

## Rutas implementadas

```
GET  /api/v1/health

POST /api/v1/auth/login
POST /api/v1/auth/logout

GET    /api/v1/users              [requireManage]
GET    /api/v1/users/:id          [requireManage]
POST   /api/v1/users              [requireManage]
PATCH  /api/v1/users/:id          [requireManage]
DELETE /api/v1/users/:id          [requireManage]

GET  /api/v1/roles               [requireManage]
GET  /api/v1/action-types        [verifyToken]
POST /api/v1/action-types        [requireManage]

GET    /api/v1/infrastructure-types          [verifyToken]
POST   /api/v1/infrastructure-types          [requireManage]
PATCH  /api/v1/infrastructure-types/:id      [requireManage]
DELETE /api/v1/infrastructure-types/:id      [requireManage]

GET    /api/v1/infrastructures              [verifyToken]
GET    /api/v1/infrastructures/:id          [verifyToken]
POST   /api/v1/infrastructures              [requireWrite]
PATCH  /api/v1/infrastructures/:id          [requireWrite]
DELETE /api/v1/infrastructures/:id          [requireManage]

GET    /api/v1/infrastructures/:infraId/actions  [verifyToken]
POST   /api/v1/infrastructures/:infraId/actions  [requireWrite]
GET    /api/v1/actions/:id                       [verifyToken]
PATCH  /api/v1/actions/:id                       [requireWrite]
DELETE /api/v1/actions/:id                       [requireManage]
GET    /api/v1/actions/:id/materials             [verifyToken]
POST   /api/v1/actions/:id/materials             [requireWrite]
PATCH  /api/v1/materials/:id                     [requireWrite]
DELETE /api/v1/materials/:id                     [requireManage]
```

### Niveles de acceso

| Guard | Condición |
|-------|-----------|
| `verifyToken` | JWT válido (cualquier usuario activo) |
| `requireWrite` | JWT válido + `can_write = true` (editor o admin) |
| `requireManage` | JWT válido + `can_manage = true` (solo admin) |

---

## Modelo de datos (resultado final)

```
roles
  id, name, description, can_write, can_manage

users
  id, email, password_hash, full_name, role_id → roles
  is_active, created_at, updated_at, deleted_at (soft delete disponible)

  infrastructure_types
    id, name, description, icon, color, deleted_at

  infrastructures
    id, code?, infra_type_id?, name, description
    created_at, updated_at, deleted_at (soft delete disponible)

  dependencies
    id, code?, name, infrastructure_id → infrastructures, parent_id? → dependencies
    created_at, updated_at, deleted_at

  structures
    id, code?, name, infrastructure_id? → infrastructures, dependency_id? → dependencies
    created_at, updated_at, deleted_at

  material_types
    id, code, name, description, icon, created_at, updated_at, deleted_at

  material_categories
    id, code, name, data_type, unit?, required, sort_order, enum_values, validation?
    material_type_id → material_types

  materials
    id, code?, name, description?, serial_number?, installed_at, attributes
    type_id → material_types
    infrastructure_id? → infrastructures | dependency_id? → dependencies | structure_id? → structures
    created_at, updated_at, deleted_at

  action_types
    id, code, name, description?, icon?, color?, deleted_at

  actions
    id, title, description?, performed_at, created_at, updated_at
    type_id → action_types
    material_id → materials
    performed_by → users
```

---

## Decisiones tomadas durante la implementación

### 1. `infra_statuses` descartada del proyecto
El spec original incluía una tabla `infra_statuses` y un campo de estado en `infrastructures`. Durante Task 7 el usuario confirmó que este concepto no tiene uso real en la aplicación. Se eliminó:
- De `schema.prisma` (ya eliminado antes en migración `20260407203633`)
- Del DBML fuente `docs/schemabbdd.txt`
- Del módulo Catálogos (no se implementaron endpoints de infra-statuses)
- El schema de `CreateInfrastructureSchema` no incluye el campo de estado

### 2. Prefijo de rutas `/api/v1/` (vs `/api/` del spec)
El spec original usaba `/api/` sin versión. Durante Task 4 (hardening pre-Task 5) se añadió el prefijo `/api/v1/` a todas las rutas. Esta convención se mantuvo consistente en todos los módulos aunque el plan doc original no la reflejaba.

### 3. `actionsRoutes` registrado en `/api/v1` sin sub-prefijo
Las rutas de acciones y materiales mezclan tres familias de URLs:
- `/infrastructures/:infraId/actions` (sub-recursos)
- `/actions/:id` (recurso directo)
- `/materials/:id` (recurso directo)

Registrar el plugin en `/api/v1` (sin prefijo adicional) es la forma más limpia de manejar esto sin fragmentar en tres plugins.

### 4. `performedBy` desde el JWT, no del body
Al crear una acción, el usuario autenticado es el que "realiza" la acción. El campo `performed_by` se toma de `request.user.sub` (ID del usuario en el JWT), nunca del body. Esto evita que un usuario pueda suplantar a otro.

### 5. `totalCost` calculado en el servidor
`total_cost = quantity × unit_cost` se calcula en `createMaterial` y `updateMaterial` del servicio antes de persistir. El cliente nunca lo envía; si lo enviara, se ignoraría. En `updateMaterial`, si solo cambia `quantity` pero no `unit_cost`, se recalcula usando el `unit_cost` existente (y viceversa).

### 6. Hard delete en todos los módulos
El schema tiene `deleted_at` en `users` e `infrastructures` para soft delete, pero todos los endpoints `DELETE` hacen hard delete (`db.model.delete()`). Decisión explícita para mantener la implementación simple en Plan 1; el soft delete puede activarse en Plan 2 si se necesita en la UI.

### 7. `z.coerce.date()` para `performedAt`
El body de una petición HTTP llega como JSON, donde las fechas son strings ISO 8601. Zod's `z.coerce.date()` convierte automáticamente el string a `Date` antes de pasarlo a Prisma, evitando conversiones manuales.

---

## Problemas atajados

### P1: Tests fallando por paralelismo de BD
**Síntoma:** Al correr `npm test` (todas las suites a la vez), aparecían errores `P2002` (unique constraint) en `clearDb`/`seedTestData` porque los archivos de test competían por la misma BD en paralelo.  
**Solución:** `fileParallelism: false` en `vitest.config.ts`. Los test files se ejecutan secuencialmente; los tests dentro de cada archivo siguen en paralelo (no tienen conflictos porque usan `beforeEach` con `clearDb`).

### P2: `roleId` hardcodeado en users.test.ts
**Síntoma:** `POST /api/v1/users` devolvía 500 porque `roleId: 1` no existía tras `clearDb()` (la secuencia autoincrement continúa entre runs).  
**Solución:** Guardar `seed.adminRole.id` en `beforeEach` y usarlo en el payload del test.

### P3: URLs incorrectas en helpers de test (`/api/auth/login` vs `/api/v1/auth/login`)
**Síntoma:** `getAdminToken()`, `getEditorToken()` y `getReaderToken()` devolvían `undefined` porque la URL del login no coincidía con el prefijo real `/api/v1/`.  
**Solución:** Corregidas las tres funciones en `tests/helpers/app.ts` durante Task 6.

### P4: Error TypeScript `TS6059` con `prisma/seed.ts`
**Síntoma:** `tsc --noEmit` fallaba porque `seed.ts` estaba en `prisma/` (fuera de `rootDir: "src"`) pero incluido vía `"prisma/**/*"` en `tsconfig.json`.  
**Solución:** Eliminar `"prisma/**/*"` del `include`. El seed lo ejecuta Prisma directamente con `ts-node`, no necesita formar parte del programa TypeScript del backend.

### P5: `rootDir` incompatible con el paquete `shared`
**Síntoma:** Al corregir P4, TypeScript empezó a quejarse de que `shared/src/types.ts` también estaba fuera de `rootDir: "src"`, aunque se importaba vía path alias.  
**Solución:** Eliminar `rootDir` de `tsconfig.json`. TypeScript calcula la raíz automáticamente como el ancestro común de todos los archivos incluidos. Como solo se usa `--noEmit`, el `outDir` no importa.

### P6: Pino logger con tipo incorrecto en `prisma.plugin.ts`
**Síntoma:** `fastify.log.error('mensaje', err)` fallaba con `TS2769` porque `err` es `unknown` y el primer overload de pino espera un objeto.  
**Solución:** Cambiar a la forma correcta de pino: `fastify.log.error({ err }, 'mensaje')`.

### P7: `server.ts` env vars no narrowed dentro de función async
**Síntoma:** TypeScript no infería que `JWT_SECRET` era `string` dentro de `async function start()` aunque había una guardia `if (!JWT_SECRET) throw` antes de la función.  
**Solución:** Usar non-null assertions: `JWT_SECRET!` y `JWT_REFRESH_SECRET!` en el punto de uso. La validación en tiempo de ejecución ya garantiza que no son `undefined` antes de llegar ahí.

---

## Convenciones establecidas (para Plan 2)

- **Respuesta de éxito:** `{ data: T }`
- **Respuesta de error:** `{ error: { code: string, message: string } }`
- **Validación:** Zod con `safeParse()` en el route handler; el servicio no valida
- **Errores de servicio:** objetos `{ statusCode, code, message }` lanzados con `throw`
- **Auth:** JWT access token en header `Authorization: Bearer <token>` + refresh token en cookie HttpOnly `refreshToken`
- **Estructura de módulo:** `schema.ts` → `service.ts` → `routes.ts`
