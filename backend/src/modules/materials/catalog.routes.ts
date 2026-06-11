import type { FastifyInstance } from 'fastify'
import {
  CreateMaterialTypeSchema, UpdateMaterialTypeSchema,
  CreateFixedPropertySchema
} from './materials.schema'
import {
  listMaterialTypes, createMaterialType, updateMaterialType,
  listFixedProperties, createFixedProperty, deleteFixedProperty
} from './catalog.service'

export async function materialCatalogRoutes(app: FastifyInstance) {
  // Material Types Catalog
  app.get('/material-types', { preHandler: [app.verifyToken] }, async (req, reply) => {
    return reply.send({ data: await listMaterialTypes(app.db) })
  })

  app.post('/material-types', { preHandler: [app.requireWrite] }, async (req, reply) => {
    const parsed = CreateMaterialTypeSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } })
    }
    const existing = await app.db.materialType.findFirst({
      where: { code: parsed.data.code, deletedAt: null },
    })
    if (existing) {
      return reply.status(409).send({ error: { code: 'DUPLICATE_CODE', message: 'Código de tipo ya existe' } })
    }
    const data = await createMaterialType(app.db, parsed.data)
    return reply.status(201).send({ data })
  })

  app.patch('/material-types/:id', { preHandler: [app.requireManage] }, async (req, reply) => {
    const id = Number((req.params as any).id)
    const existing = await app.db.materialType.findFirst({ where: { id, deletedAt: null } })
    if (!existing) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Tipo de material no encontrado' } })
    }
    const parsed = UpdateMaterialTypeSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } })
    }
    const data = await updateMaterialType(app.db, id, parsed.data)
    return reply.send({ data })
  })

  // Global Fixed Properties
  app.get('/fixed-properties', { preHandler: [app.verifyToken] }, async (req, reply) => {
    return reply.send({ data: await listFixedProperties(app.db) })
  })

  app.post('/fixed-properties', { preHandler: [app.requireManage] }, async (req, reply) => {
    const parsed = CreateFixedPropertySchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } })
    }
    const existing = await app.db.fixedProperty.findUnique({
      where: { code: parsed.data.code }
    })
    if (existing) {
      return reply.status(409).send({ error: { code: 'DUPLICATE_CODE', message: 'Código de propiedad ya existe' } })
    }
    const data = await createFixedProperty(app.db, parsed.data)
    return reply.status(201).send({ data })
  })

  app.delete('/fixed-properties/:id', { preHandler: [app.requireManage] }, async (req, reply) => {
    const id = Number((req.params as any).id)
    const existing = await app.db.fixedProperty.findUnique({ where: { id } })
    if (!existing) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Propiedad no encontrada' } })
    }
    await deleteFixedProperty(app.db, id)
    return reply.status(204).send()
  })
}
