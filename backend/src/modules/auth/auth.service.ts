import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { FastifyInstance } from 'fastify'
import { LoginBody } from './auth.schema'
import { JwtPayload } from '@control-actions/shared'

export async function googleLoginService(db: PrismaClient, email: string): Promise<{ userId: number }> {
  const user = await db.user.findFirst({
    where: { email, deletedAt: null },
  })

  if (!user || !user.isActive) {
    throw { statusCode: 401, code: 'NOT_REGISTERED', message: 'Cuenta no registrada en el sistema' }
  }

  return { userId: user.id }
}

export async function loginService(
  db: PrismaClient,
  app: FastifyInstance,
  body: LoginBody
): Promise<{ accessToken: string; userId: number }> {
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
  return { accessToken, userId: user.id }
}
