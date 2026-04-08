import { FastifyPluginAsync } from 'fastify'
import { CreateActionSchema, UpdateActionSchema, CreateMaterialSchema, UpdateMaterialSchema } from './actions.schema'
import {
  listActions, getAction, createAction, updateAction, deleteAction,
  listMaterials, createMaterial, updateMaterial, deleteMaterial,
} from './actions.service'

const actionsRoutes: FastifyPluginAsync = async (fastify) => {
  // --- Acciones bajo una infraestructura ---

  fastify.get('/infrastructures/:infraId/actions', { preHandler: fastify.verifyToken }, async (request, reply) => {
    const { infraId } = request.params as { infraId: string }
    const data = await listActions(fastify.db, Number(infraId))
    return reply.send({ data })
  })

  fastify.post('/infrastructures/:infraId/actions', { preHandler: fastify.requireWrite }, async (request, reply) => {
    const { infraId } = request.params as { infraId: string }
    const result = CreateActionSchema.safeParse(request.body)
    if (!result.success) return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: result.error.message } })
    try {
      const data = await createAction(fastify.db, Number(infraId), request.user.sub, result.data)
      return reply.code(201).send({ data })
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: { code: err.code, message: err.message } })
    }
  })

  // --- CRUD directo de acciones ---

  fastify.get('/actions/:id', { preHandler: fastify.verifyToken }, async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      const data = await getAction(fastify.db, Number(id))
      return reply.send({ data })
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: { code: err.code, message: err.message } })
    }
  })

  fastify.patch('/actions/:id', { preHandler: fastify.requireWrite }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const result = UpdateActionSchema.safeParse(request.body)
    if (!result.success) return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: result.error.message } })
    try {
      const data = await updateAction(fastify.db, Number(id), result.data)
      return reply.send({ data })
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: { code: err.code, message: err.message } })
    }
  })

  fastify.delete('/actions/:id', { preHandler: fastify.requireManage }, async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      await deleteAction(fastify.db, Number(id))
      return reply.send({ data: { ok: true } })
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: { code: err.code, message: err.message } })
    }
  })

  // --- Materiales de una acción ---

  fastify.get('/actions/:id/materials', { preHandler: fastify.verifyToken }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const data = await listMaterials(fastify.db, Number(id))
    return reply.send({ data })
  })

  fastify.post('/actions/:id/materials', { preHandler: fastify.requireWrite }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const result = CreateMaterialSchema.safeParse(request.body)
    if (!result.success) return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: result.error.message } })
    try {
      const data = await createMaterial(fastify.db, Number(id), result.data)
      return reply.code(201).send({ data })
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: { code: err.code, message: err.message } })
    }
  })

  // --- CRUD directo de materiales ---

  fastify.patch('/materials/:id', { preHandler: fastify.requireWrite }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const result = UpdateMaterialSchema.safeParse(request.body)
    if (!result.success) return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: result.error.message } })
    try {
      const data = await updateMaterial(fastify.db, Number(id), result.data)
      return reply.send({ data })
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: { code: err.code, message: err.message } })
    }
  })

  fastify.delete('/materials/:id', { preHandler: fastify.requireManage }, async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      await deleteMaterial(fastify.db, Number(id))
      return reply.send({ data: { ok: true } })
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: { code: err.code, message: err.message } })
    }
  })
}

export default actionsRoutes
