import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { FastifyInstance } from 'fastify'
import { LoginBody } from './auth.schema'
import { JwtPayload } from '@control-actions/shared'

export async function loginService(
  db: PrismaClient,
  app: FastifyInstance,
  body: LoginBody
): Promise<{ accessToken: string; refreshToken: string }> {
  const user = await db.user.findFirst({
    where: { email: body.email, deletedAt: null },
    include: { role: true },
  })

  if (!user || !user.isActive || user.deletedAt !== null) {
    throw { statusCode: 401, code: 'INVALID_CREDENTIALS', message: 'Credenciales incorrectas' }
  }

  const valid = await bcrypt.compare(body.password, user.passwordHash)
  if (!valid) {
    throw { statusCode: 401, code: 'INVALID_CREDENTIALS', message: 'Credenciales incorrectas' }
  }

  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    role: user.role.name,
    can_write: user.role.canWrite,
    can_manage: user.role.canManage,
    must_change_password: user.mustChangePassword,
  }

  const accessToken = app.jwt.sign(payload, { expiresIn: '15m' })
  // Refresh token lleva solo el sub — cast necesario por la declaración estricta de FastifyJWT
  const refreshToken = app.jwt.sign({ sub: user.id } as unknown as JwtPayload, { expiresIn: '7d' })

  return { accessToken, refreshToken }
}
