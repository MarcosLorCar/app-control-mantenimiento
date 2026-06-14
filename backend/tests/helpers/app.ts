import { buildApp } from '../../src/app'
import { FastifyInstance } from 'fastify'
import { JwtPayload } from '@control-actions/shared'

export async function buildTestApp(): Promise<FastifyInstance> {
  return buildApp({
    jwtSecret: 'test-jwt-secret-at-least-32-characters',
    jwtRefreshSecret: 'test-refresh-secret-at-least-32-chars',
  })
}

export async function getManagerToken(app: FastifyInstance): Promise<string> {
  const user = await app.db.user.findFirst({
    where: { email: 'manager@test.com', deletedAt: null },
    include: { role: true }
  })
  if (!user) throw new Error('Test manager user not found')
  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    role: user.role.name,
    can_write: user.role.canWrite,
    can_manage: user.role.canManage,
  }
  return app.jwt.sign(payload, { expiresIn: '15m' })
}

export async function getEditorToken(app: FastifyInstance): Promise<string> {
  const user = await app.db.user.findFirst({
    where: { email: 'editor@test.com', deletedAt: null },
    include: { role: true }
  })
  if (!user) throw new Error('Test editor user not found')
  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    role: user.role.name,
    can_write: user.role.canWrite,
    can_manage: user.role.canManage,
  }
  return app.jwt.sign(payload, { expiresIn: '15m' })
}

export async function getViewerToken(app: FastifyInstance): Promise<string> {
  const user = await app.db.user.findFirst({
    where: { email: 'viewer@test.com', deletedAt: null },
    include: { role: true }
  })
  if (!user) throw new Error('Test viewer user not found')
  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    role: user.role.name,
    can_write: user.role.canWrite,
    can_manage: user.role.canManage,
  }
  return app.jwt.sign(payload, { expiresIn: '15m' })
}

// Backwards-compat aliases
export const getAdminToken = getManagerToken
export const getReaderToken = getViewerToken
