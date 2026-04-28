import { buildApp } from '../../src/app'
import { FastifyInstance } from 'fastify'

export async function buildTestApp(): Promise<FastifyInstance> {
  return buildApp({
    jwtSecret: 'test-jwt-secret-at-least-32-characters',
    jwtRefreshSecret: 'test-refresh-secret-at-least-32-chars',
  })
}

export async function getManagerToken(app: FastifyInstance): Promise<string> {
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: { email: 'manager@test.com', password: 'password123' },
  })
  return JSON.parse(res.body).data.accessToken
}

export async function getEditorToken(app: FastifyInstance): Promise<string> {
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: { email: 'editor@test.com', password: 'password123' },
  })
  return JSON.parse(res.body).data.accessToken
}

export async function getViewerToken(app: FastifyInstance): Promise<string> {
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: { email: 'viewer@test.com', password: 'password123' },
  })
  return JSON.parse(res.body).data.accessToken
}

// TODO: remove aliases after tasks 3-8 migrate all test files to manager/editor/viewer naming
// Backwards-compat aliases
export const getAdminToken = getManagerToken
export const getReaderToken = getViewerToken
