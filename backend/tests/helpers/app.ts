import { buildApp } from '../../src/app'
import { FastifyInstance } from 'fastify'

export async function buildTestApp(): Promise<FastifyInstance> {
  return buildApp({
    jwtSecret: 'test-jwt-secret-at-least-32-characters',
    jwtRefreshSecret: 'test-refresh-secret-at-least-32-chars',
  })
}

export async function getAdminToken(app: FastifyInstance): Promise<string> {
  const res = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: { email: 'admin@test.com', password: 'admin1234' },
  })
  return JSON.parse(res.body).data.accessToken
}

export async function getEditorToken(app: FastifyInstance): Promise<string> {
  const res = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: { email: 'editor@test.com', password: 'editor1234' },
  })
  return JSON.parse(res.body).data.accessToken
}

export async function getReaderToken(app: FastifyInstance): Promise<string> {
  const res = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: { email: 'reader@test.com', password: 'reader1234' },
  })
  return JSON.parse(res.body).data.accessToken
}
