import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { FastifyInstance } from 'fastify'
import { buildTestApp } from './helpers/app'
import { clearDb, seedTestData, testDb } from './helpers/db'
import { JwtPayload } from '@control-actions/shared'

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
      payload: { email: 'manager@test.com', password: 'password123' },
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
      payload: { email: 'manager@test.com', password: 'wrongpassword' },
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

describe('POST /api/v1/auth/refresh', () => {
  it('devuelve nuevo accessToken con cookie de refresh válida', async () => {
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'manager@test.com', password: 'password123' },
    })
    expect(loginRes.statusCode).toBe(200)
    const cookie = loginRes.cookies.find(c => c.name === 'refreshToken')
    expect(cookie).toBeDefined()

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      cookies: { refreshToken: cookie!.value },
    })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.data.accessToken).toBeDefined()
    expect(typeof body.data.accessToken).toBe('string')
  })

  it('devuelve 401 sin cookie', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/v1/auth/refresh' })
    expect(res.statusCode).toBe(401)
  })

  it('devuelve 401 con cookie inválida', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      cookies: { refreshToken: 'token-invalido' },
    })
    expect(res.statusCode).toBe(401)
  })
})

describe('POST /api/v1/auth/logout', () => {
  it('responde 200 con token válido', async () => {
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'manager@test.com', password: 'password123' },
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

describe('must_change_password enforcement', () => {
  it('usuario con mustChangePassword=true recibe 403 en endpoints de escritura', async () => {
    const seed = await seedTestData()

    const user = await testDb.user.create({
      data: {
        email: 'newbie@test.com',
        passwordHash: 'x',
        fullName: 'Newbie',
        roleId: seed.adminRole.id,
        mustChangePassword: true,
      },
    })

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: seed.adminRole.name,
      can_write: true,
      can_manage: true,
      must_change_password: true,
    }
    const token = app.jwt.sign(payload, { expiresIn: '15m' })

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/locations',
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'Test', infraTypeId: seed.infraType.id },
    })
    expect(res.statusCode).toBe(403)
    expect(JSON.parse(res.body).error.code).toBe('PASSWORD_CHANGE_REQUIRED')
  })

  it('usuario con mustChangePassword=true puede cambiar su contraseña', async () => {
    const seed = await seedTestData()

    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'manager@test.com', password: 'password123' },
    })
    const { accessToken } = JSON.parse(loginRes.body).data

    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/auth/password',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { newPassword: 'nuevaclave123', currentPassword: 'password123' },
    })
    expect(res.statusCode).toBe(200)
  })
})
