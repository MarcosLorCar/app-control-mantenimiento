import { FastifyPluginAsync } from 'fastify'
import { CreateUserSchema, UpdateUserSchema } from './users.schema'
import { listUsers, getUser, createUser, updateUser, deleteUser, resetUserPassword } from './users.service'

const usersRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', { preHandler: fastify.requireManage }, async (_req, reply) => {
    const data = await listUsers(fastify.db)
    return reply.send({ data })
  })

  fastify.get('/:id', { preHandler: fastify.requireManage }, async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      const data = await getUser(fastify.db, Number(id))
      return reply.send({ data })
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: { code: err.code, message: err.message } })
    }
  })

  fastify.post('/', { preHandler: fastify.requireManage }, async (request, reply) => {
    const result = CreateUserSchema.safeParse(request.body)
    if (!result.success) return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: result.error.message } })
    try {
      const data = await createUser(fastify.db, result.data)
      return reply.code(201).send({ data })
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: { code: err.code, message: err.message } })
    }
  })

  fastify.patch('/:id', { preHandler: fastify.requireManage }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const result = UpdateUserSchema.safeParse(request.body)
    if (!result.success) return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: result.error.message } })
    try {
      const data = await updateUser(fastify.db, Number(id), result.data)
      return reply.send({ data })
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: { code: err.code, message: err.message } })
    }
  })

  fastify.delete('/:id', { preHandler: fastify.requireManage }, async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      await deleteUser(fastify.db, Number(id))
      return reply.send({ data: { ok: true } })
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: { code: err.code, message: err.message } })
    }
  })

  fastify.post('/:id/reset-password', { preHandler: fastify.requireManage }, async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      const data = await resetUserPassword(fastify.db, Number(id))
      return reply.send({ data })
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: { code: err.code, message: err.message } })
    }
  })
}

export default usersRoutes
