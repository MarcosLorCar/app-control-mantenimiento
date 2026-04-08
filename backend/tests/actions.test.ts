import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { FastifyInstance } from 'fastify'
import { buildTestApp, getEditorToken, getReaderToken } from './helpers/app'
import { clearDb, seedTestData, testDb } from './helpers/db'

let app: FastifyInstance
let editorToken: string
let readerToken: string

// Creados inline en beforeEach
let infraId: number
let actionId: number
let inspectionTypeId: number
let adminUserId: number

beforeAll(async () => { app = await buildTestApp() })
afterAll(async () => { await app.close() })
beforeEach(async () => {
  await clearDb()
  const seed = await seedTestData()
  inspectionTypeId = seed.inspectionType.id
  adminUserId = seed.adminUser.id
  editorToken = await getEditorToken(app)
  readerToken = await getReaderToken(app)

  const infra = await testDb.infrastructure.create({ data: { name: 'Torre Control' } })
  infraId = infra.id

  const action = await testDb.action.create({
    data: {
      infrastructureId: infra.id,
      performedBy: seed.adminUser.id,
      actionTypeId: seed.inspectionType.id,
      description: 'Inspección inicial',
    },
  })
  actionId = action.id
})

describe('GET /api/v1/infrastructures/:infraId/actions', () => {
  it('usuario autenticado puede listar acciones', async () => {
    const res = await app.inject({
      method: 'GET', url: `/api/v1/infrastructures/${infraId}/actions`,
      headers: { authorization: `Bearer ${readerToken}` },
    })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.data.length).toBe(1)
    expect(body.data[0].description).toBe('Inspección inicial')
  })

  it('sin token devuelve 401', async () => {
    const res = await app.inject({ method: 'GET', url: `/api/v1/infrastructures/${infraId}/actions` })
    expect(res.statusCode).toBe(401)
  })
})

describe('POST /api/v1/infrastructures/:infraId/actions', () => {
  it('editor puede registrar una acción', async () => {
    const res = await app.inject({
      method: 'POST', url: `/api/v1/infrastructures/${infraId}/actions`,
      headers: { authorization: `Bearer ${editorToken}` },
      payload: { actionTypeId: inspectionTypeId, description: 'Revisión de cables' },
    })
    expect(res.statusCode).toBe(201)
    expect(JSON.parse(res.body).data.description).toBe('Revisión de cables')
  })

  it('reader no puede registrar una acción (403)', async () => {
    const res = await app.inject({
      method: 'POST', url: `/api/v1/infrastructures/${infraId}/actions`,
      headers: { authorization: `Bearer ${readerToken}` },
      payload: { actionTypeId: inspectionTypeId, description: 'Test' },
    })
    expect(res.statusCode).toBe(403)
  })
})

describe('POST /api/v1/actions/:id/materials', () => {
  it('editor puede añadir material con totalCost calculado', async () => {
    const res = await app.inject({
      method: 'POST', url: `/api/v1/actions/${actionId}/materials`,
      headers: { authorization: `Bearer ${editorToken}` },
      payload: { name: 'Cable UTP cat6', unit: 'metros', quantity: 50, unitCost: 1.5 },
    })
    expect(res.statusCode).toBe(201)
    const data = JSON.parse(res.body).data
    expect(data.name).toBe('Cable UTP cat6')
    expect(Number(data.totalCost)).toBeCloseTo(75)
  })

  it('reader no puede añadir material (403)', async () => {
    const res = await app.inject({
      method: 'POST', url: `/api/v1/actions/${actionId}/materials`,
      headers: { authorization: `Bearer ${readerToken}` },
      payload: { name: 'Cable', unit: 'metros', quantity: 10 },
    })
    expect(res.statusCode).toBe(403)
  })
})

describe('GET /api/v1/actions/:id/materials', () => {
  it('usuario autenticado puede listar materiales', async () => {
    await testDb.actionMaterial.create({
      data: { actionId, name: 'Tornillo M8', unit: 'unidades', quantity: 20 },
    })
    const res = await app.inject({
      method: 'GET', url: `/api/v1/actions/${actionId}/materials`,
      headers: { authorization: `Bearer ${readerToken}` },
    })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.data.length).toBe(1)
    expect(body.data[0].name).toBe('Tornillo M8')
  })
})
