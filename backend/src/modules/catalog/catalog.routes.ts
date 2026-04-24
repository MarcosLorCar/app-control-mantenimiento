import type { FastifyInstance } from 'fastify'
import {
  CreateActionTypeSchema, UpdateActionTypeSchema,
  CreateActionStatusSchema, UpdateActionStatusSchema,
} from './catalog.schema'
import {
  listRoles, listActionTypes, getActionType, createActionType, updateActionType,
  listActionStatuses, getActionStatus, createActionStatus, updateActionStatus,
} from './catalog.service'

export async function catalogRoutes(app: FastifyInstance) {
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

  // Action Statuses
  app.get('/action-statuses', { preHandler: [app.verifyToken] }, async (req, reply) => {
    return reply.send({ data: await listActionStatuses(app.db) })
  })

  app.post('/action-statuses', { preHandler: [app.requireManage] }, async (req, reply) => {
    const parsed = CreateActionStatusSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } })
    }
    const existing = await app.db.actionStatus.findFirst({
      where: { code: parsed.data.code, deletedAt: null },
    })
    if (existing) {
      return reply.status(409).send({ error: { code: 'DUPLICATE_CODE', message: 'Código de estado ya existe' } })
    }
    const data = await createActionStatus(app.db, parsed.data)
    return reply.status(201).send({ data })
  })

  app.patch('/action-statuses/:id', { preHandler: [app.requireManage] }, async (req, reply) => {
    const id = Number((req.params as any).id)
    const existing = await getActionStatus(app.db, id)
    if (!existing) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Estado de acción no encontrado' } })
    }
    const parsed = UpdateActionStatusSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } })
    }
    const data = await updateActionStatus(app.db, id, parsed.data)
    return reply.send({ data })
  })
}

export default catalogRoutes
