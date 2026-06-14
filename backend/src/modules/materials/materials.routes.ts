import type { FastifyInstance } from 'fastify'
import { CreateMaterialSchema, UpdateMaterialSchema } from './materials.schema'
import { listMaterials, getMaterial, createMaterial, updateMaterial, softDeleteMaterial } from './materials.service'

export async function materialsRoutes(app: FastifyInstance) {
  app.get('/materials', { preHandler: [app.verifyToken] }, async (req, reply) => {
    return reply.send({ data: await listMaterials(app.db) })
  })

  app.post('/materials', { preHandler: [app.requireWrite] }, async (req, reply) => {
    const parsed = CreateMaterialSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } })
    }
    const locationId = parsed.data.locationId
    if (locationId) {
      const loc = await app.db.location.findFirst({ where: { id: locationId, deletedAt: null } })
      if (loc && loc.parentId === null) {
        return reply.status(400).send({ error: { code: 'ROOT_LOCATION_CANNOT_HAVE_MATERIALS', message: 'No se pueden asociar materiales directamente a una ubicación raíz.' } })
      }
    }
    const data = await createMaterial(app.db, parsed.data)
    return reply.status(201).send({ data })
  })

  app.get('/materials/:id', { preHandler: [app.verifyToken] }, async (req, reply) => {
    const id = Number((req.params as any).id)
    const data = await getMaterial(app.db, id)
    if (!data) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Material no encontrado' } })
    }
    return reply.send({ data })
  })

  app.patch('/materials/:id', { preHandler: [app.requireWrite] }, async (req, reply) => {
    const id = Number((req.params as any).id)
    const existing = await getMaterial(app.db, id)
    if (!existing) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Material no encontrado' } })
    }
    const parsed = UpdateMaterialSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } })
    }
    const data = await updateMaterial(app.db, id, parsed.data)
    return reply.send({ data })
  })

  app.delete('/materials/:id', { preHandler: [app.requireManage] }, async (req, reply) => {
    const id = Number((req.params as any).id)
    const existing = await getMaterial(app.db, id)
    if (!existing) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Material no encontrado' } })
    }
    await softDeleteMaterial(app.db, id)
    return reply.status(204).send()
  })

  // Materials filtered by location
  app.get('/locations/:locId/materials', { preHandler: [app.verifyToken] }, async (req, reply) => {
    const locationId = Number((req.params as any).locId)
    return reply.send({ data: await listMaterials(app.db, { locationId }) })
  })
}
