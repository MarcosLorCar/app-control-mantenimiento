import { FastifyPluginAsync } from 'fastify'
import { CreateActionTypeSchema } from './catalog.schema'
import { listRoles, listActionTypes, createActionType } from './catalog.service'

const catalogRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/roles', { preHandler: fastify.requireManage }, async (_req, reply) => {
    const data = await listRoles(fastify.db)
    return reply.send({ data })
  })

  fastify.get('/action-types', { preHandler: fastify.verifyToken }, async (_req, reply) => {
    const data = await listActionTypes(fastify.db)
    return reply.send({ data })
  })

  fastify.post('/action-types', { preHandler: fastify.requireManage }, async (request, reply) => {
    const result = CreateActionTypeSchema.safeParse(request.body)
    if (!result.success) return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: result.error.message } })
    try {
      const data = await createActionType(fastify.db, result.data)
      return reply.code(201).send({ data })
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: { code: err.code, message: err.message } })
    }
  })
}

export default catalogRoutes
