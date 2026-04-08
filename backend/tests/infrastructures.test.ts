import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { FastifyInstance } from 'fastify'
import { buildTestApp, getEditorToken, getReaderToken } from './helpers/app'
import { clearDb, seedTestData } from './helpers/db'

let app: FastifyInstance
let editorToken: string
let readerToken: string

beforeAll(async () => { app = await buildTestApp() })
afterAll(async () => { await app.close() })
beforeEach(async () => {
  await clearDb()
  await seedTestData()
  editorToken = await getEditorToken(app)
  readerToken = await getReaderToken(app)
})

describe('GET /api/v1/infrastructures', () => {
  it('cualquier usuario autenticado puede listar', async () => {
    const res = await app.inject({
      method: 'GET', url: '/api/v1/infrastructures',
      headers: { authorization: `Bearer ${readerToken}` },
    })
    expect(res.statusCode).toBe(200)
    expect(Array.isArray(JSON.parse(res.body).data)).toBe(true)
  })

  it('sin token devuelve 401', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/infrastructures' })
    expect(res.statusCode).toBe(401)
  })
})

describe('POST /api/v1/infrastructures', () => {
  it('editor puede crear infraestructura', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/v1/infrastructures',
      headers: { authorization: `Bearer ${editorToken}` },
      payload: { name: 'Depuradora Norte', location: 'Polígono A' },
    })
    expect(res.statusCode).toBe(201)
    expect(JSON.parse(res.body).data.name).toBe('Depuradora Norte')
  })

  it('reader no puede crear (403)', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/v1/infrastructures',
      headers: { authorization: `Bearer ${readerToken}` },
      payload: { name: 'Test' },
    })
    expect(res.statusCode).toBe(403)
  })
})

describe('GET /api/v1/infrastructures/:id', () => {
  it('devuelve 404 con id inexistente', async () => {
    const res = await app.inject({
      method: 'GET', url: '/api/v1/infrastructures/99999',
      headers: { authorization: `Bearer ${readerToken}` },
    })
    expect(res.statusCode).toBe(404)
  })
})
