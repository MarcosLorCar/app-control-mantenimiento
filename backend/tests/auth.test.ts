import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { FastifyInstance } from 'fastify'
import { buildTestApp } from './helpers/app'
import { clearDb, seedTestData } from './helpers/db'

let app: FastifyInstance

beforeAll(async () => {
  app = await buildTestApp()
})

afterAll(async () => {
  await app.close()
})

beforeEach(async () => {
  await clearDb()
  await seedTestData()
})

describe('POST /api/v1/auth/login', () => {
  it('devuelve accessToken con credenciales correctas', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'admin@test.com', password: 'admin1234' },
    })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.data.accessToken).toBeDefined()
    expect(typeof body.data.accessToken).toBe('string')
  })

  it('devuelve 401 con contraseña incorrecta', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'admin@test.com', password: 'wrongpassword' },
    })
    expect(res.statusCode).toBe(401)
    const body = JSON.parse(res.body)
    expect(body.error.code).toBe('INVALID_CREDENTIALS')
  })

  it('devuelve 401 con email inexistente', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'noexiste@test.com', password: 'admin1234' },
    })
    expect(res.statusCode).toBe(401)
  })

  it('devuelve 400 con payload inválido', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'no-es-email' },
    })
    expect(res.statusCode).toBe(400)
  })
})

describe('POST /api/v1/auth/logout', () => {
  it('responde 200 con token válido', async () => {
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'admin@test.com', password: 'admin1234' },
    })
    const { accessToken } = JSON.parse(loginRes.body).data

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/logout',
      headers: { authorization: `Bearer ${accessToken}` },
    })
    expect(res.statusCode).toBe(200)
  })

  it('responde 401 sin token', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/v1/auth/logout' })
    expect(res.statusCode).toBe(401)
  })
})
