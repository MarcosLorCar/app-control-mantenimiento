# CSV Export de Acciones Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir `GET /api/v1/infrastructures/:infraId/actions/export` que devuelve las acciones de una infraestructura en CSV, con una fila por material y filtro opcional por fechas.

**Architecture:** Tres cambios coordinados en el módulo `actions`: schema Zod para los query params, función de servicio que consulta Prisma y serializa CSV, y una nueva ruta que setea los headers de descarga. La validación de query params se hace con `safeParse` manual (patrón del proyecto).

**Tech Stack:** Fastify · Prisma · Zod · Vitest · TypeScript

---

## Mapa de archivos

| Archivo | Cambio |
|---------|--------|
| `backend/src/modules/actions/actions.schema.ts` | Añadir `ExportQuerySchema` y `ExportQuery` |
| `backend/src/modules/actions/actions.service.ts` | Añadir `exportActionsAsCsv()` |
| `backend/src/modules/actions/actions.routes.ts` | Añadir ruta `GET /infrastructures/:infraId/actions/export` |
| `backend/tests/actions.test.ts` | Añadir bloque `describe` con 5 casos de prueba |

---

## Task 1: Añadir ExportQuerySchema al schema

**Files:**
- Modify: `backend/src/modules/actions/actions.schema.ts`

- [ ] **Step 1: Añadir el schema al final del archivo**

El archivo actual (`actions.schema.ts`) termina en la línea 26. Añadir al final:

```ts
export const ExportQuerySchema = z.object({
  desde: z.coerce.date().optional(),
  hasta: z.coerce.date().optional(),
})

export type ExportQuery = z.infer<typeof ExportQuerySchema>
```

El archivo completo queda así:

```ts
import { z } from 'zod'

export const CreateActionSchema = z.object({
  actionTypeId: z.number().int().positive(),
  description: z.string().optional(),
  performedAt: z.coerce.date().optional(),
})

export const UpdateActionSchema = CreateActionSchema.partial()

export const CreateMaterialSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  unit: z.string().min(1),
  quantity: z.number().positive(),
  unitCost: z.number().nonnegative().optional(),
  supplier: z.string().optional(),
  notes: z.string().optional(),
})

export const UpdateMaterialSchema = CreateMaterialSchema.partial()

export type CreateActionBody = z.infer<typeof CreateActionSchema>
export type UpdateActionBody = z.infer<typeof UpdateActionSchema>
export type CreateMaterialBody = z.infer<typeof CreateMaterialSchema>
export type UpdateMaterialBody = z.infer<typeof UpdateMaterialSchema>

export const ExportQuerySchema = z.object({
  desde: z.coerce.date().optional(),
  hasta: z.coerce.date().optional(),
})

export type ExportQuery = z.infer<typeof ExportQuerySchema>
```

- [ ] **Step 2: Verificar que compila sin errores**

```bash
cd backend && npx tsc --noEmit
```

Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add backend/src/modules/actions/actions.schema.ts
git commit -m "feat(actions): add ExportQuerySchema for CSV export query params"
```

---

## Task 2: Escribir tests que fallan para el endpoint de exportación

**Files:**
- Modify: `backend/tests/actions.test.ts`

- [ ] **Step 1: Añadir el bloque describe al final del archivo**

Añadir después del último `describe` existente (línea 117, cierre del describe de `GET /api/v1/actions/:id/materials`):

```ts
describe('GET /api/v1/infrastructures/:infraId/actions/export', () => {
  it('devuelve CSV con headers correctos cuando hay acciones sin materiales', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/infrastructures/${infraId}/actions/export`,
      headers: { authorization: `Bearer ${readerToken}` },
    })
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toContain('text/csv')
    expect(res.headers['content-disposition']).toContain('attachment')
    const lines = res.body.trim().split('\n')
    expect(lines[0]).toBe('accion_id,fecha,tipo_accion,responsable,descripcion,material,unidad,cantidad,coste_unitario,coste_total,proveedor')
    expect(lines.length).toBe(2) // header + 1 acción sin materiales
    expect(lines[1]).toMatch(new RegExp(`^${actionId},`))
    // columnas de material vacías al final
    expect(lines[1].endsWith(',,,,,,')).toBe(true)
  })

  it('devuelve CSV con una fila por material cuando la acción tiene materiales', async () => {
    await testDb.actionMaterial.create({
      data: { actionId, name: 'Cable UTP', unit: 'm', quantity: 10, unitCost: 1.5, totalCost: 15 },
    })
    await testDb.actionMaterial.create({
      data: { actionId, name: 'Tornillo M8', unit: 'ud', quantity: 4, unitCost: 0.2, totalCost: 0.8 },
    })
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/infrastructures/${infraId}/actions/export`,
      headers: { authorization: `Bearer ${readerToken}` },
    })
    expect(res.statusCode).toBe(200)
    const lines = res.body.trim().split('\n')
    expect(lines.length).toBe(3) // header + 2 materiales
    expect(lines[1]).toContain('Cable UTP')
    expect(lines[2]).toContain('Tornillo M8')
  })

  it('filtra por rango de fechas con query params desde/hasta', async () => {
    // Acción fuera del rango
    await testDb.action.create({
      data: {
        infrastructureId: infraId,
        performedBy: adminUserId,
        actionTypeId: inspectionTypeId,
        description: 'Acción antigua',
        performedAt: new Date('2020-01-01'),
      },
    })
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/infrastructures/${infraId}/actions/export?desde=2024-01-01&hasta=2099-12-31`,
      headers: { authorization: `Bearer ${readerToken}` },
    })
    expect(res.statusCode).toBe(200)
    const lines = res.body.trim().split('\n')
    // Solo la acción del beforeEach (no la antigua de 2020)
    expect(lines.length).toBe(2)
    expect(res.body).not.toContain('Acción antigua')
  })

  it('devuelve CSV con solo headers cuando la infraestructura no tiene acciones', async () => {
    const emptyInfra = await testDb.infrastructure.create({ data: { name: 'Vacía' } })
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/infrastructures/${emptyInfra.id}/actions/export`,
      headers: { authorization: `Bearer ${readerToken}` },
    })
    expect(res.statusCode).toBe(200)
    const lines = res.body.trim().split('\n')
    expect(lines.length).toBe(1)
    expect(lines[0]).toBe('accion_id,fecha,tipo_accion,responsable,descripcion,material,unidad,cantidad,coste_unitario,coste_total,proveedor')
  })

  it('sin token devuelve 401', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/infrastructures/${infraId}/actions/export`,
    })
    expect(res.statusCode).toBe(401)
  })
})
```

- [ ] **Step 2: Ejecutar los tests para confirmar que fallan**

```bash
npm run test:backend
```

Expected: los 5 tests nuevos fallan con `404` o similar (la ruta no existe aún). Los tests existentes deben seguir pasando.

---

## Task 3: Implementar exportActionsAsCsv en el servicio

**Files:**
- Modify: `backend/src/modules/actions/actions.service.ts`

- [ ] **Step 1: Añadir la función al final del archivo**

Añadir después de `listAllMaterials` (después de la línea 101):

```ts
// --- CSV Export ---

function csvField(value: string | number | null | undefined): string {
  if (value == null) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export async function exportActionsAsCsv(
  db: PrismaClient,
  infraId: number,
  desde?: Date,
  hasta?: Date,
): Promise<string> {
  const actions = await db.action.findMany({
    where: {
      infrastructureId: infraId,
      ...(desde || hasta
        ? { performedAt: { gte: desde, lte: hasta } }
        : {}),
    },
    include: {
      actionType: { select: { name: true } },
      performer: { select: { email: true } },
      materials: true,
    },
    orderBy: { performedAt: 'desc' },
  })

  const HEADERS = 'accion_id,fecha,tipo_accion,responsable,descripcion,material,unidad,cantidad,coste_unitario,coste_total,proveedor'

  const rows: string[] = []
  for (const action of actions) {
    const base = [
      csvField(action.id),
      csvField(action.performedAt.toISOString()),
      csvField(action.actionType.name),
      csvField(action.performer.email),
      csvField(action.description),
    ].join(',')

    if (action.materials.length === 0) {
      rows.push(`${base},,,,,,`)
    } else {
      for (const m of action.materials) {
        rows.push([
          base,
          csvField(m.name),
          csvField(m.unit),
          csvField(m.quantity != null ? String(m.quantity) : null),
          csvField(m.unitCost != null ? String(m.unitCost) : null),
          csvField(m.totalCost != null ? String(m.totalCost) : null),
          csvField(m.supplier),
        ].join(','))
      }
    }
  }

  return [HEADERS, ...rows].join('\n')
}
```

- [ ] **Step 2: Verificar que compila**

```bash
cd backend && npx tsc --noEmit
```

Expected: sin errores.

---

## Task 4: Añadir la ruta en actions.routes.ts

**Files:**
- Modify: `backend/src/modules/actions/actions.routes.ts`

- [ ] **Step 1: Actualizar el import del schema**

En la línea 2, añadir `ExportQuerySchema` y `ExportQuery` al import:

```ts
import { CreateActionSchema, UpdateActionSchema, CreateMaterialSchema, UpdateMaterialSchema, ExportQuerySchema, ExportQuery } from './actions.schema'
```

- [ ] **Step 2: Añadir `exportActionsAsCsv` al import del servicio**

En las líneas 3-6, añadir `exportActionsAsCsv`:

```ts
import {
  listActions, listAllActions, getAction, createAction, updateAction, deleteAction,
  listMaterials, listAllMaterials, createMaterial, updateMaterial, deleteMaterial,
  exportActionsAsCsv,
} from './actions.service'
```

- [ ] **Step 3: Añadir la nueva ruta antes de `GET /infrastructures/:infraId/actions`**

Insertar la ruta de exportación **antes** del handler existente de `GET /infrastructures/:infraId/actions` (actualmente línea 23). Fastify resuelve rutas de mayor especificidad primero, pero para evitar cualquier ambigüedad de parsing, la ruta `/export` debe estar registrada antes que la ruta genérica con el mismo prefijo:

```ts
  // --- Exportación CSV ---

  fastify.get('/infrastructures/:infraId/actions/export', { preHandler: fastify.verifyToken }, async (request, reply) => {
    const { infraId } = request.params as { infraId: string }
    const queryResult = ExportQuerySchema.safeParse(request.query)
    if (!queryResult.success) {
      return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: queryResult.error.message } })
    }
    const { desde, hasta } = queryResult.data
    try {
      const csv = await exportActionsAsCsv(fastify.db, Number(infraId), desde, hasta)
      const filename = `acciones-${infraId}-${Date.now()}.csv`
      reply
        .header('Content-Type', 'text/csv; charset=utf-8')
        .header('Content-Disposition', `attachment; filename="${filename}"`)
        .send(csv)
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: { code: err.code, message: err.message } })
    }
  })
```

- [ ] **Step 4: Verificar que compila**

```bash
cd backend && npx tsc --noEmit
```

Expected: sin errores.

- [ ] **Step 5: Ejecutar los tests**

```bash
npm run test:backend
```

Expected: todos los tests pasan, incluidos los 5 nuevos del bloque de exportación.

- [ ] **Step 6: Commit**

```bash
git add backend/src/modules/actions/actions.schema.ts \
        backend/src/modules/actions/actions.service.ts \
        backend/src/modules/actions/actions.routes.ts \
        backend/tests/actions.test.ts
git commit -m "feat(actions): add CSV export endpoint GET /infrastructures/:infraId/actions/export"
```

---

## Verificación end-to-end

Con el stack levantado (`./dev.sh`):

```bash
# 1. Obtener token
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"admin1234"}' | jq -r .data.accessToken)

# 2. Exportar todas las acciones de la infra 1
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/v1/infrastructures/1/actions/export"

# 3. Exportar con filtro de fechas
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/v1/infrastructures/1/actions/export?desde=2024-01-01&hasta=2024-12-31"

# 4. Infra inexistente → 200 con solo headers (consistente con el listado JSON que tampoco lanza 404)
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/v1/infrastructures/99999/actions/export"

# 5. Sin token → 401
curl "http://localhost:3000/api/v1/infrastructures/1/actions/export"
```
