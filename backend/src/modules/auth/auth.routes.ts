import { FastifyPluginAsync } from 'fastify'
import { LoginBodySchema } from './auth.schema'
import { loginService } from './auth.service'
import { JwtPayload } from '@control-actions/shared'

const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/login', async (request, reply) => {
    const result = LoginBodySchema.safeParse(request.body)
    if (!result.success) {
      return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: result.error.message } })
    }

    try {
      const data = await loginService(fastify.db, fastify, result.data)
      reply.setCookie('refreshToken', data.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      })
      return reply.send({ data: { accessToken: data.accessToken } })
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: { code: err.code ?? 'INTERNAL_ERROR', message: err.message } })
    }
  })

  fastify.post('/logout', { preHandler: fastify.verifyToken }, async (_request, reply) => {
    return reply.clearCookie('refreshToken', { path: '/' }).send({ data: { ok: true } })
  })

  fastify.post('/refresh', async (request, reply) => {
    const token = request.cookies?.refreshToken
    if (!token) {
      return reply.code(401).send({ error: { code: 'UNAUTHORIZED', message: 'Sin sesión activa' } })
    }

    try {
      const decoded = fastify.jwt.verify(token) as unknown as { sub: number }
      const user = await fastify.db.user.findUnique({
        where: { id: decoded.sub },
        include: { role: true },
      })

      if (!user || !user.isActive || user.deletedAt !== null) {
        return reply.code(401).send({ error: { code: 'UNAUTHORIZED', message: 'Sesión inválida' } })
      }

      const payload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role.name,
        can_write: user.role.canWrite,
        can_manage: user.role.canManage,
      }

      const accessToken = fastify.jwt.sign(payload, { expiresIn: '15m' })
      return reply.send({ data: { accessToken } })
    } catch {
      return reply.code(401).send({ error: { code: 'UNAUTHORIZED', message: 'Sesión expirada' } })
    }
  })
}

export default authRoutes
