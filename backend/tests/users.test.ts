import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { FastifyInstance } from 'fastify'
import { buildTestApp, getAdminToken, getReaderToken } from './helpers/app'
import { clearDb, seedTestData } from './helpers/db'

let app: FastifyInstance
let adminToken: string
let readerToken: string
let adminRoleId: number

beforeAll(async () => { app = await buildTestApp() })
afterAll(async () => { await app.close() })
beforeEach(async () => {
  await clearDb()
  const seed = await seedTestData()
  adminRoleId = seed.adminRole.id
  adminToken = await getAdminToken(app)
  readerToken = await getReaderToken(app)
})

describe('GET /api/v1/users', () => {
  it('admin puede listar usuarios', async () => {
    const res = await app.inject({
      method: 'GET', url: '/api/v1/users',
      headers: { authorization: `Bearer ${adminToken}` },
    })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.data.length).toBeGreaterThan(0)
    // No debe exponer passwordHash
    expect(body.data[0].passwordHash).toBeUndefined()
  })

  it('reader no puede listar usuarios (403)', async () => {
    const res = await app.inject({
      method: 'GET', url: '/api/v1/users',
      headers: { authorization: `Bearer ${readerToken}` },
    })
    expect(res.statusCode).toBe(403)
  })

  it('sin token devuelve 401', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/users' })
    expect(res.statusCode).toBe(401)
  })
})

describe('POST /api/v1/users', () => {
  it('admin puede crear usuario', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/v1/users',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { email: 'nuevo@test.com', password: 'password123', fullName: 'Nuevo Usuario', roleId: adminRoleId },
    })
    expect(res.statusCode).toBe(201)
    const body = JSON.parse(res.body)
    expect(body.data.email).toBe('nuevo@test.com')
    expect(body.data.passwordHash).toBeUndefined()
  })

  it('devuelve 409 con email duplicado', async () => {
    // admin@test.com ya existe del seed
    const res = await app.inject({
      method: 'POST', url: '/api/v1/users',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { email: 'admin@test.com', password: 'password123', fullName: 'Duplicado', roleId: 1 },
    })
    expect(res.statusCode).toBe(409)
  })
})

describe('PATCH /api/v1/users/:id', () => {
  it('admin puede actualizar fullName', async () => {
    // Obtener el ID del admin
    const listRes = await app.inject({
      method: 'GET', url: '/api/v1/users',
      headers: { authorization: `Bearer ${adminToken}` },
    })
    const users = JSON.parse(listRes.body).data
    const adminUser = users.find((u: any) => u.email === 'admin@test.com')

    const res = await app.inject({
      method: 'PATCH', url: `/api/v1/users/${adminUser.id}`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { fullName: 'Admin Actualizado' },
    })
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body).data.fullName).toBe('Admin Actualizado')
  })
})
