# CSV Export de Acciones por Infraestructura

**Fecha:** 2026-04-19  
**Estado:** Aprobado

## Contexto

El sistema necesita permitir exportar las acciones de una infraestructura a CSV para análisis externo, auditoría o reportes. Actualmente el listado de acciones solo está disponible vía JSON. Se añade un endpoint dedicado de exportación que incluye los materiales consumidos por cada acción.

## Endpoint

```
GET /api/v1/infrastructures/:infraId/actions/export
Authorization: Bearer <token>   (verifyToken — solo lectura)

Query params (opcionales):
  desde  ISO 8601 date  e.g. 2024-01-01
  hasta  ISO 8601 date  e.g. 2024-12-31

Response 200:
  Content-Type: text/csv; charset=utf-8
  Content-Disposition: attachment; filename="acciones-{infraId}-{timestamp}.csv"
```

## Estructura del CSV

Una fila por material. Si una acción no tiene materiales, aparece igualmente con las columnas de material vacías.

```
accion_id,fecha,tipo_accion,responsable,descripcion,material,unidad,cantidad,coste_unitario,coste_total,proveedor
1,2024-01-15T10:00:00.000Z,Inspección,admin@example.com,Revisión anual,Cable 6mm2,m,10.0000,1.50,15.00,ProveedorX
1,2024-01-15T10:00:00.000Z,Inspección,admin@example.com,Revisión anual,Tornillos M8,unidad,20.0000,0.10,2.00,
2,2024-01-20T09:00:00.000Z,Reparación,editor@example.com,Cambio fusible,,,,,,
```

## Cambios en el código

### `backend/src/modules/actions/actions.service.ts`

Nueva función `exportActionsAsCsv(db, infraId, desde?, hasta?)`:

1. Verifica que la infraestructura exista — lanza `{ statusCode: 404, code: 'INFRA_NOT_FOUND', message: '...' }` si no.
2. Query Prisma:
   ```ts
   db.action.findMany({
     where: {
       infrastructureId: infraId,
       ...(desde || hasta ? { performedAt: { gte: desde, lte: hasta } } : {}),
     },
     include: {
       actionType: { select: { name: true } },
       performer: { select: { email: true } },
       materials: true,
     },
     orderBy: { performedAt: 'desc' },
   })
   ```
3. Serializa a CSV: headers fijos + una fila por material (o fila con materiales vacíos si `materials.length === 0`).
4. Los campos con comas, comillas o saltos de línea se envuelven en `"..."` con comillas internas escapadas como `""`.
5. Retorna el string CSV completo.

### `backend/src/modules/actions/actions.routes.ts`

Nueva ruta añadida junto a las rutas existentes de acciones:

```ts
fastify.get('/infrastructures/:infraId/actions/export', {
  preHandler: [fastify.verifyToken],
  schema: { querystring: ExportQuerySchema },
}, async (request, reply) => {
  const { infraId } = request.params as { infraId: string }
  const { desde, hasta } = request.query as ExportQuery
  const csv = await exportActionsAsCsv(
    fastify.prisma,
    parseInt(infraId),
    desde ? new Date(desde) : undefined,
    hasta ? new Date(hasta) : undefined,
  )
  const filename = `acciones-${infraId}-${Date.now()}.csv`
  reply
    .header('Content-Type', 'text/csv; charset=utf-8')
    .header('Content-Disposition', `attachment; filename="${filename}"`)
    .send(csv)
})
```

### `backend/src/modules/actions/actions.schema.ts`

Añadir schema Zod para query params. Se usa `z.coerce.date()` para aceptar tanto fechas completas (`2024-01-01T00:00:00Z`) como fechas simples (`2024-01-01`):

```ts
export const ExportQuerySchema = z.object({
  desde: z.coerce.date().optional(),
  hasta: z.coerce.date().optional(),
})
export type ExportQuery = z.infer<typeof ExportQuerySchema>
```

## Manejo de errores

| Caso | Código HTTP | Error code |
|------|------------|------------|
| Token inválido/ausente | 401 | `UNAUTHORIZED` |
| Infraestructura no existe | 404 | `INFRA_NOT_FOUND` |
| Fechas con formato inválido | 400 | `FST_ERR_VALIDATION` (Zod) |
| Infraestructura sin acciones | 200 | CSV solo con headers |

## Verificación

```bash
# 1. Levantar el stack
./dev.sh

# 2. Login para obtener token
curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"admin1234"}' | jq .data.accessToken

# 3. Exportar todas las acciones de la infra 1
curl -H "Authorization: Bearer <TOKEN>" \
  "http://localhost:3000/api/v1/infrastructures/1/actions/export" \
  -o acciones.csv && cat acciones.csv

# 4. Exportar con filtro de fechas
curl -H "Authorization: Bearer <TOKEN>" \
  "http://localhost:3000/api/v1/infrastructures/1/actions/export?desde=2024-01-01T00:00:00Z&hasta=2024-12-31T23:59:59Z" \
  -o acciones-2024.csv

# 5. Verificar 404 con infra inexistente
curl -H "Authorization: Bearer <TOKEN>" \
  "http://localhost:3000/api/v1/infrastructures/99999/actions/export"
# → { "error": { "code": "INFRA_NOT_FOUND", ... } }

# 6. Verificar 400 con fecha inválida
curl -H "Authorization: Bearer <TOKEN>" \
  "http://localhost:3000/api/v1/infrastructures/1/actions/export?desde=not-a-date"
# → 400 validation error
```
