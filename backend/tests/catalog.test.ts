import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { buildTestApp, getManagerToken, getEditorToken, getViewerToken } from './helpers/app'
import { testDb, clearDb, seedTestData } from './helpers/db'

describe('Catalog — Fixed Properties', () => {
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

  describe('GET /api/v1/fixed-properties', () => {
    it('returns list for authenticated users', async () => {
      await testDb.fixedProperty.create({
        data: { code: 'warranty_date', name: 'Fecha de garantía', type: 'DATE' }
      })
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/fixed-properties',
        headers: { authorization: `Bearer ${viewerToken}` },
      })
      expect(res.statusCode).toBe(200)
      expect(res.json().data.length).toBeGreaterThanOrEqual(1)
      const found = res.json().data.find((p: any) => p.code === 'warranty_date')
      expect(found).toMatchObject({ code: 'warranty_date', name: 'Fecha de garantía', type: 'DATE' })
    })

    it('returns 401 without auth', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/fixed-properties' })
      expect(res.statusCode).toBe(401)
    })
  })

  describe('POST /api/v1/fixed-properties', () => {
    it('creates fixed property (requireManage)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/fixed-properties',
        headers: { authorization: `Bearer ${managerToken}` },
        payload: { code: 'purchase_date', name: 'Fecha de compra', type: 'DATE' },
      })
      expect(res.statusCode).toBe(201)
      expect(res.json().data).toMatchObject({ code: 'purchase_date', name: 'Fecha de compra', type: 'DATE' })
    })

    it('rejects duplicate code', async () => {
      await testDb.fixedProperty.create({
        data: { code: 'dup_prop', name: 'Duplicate', type: 'STRING' }
      })
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/fixed-properties',
        headers: { authorization: `Bearer ${managerToken}` },
        payload: { code: 'dup_prop', name: 'Dup', type: 'STRING' },
      })
      expect(res.statusCode).toBe(409)
    })

    it('returns 403 for editor', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/fixed-properties',
        headers: { authorization: `Bearer ${editorToken}` },
        payload: { code: 'some_code', name: 'Some Property', type: 'STRING' },
      })
      expect(res.statusCode).toBe(403)
    })
  })

  describe('DELETE /api/v1/fixed-properties/:id', () => {
    it('deletes fixed property (requireManage)', async () => {
      const prop = await testDb.fixedProperty.create({
        data: { code: 'to_delete', name: 'To Delete', type: 'BOOLEAN' }
      })
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/fixed-properties/${prop.id}`,
        headers: { authorization: `Bearer ${managerToken}` },
      })
      expect(res.statusCode).toBe(204)
      const check = await testDb.fixedProperty.findUnique({ where: { id: prop.id } })
      expect(check).toBeNull()
    })

    it('returns 404 for unknown id', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: '/api/v1/fixed-properties/99999',
        headers: { authorization: `Bearer ${managerToken}` },
      })
      expect(res.statusCode).toBe(404)
    })
  })
})

describe('Catalog — Roles', () => {
  let app: Awaited<ReturnType<typeof buildTestApp>>
  let managerToken: string
  let editorToken: string

  beforeEach(async () => {
    await clearDb(testDb)
    await seedTestData(testDb)
    app = await buildTestApp()
    managerToken = await getManagerToken(app)
    editorToken = await getEditorToken(app)
  })

  afterAll(async () => { await testDb.$disconnect() })

  describe('GET /api/v1/roles', () => {
    it('returns roles list (requireManage)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/roles',
        headers: { authorization: `Bearer ${managerToken}` },
      })
      expect(res.statusCode).toBe(200)
      expect(res.json().data).toBeInstanceOf(Array)
    })

    it('returns 403 for editor', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/roles',
        headers: { authorization: `Bearer ${editorToken}` },
      })
      expect(res.statusCode).toBe(403)
    })
  })
})
