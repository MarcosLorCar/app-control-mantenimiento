import bcrypt from 'bcryptjs'
import { FastifyPluginAsync } from 'fastify'
import { LoginBodySchema } from './auth.schema'
import { loginService } from './auth.service'
import { JwtPayload } from '@control-actions/shared'

const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/login', { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, async (request, reply) => {
    const result = LoginBodySchema.safeParse(request.body)
    if (!result.success) {
      return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: result.error.message } })
    }

    try {
      const data = await loginService(fastify.db, fastify, result.data)
      const refreshToken = await reply.refreshJwtSign({ sub: data.userId } as unknown as JwtPayload, { expiresIn: '7d' })
      reply.setCookie('refreshToken', refreshToken, {
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
    try {
      await request.refreshJwtVerify()
      const decoded = request.refreshUser as unknown as { sub: number }
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
        must_change_password: user.mustChangePassword,
      }

      const accessToken = fastify.jwt.sign(payload, { expiresIn: '15m' })
      return reply.send({ data: { accessToken } })
    } catch {
      return reply.code(401).send({ error: { code: 'UNAUTHORIZED', message: 'Sesión expirada' } })
    }
  })

  fastify.patch('/password', { preHandler: fastify.verifyToken }, async (request, reply) => {
    const { newPassword, currentPassword } = request.body as { newPassword: string; currentPassword?: string }
    if (!newPassword || newPassword.length < 8) {
      return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: 'La contraseña debe tener al menos 8 caracteres' } })
    }
    const caller = request.user as unknown as JwtPayload
    const userId = caller.sub

    if (!caller.must_change_password) {
      if (!currentPassword) {
        return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: 'Debes proporcionar tu contraseña actual' } })
      }
      const user = await fastify.db.user.findUnique({ where: { id: userId }, select: { passwordHash: true } })
      if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
        return reply.code(401).send({ error: { code: 'INVALID_CREDENTIALS', message: 'La contraseña actual es incorrecta' } })
      }
    }

    const passwordHash = await bcrypt.hash(newPassword, 10)
    await fastify.db.user.update({
      where: { id: userId },
      data: { passwordHash, mustChangePassword: false },
    })
    return reply.send({ data: { ok: true } })
  })
}

export default authRoutes
