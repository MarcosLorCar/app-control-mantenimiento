import type { FastifyInstance } from 'fastify'
import { CreateActionSchema, UpdateActionSchema } from './actions.schema'
import { listActions, getAction, createAction, updateAction, deleteAction } from './actions.service'
import { getMaterial } from '../materials/materials.service'

export async function actionsRoutes(app: FastifyInstance) {
  // List all actions
  app.get('/actions', { preHandler: [app.verifyToken] }, async (req, reply) => {
    return reply.send({ data: await listActions(app.db) })
  })

  // Create action (performedBy comes from JWT)
  app.post('/actions', { preHandler: [app.requireWrite] }, async (req, reply) => {
    const parsed = CreateActionSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } })
    }
    const data = await createAction(app.db, parsed.data, req.user.sub)
    return reply.status(201).send({ data })
  })

  // Get action detail
  app.get('/actions/:id', { preHandler: [app.verifyToken] }, async (req, reply) => {
    const id = Number((req.params as any).id)
    const data = await getAction(app.db, id)
    if (!data) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Acción no encontrada' } })
    }
    return reply.send({ data })
  })

  // Update action
  app.patch('/actions/:id', { preHandler: [app.requireWrite] }, async (req, reply) => {
    const id = Number((req.params as any).id)
    const existing = await getAction(app.db, id)
    if (!existing) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Acción no encontrada' } })
    }
    const parsed = UpdateActionSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } })
    }
    const data = await updateAction(app.db, id, parsed.data)
    return reply.send({ data })
  })

  // Hard-delete action
  app.delete('/actions/:id', { preHandler: [app.requireManage] }, async (req, reply) => {
    const id = Number((req.params as any).id)
    const existing = await getAction(app.db, id)
    if (!existing) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Acción no encontrada' } })
    }
    await deleteAction(app.db, id)
    return reply.status(204).send()
  })

  // Link material to action
  app.post('/actions/:id/materials', { preHandler: [app.requireWrite] }, async (req, reply) => {
    const id = Number((req.params as any).id)
    const { materialId } = req.body as { materialId: number }
    if (!materialId) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: 'materialId es requerido' } })
    }
    const action = await getAction(app.db, id)
    if (!action) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Acción no encontrada' } })
    }
    const material = await getMaterial(app.db, materialId)
    if (!material) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Material no encontrado' } })
    }
    const updated = await app.db.action.update({
      where: { id },
      data: { materials: { connect: { id: materialId } } },
      include: {
        type: { select: { id: true, code: true, name: true, icon: true, color: true } },
        materials: { select: { id: true, name: true, typeId: true } },
        location: { select: { id: true, name: true, path: true, parentId: true, latitude: true, longitude: true } },
        performer: { select: { id: true, fullName: true, email: true } },
      },
    })
    return reply.send({ data: updated })
  })

  // Unlink material from action
  app.delete('/actions/:id/materials/:materialId', { preHandler: [app.requireWrite] }, async (req, reply) => {
    const id = Number((req.params as any).id)
    const materialId = Number((req.params as any).materialId)
    const action = await getAction(app.db, id)
    if (!action) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Acción no encontrada' } })
    }
    const updated = await app.db.action.update({
      where: { id },
      data: { materials: { disconnect: { id: materialId } } },
      include: {
        type: { select: { id: true, code: true, name: true, icon: true, color: true } },
        materials: { select: { id: true, name: true, typeId: true } },
        location: { select: { id: true, name: true, path: true, parentId: true, latitude: true, longitude: true } },
        performer: { select: { id: true, fullName: true, email: true } },
      },
    })
    return reply.send({ data: updated })
  })

  // Actions by material
  app.get('/materials/:materialId/actions', { preHandler: [app.verifyToken] }, async (req, reply) => {
    const materialId = Number((req.params as any).materialId)
    return reply.send({ data: await listActions(app.db, { materialId }) })
  })

  // Actions by location
  app.get('/locations/:locId/actions', { preHandler: [app.verifyToken] }, async (req, reply) => {
    const locationId = Number((req.params as any).locId)
    return reply.send({ data: await listActions(app.db, { locationId }) })
  })
}
