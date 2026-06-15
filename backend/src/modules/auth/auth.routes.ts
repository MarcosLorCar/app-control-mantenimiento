import bcrypt from 'bcryptjs'
import { FastifyPluginAsync, FastifyReply } from 'fastify'
import { LoginBodySchema } from './auth.schema'
import { loginService, googleLoginService } from './auth.service'
import { JwtPayload } from '@infragest/shared'

function setRefreshCookie(reply: FastifyReply, token: string) {
  reply.setCookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  })
}

const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/providers', async (_request, reply) => {
    return reply.send({ data: { google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) } })
  })

  fastify.post('/login', { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, async (request, reply) => {
    const result = LoginBodySchema.safeParse(request.body)
    if (!result.success) {
      return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: result.error.message } })
    }

    try {
      const data = await loginService(fastify.db, fastify, result.data)
      const refreshToken = await reply.refreshJwtSign(
        { sub: data.userId, tv: data.tokenVersion } as unknown as JwtPayload,
        { expiresIn: '7d' }
      )
      setRefreshCookie(reply, refreshToken)
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
      const decoded = request.refreshUser as unknown as { sub: number; tv?: number }
      const user = await fastify.db.user.findUnique({
        where: { id: decoded.sub },
        include: { role: true },
      })

      if (!user || !user.isActive || user.deletedAt !== null) {
        return reply.code(401).send({ error: { code: 'UNAUTHORIZED', message: 'Sesión inválida' } })
      }

      if (decoded.tv !== undefined && decoded.tv !== user.tokenVersion) {
        return reply.code(401).send({ error: { code: 'UNAUTHORIZED', message: 'Sesión inválida' } })
      }

      const payload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role.name,
        can_write: user.role.canWrite,
        can_manage: user.role.canManage,
        must_change_password: user.mustChangePassword,
        tv: user.tokenVersion,
      }

      const accessToken = fastify.jwt.sign(payload, { expiresIn: '15m' })
      return reply.send({ data: { accessToken } })
    } catch {
      return reply.code(401).send({ error: { code: 'UNAUTHORIZED', message: 'Sesión expirada' } })
    }
  })

  fastify.get('/google/callback', async (request, reply) => {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173'
    try {
      // @ts-expect-error — googleOAuth2 is conditionally registered
      if (!fastify.googleOAuth2) {
        return reply.code(503).send({ error: { code: 'OAUTH_DISABLED', message: 'OAuth not configured' } })
      }
      // @ts-expect-error — googleOAuth2 is conditionally registered
      const token = await fastify.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request)
      const resp = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${token.token.access_token}` },
      })
      if (!resp.ok) throw Object.assign(new Error('userinfo_failed'), { code: 'OAUTH_ERROR' })
      const { email } = (await resp.json()) as { email: string }
      const data = await googleLoginService(fastify.db, email)
      const refreshToken = await reply.refreshJwtSign(
        { sub: data.userId, tv: data.tokenVersion } as unknown as JwtPayload,
        { expiresIn: '7d' }
      )
      setRefreshCookie(reply, refreshToken)
      return reply.redirect(frontendUrl)
    } catch (err: any) {
      const errorCode = err?.code === 'NOT_REGISTERED' ? 'not_registered' : 'oauth_error'
      return reply.redirect(`${frontendUrl}/login?error=${errorCode}`)
    }
  })

  fastify.patch('/password', { preHandler: fastify.verifyToken }, async (request, reply) => {
    const { newPassword, currentPassword } = request.body as { newPassword: string; currentPassword?: string }
    if (!newPassword || newPassword.length < 8) {
      return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: 'La contraseña debe tener al menos 8 caracteres' } })
    }
    const caller = request.user as unknown as JwtPayload
    const userId = caller.sub

    const user = await fastify.db.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true, mustChangePassword: true },
    })
    if (!user) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Usuario no encontrado' } })

    if (!user.mustChangePassword) {
      if (!currentPassword) {
        return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: 'Debes proporcionar tu contraseña actual' } })
      }
      if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
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
