import { FastifyPluginAsync } from 'fastify'
import { CreateInfrastructureSchema, UpdateInfrastructureSchema } from './infrastructures.schema'
import { listInfrastructures, getInfrastructure, createInfrastructure, updateInfrastructure, deleteInfrastructure } from './infrastructures.service'

const infrastructuresRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', { preHandler: fastify.verifyToken }, async (_req, reply) => {
    const data = await listInfrastructures(fastify.db)
    return reply.send({ data })
  })

  fastify.get('/:id', { preHandler: fastify.verifyToken }, async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      const data = await getInfrastructure(fastify.db, Number(id))
      return reply.send({ data })
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: { code: err.code, message: err.message } })
    }
  })

  fastify.post('/', { preHandler: fastify.requireWrite }, async (request, reply) => {
    const result = CreateInfrastructureSchema.safeParse(request.body)
    if (!result.success) return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: result.error.message } })
    try {
      const data = await createInfrastructure(fastify.db, result.data)
      return reply.code(201).send({ data })
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: { code: err.code, message: err.message } })
    }
  })

  fastify.patch('/:id', { preHandler: fastify.requireWrite }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const result = UpdateInfrastructureSchema.safeParse(request.body)
    if (!result.success) return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: result.error.message } })
    try {
      const data = await updateInfrastructure(fastify.db, Number(id), result.data)
      return reply.send({ data })
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: { code: err.code, message: err.message } })
    }
  })

  fastify.delete('/:id', { preHandler: fastify.requireManage }, async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      await deleteInfrastructure(fastify.db, Number(id))
      return reply.send({ data: { ok: true } })
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: { code: err.code, message: err.message } })
    }
  })
}

export default infrastructuresRoutes
