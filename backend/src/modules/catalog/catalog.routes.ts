import type { FastifyInstance } from 'fastify'
import {
  CreateInfrastructureTypeSchema, UpdateInfrastructureTypeSchema,
  CreateActionTypeSchema, UpdateActionTypeSchema,
} from './catalog.schema'
import {
  listInfrastructureTypes, getInfrastructureType, createInfrastructureType, updateInfrastructureType, softDeleteInfrastructureType,
  listRoles, listActionTypes, getActionType, createActionType, updateActionType,
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

  // Action Types
  app.get('/action-types', { preHandler: [app.verifyToken] }, async (req, reply) => {
    return reply.send({ data: await listActionTypes(app.db) })
  })

  app.post('/action-types', { preHandler: [app.requireManage] }, async (req, reply) => {
    const parsed = CreateActionTypeSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } })
    }
    const existing = await app.db.actionType.findFirst({
      where: { code: parsed.data.code, deletedAt: null },
    })
    if (existing) {
      return reply.status(409).send({ error: { code: 'DUPLICATE_CODE', message: 'Código de tipo ya existe' } })
    }
    const data = await createActionType(app.db, parsed.data)
    return reply.status(201).send({ data })
  })

  app.patch('/action-types/:id', { preHandler: [app.requireManage] }, async (req, reply) => {
    const id = Number((req.params as any).id)
    const existing = await getActionType(app.db, id)
    if (!existing) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Tipo de acción no encontrado' } })
    }
    const parsed = UpdateActionTypeSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } })
    }
    const data = await updateActionType(app.db, id, parsed.data)
    return reply.send({ data })
  })


}

export default catalogRoutes
