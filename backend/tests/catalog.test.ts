import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { FastifyInstance } from 'fastify'
import { buildTestApp, getAdminToken, getEditorToken } from './helpers/app'
import { clearDb, seedTestData } from './helpers/db'

let app: FastifyInstance
let adminToken: string
let editorToken: string

beforeAll(async () => { app = await buildTestApp() })
afterAll(async () => { await app.close() })
beforeEach(async () => {
  await clearDb()
  await seedTestData()
  adminToken = await getAdminToken(app)
  editorToken = await getEditorToken(app)
})

describe('GET /api/v1/catalog/action-types', () => {
  it('editor puede listar tipos de acción', async () => {
    const res = await app.inject({
      method: 'GET', url: '/api/v1/catalog/action-types',
      headers: { authorization: `Bearer ${editorToken}` },
    })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.data.length).toBeGreaterThan(0)
    expect(body.data[0]).toHaveProperty('name')
  })

  it('sin token devuelve 401', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/catalog/action-types' })
    expect(res.statusCode).toBe(401)
  })
})

describe('POST /api/v1/catalog/action-types', () => {
  it('admin puede crear un tipo de acción', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/v1/catalog/action-types',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { name: 'cleaning', description: 'Limpieza', consumesMaterials: true },
    })
    expect(res.statusCode).toBe(201)
    const body = JSON.parse(res.body)
    expect(body.data.name).toBe('cleaning')
  })

  it('editor no puede crear tipo de acción (403)', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/v1/catalog/action-types',
      headers: { authorization: `Bearer ${editorToken}` },
      payload: { name: 'cleaning', consumesMaterials: false },
    })
    expect(res.statusCode).toBe(403)
  })
})
