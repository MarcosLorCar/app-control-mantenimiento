import { FastifyPluginAsync } from 'fastify'
import { LoginBodySchema } from './auth.schema'
import { loginService } from './auth.service'

const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/login', async (request, reply) => {
    const result = LoginBodySchema.safeParse(request.body)
    if (!result.success) {
      return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: result.error.message } })
    }

    try {
      const data = await loginService(fastify.db, fastify, result.data)
      return reply.send({ data })
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: { code: err.code ?? 'INTERNAL_ERROR', message: err.message } })
    }
  })

  fastify.post('/logout', { preHandler: fastify.verifyToken }, async (_request, reply) => {
    return reply.clearCookie('refreshToken').send({ data: { ok: true } })
  })
}

export default authRoutes
