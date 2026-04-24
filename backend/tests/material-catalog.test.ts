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

    it('returns 403 for editor', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/material-types',
        headers: { authorization: `Bearer ${editorToken}` },
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

  describe('GET /api/v1/material-types/:id/categories', () => {
    it('returns categories for a material type', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/material-types/${seed.materialType.id}/categories`,
        headers: { authorization: `Bearer ${viewerToken}` },
      })
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data).toBeInstanceOf(Array)
      expect(body.data[0]).toMatchObject({ code: 'power_w', dataType: 'NUMBER', required: true })
    })
  })

  describe('POST /api/v1/material-types/:id/categories', () => {
    it('creates category (requireManage)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/material-types/${seed.materialType.id}/categories`,
        headers: { authorization: `Bearer ${managerToken}` },
        payload: {
          code: 'voltage_v',
          name: 'Voltaje (V)',
          dataType: 'NUMBER',
          unit: 'V',
          required: false,
          sortOrder: 2,
          enumValues: [],
        },
      })
      expect(res.statusCode).toBe(201)
      expect(res.json().data).toMatchObject({ code: 'voltage_v', dataType: 'NUMBER' })
    })

    it('rejects duplicate category code in same type', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/material-types/${seed.materialType.id}/categories`,
        headers: { authorization: `Bearer ${managerToken}` },
        payload: { code: 'power_w', name: 'Dup', dataType: 'NUMBER', enumValues: [] },
      })
      expect(res.statusCode).toBe(409)
    })

    it('returns 403 for editor', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/material-types/${seed.materialType.id}/categories`,
        headers: { authorization: `Bearer ${editorToken}` },
        payload: { code: 'x', name: 'X', dataType: 'STRING', enumValues: [] },
      })
      expect(res.statusCode).toBe(403)
    })
  })

  describe('PATCH /api/v1/categories/:id', () => {
    it('updates category name (requireManage)', async () => {
      const cat = await testDb.materialCategory.findFirst({
        where: { materialTypeId: seed.materialType.id },
      })
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/categories/${cat!.id}`,
        headers: { authorization: `Bearer ${managerToken}` },
        payload: { name: 'Potencia Actualizada' },
      })
      expect(res.statusCode).toBe(200)
      expect(res.json().data.name).toBe('Potencia Actualizada')
    })
  })

  describe('DELETE /api/v1/categories/:id', () => {
    it('deletes category (requireManage)', async () => {
      const cat = await testDb.materialCategory.findFirst({
        where: { materialTypeId: seed.materialType.id },
      })
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/categories/${cat!.id}`,
        headers: { authorization: `Bearer ${managerToken}` },
      })
      expect(res.statusCode).toBe(204)
      const check = await testDb.materialCategory.findUnique({ where: { id: cat!.id } })
      expect(check).toBeNull()
    })

    it('returns 403 for editor', async () => {
      const cat = await testDb.materialCategory.findFirst({
        where: { materialTypeId: seed.materialType.id },
      })
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/categories/${cat!.id}`,
        headers: { authorization: `Bearer ${editorToken}` },
      })
      expect(res.statusCode).toBe(403)
    })
  })
})
