import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { buildTestApp, getManagerToken, getEditorToken, getViewerToken } from './helpers/app'
import { testDb, clearDb, seedTestData } from './helpers/db'

describe('Material Catalog', () => {
  let app: Awaited<ReturnType<typeof buildTestApp>>
  let seed: Awaited<ReturnType<typeof seedTestData>>
  let managerToken: string
  let editorToken: string
  let viewerToken: string

  beforeEach(async () => {
    await clearDb(testDb)
    seed = await seedTestData(testDb)
    app = await buildTestApp()
    managerToken = await getManagerToken(app)
    editorToken = await getEditorToken(app)
    viewerToken = await getViewerToken(app)
  })

  afterAll(async () => { await testDb.$disconnect() })

  describe('GET /api/v1/material-types', () => {
    it('returns list for authenticated users', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/material-types',
        headers: { authorization: `Bearer ${viewerToken}` },
      })
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data).toBeInstanceOf(Array)
      expect(body.data[0]).toMatchObject({ code: 'led_bulb', name: 'Bombilla LED' })
    })

    it('returns 401 without auth', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/material-types' })
      expect(res.statusCode).toBe(401)
    })
  })

  describe('POST /api/v1/material-types', () => {
    it('creates material type (requireManage)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/material-types',
        headers: { authorization: `Bearer ${managerToken}` },
        payload: { code: 'valve', name: 'Válvula', description: 'Válvula de agua' },
      })
      expect(res.statusCode).toBe(201)
      expect(res.json().data).toMatchObject({ code: 'valve', name: 'Válvula' })
    })

    it('returns 403 for viewer', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/material-types',
        headers: { authorization: `Bearer ${viewerToken}` },
        payload: { code: 'valve', name: 'Válvula' },
      })
      expect(res.statusCode).toBe(403)
    })

    it('rejects duplicate code', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/material-types',
        headers: { authorization: `Bearer ${managerToken}` },
        payload: { code: 'led_bulb', name: 'Duplicado' },
      })
      expect(res.statusCode).toBe(409)
    })
  })

  describe('PATCH /api/v1/material-types/:id', () => {
    it('updates material type (requireManage)', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/material-types/${seed.materialType.id}`,
        headers: { authorization: `Bearer ${managerToken}` },
        payload: { name: 'Bombilla LED Actualizada' },
      })
      expect(res.statusCode).toBe(200)
      expect(res.json().data.name).toBe('Bombilla LED Actualizada')
    })

    it('returns 403 for editor', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/material-types/${seed.materialType.id}`,
        headers: { authorization: `Bearer ${editorToken}` },
        payload: { name: 'X' },
      })
      expect(res.statusCode).toBe(403)
    })
  })
})
