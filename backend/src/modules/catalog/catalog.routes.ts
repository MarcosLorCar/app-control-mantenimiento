import type { FastifyInstance } from 'fastify'
import {
  CreateInfrastructureTypeSchema, UpdateInfrastructureTypeSchema,
  UpdateSystemSettingsSchema,
} from './catalog.schema'
import {
  listInfrastructureTypes, getInfrastructureType, createInfrastructureType, updateInfrastructureType, softDeleteInfrastructureType,
  listRoles,
  listSystemSettings, updateSystemSettings,
} from './catalog.service'

export async function catalogRoutes(app: FastifyInstance) {
  // Infrastructure Types
  app.get('/infrastructure-types', { preHandler: [app.verifyToken] }, async (req, reply) => {
    return reply.send({ data: await listInfrastructureTypes(app.db) })
  })

  app.post('/infrastructure-types', { preHandler: [app.requireManage] }, async (req, reply) => {
    const parsed = CreateInfrastructureTypeSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } })
    }
    const existing = await app.db.infrastructureType.findFirst({ where: { name: parsed.data.name, deletedAt: null } })
    if (existing) {
      return reply.status(409).send({ error: { code: 'DUPLICATE_NAME', message: 'Nombre de tipo ya existe' } })
    }
    const data = await createInfrastructureType(app.db, parsed.data)
    return reply.status(201).send({ data })
  })

  app.patch('/infrastructure-types/:id', { preHandler: [app.requireManage] }, async (req, reply) => {
    const id = Number((req.params as any).id)
    const existing = await getInfrastructureType(app.db, id)
    if (!existing) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Tipo de infraestructura no encontrado' } })
    }
    const parsed = UpdateInfrastructureTypeSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } })
    }
    const data = await updateInfrastructureType(app.db, id, parsed.data)
    return reply.send({ data })
  })

  app.delete('/infrastructure-types/:id', { preHandler: [app.requireManage] }, async (req, reply) => {
    const id = Number((req.params as any).id)
    const existing = await getInfrastructureType(app.db, id)
    if (!existing) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Tipo de infraestructura no encontrado' } })
    }
    await softDeleteInfrastructureType(app.db, id)
    return reply.status(204).send()
  })

  // Roles
  app.get('/roles', { preHandler: [app.requireManage] }, async (req, reply) => {
    return reply.send({ data: await listRoles(app.db) })
  })

  // System Settings
  app.get('/system-settings', { preHandler: [app.verifyToken] }, async (req, reply) => {
    return reply.send({ data: await listSystemSettings(app.db) })
  })

  app.post('/system-settings', { preHandler: [app.requireManage] }, async (req, reply) => {
    const parsed = UpdateSystemSettingsSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } })
    }
    const data = await updateSystemSettings(app.db, parsed.data)
    return reply.send({ data })
  })
}

export default catalogRoutes
