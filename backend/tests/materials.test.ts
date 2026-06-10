import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { buildTestApp, getManagerToken, getEditorToken, getViewerToken } from './helpers/app'
import { testDb, clearDb, seedTestData } from './helpers/db'

describe('Materials', () => {
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

  describe('GET /api/v1/materials', () => {
    it('returns list for authenticated users', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/materials',
        headers: { authorization: `Bearer ${viewerToken}` },
      })
      expect(res.statusCode).toBe(200)
      expect(res.json().data).toBeInstanceOf(Array)
      expect(res.json().data[0]).toMatchObject({ name: 'Bombilla Philips E27' })
    })

    it('returns 401 without auth', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/materials' })
      expect(res.statusCode).toBe(401)
    })

    it('excludes soft-deleted materials', async () => {
      await testDb.material.update({ where: { id: seed.material.id }, data: { deletedAt: new Date() } })
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/materials',
        headers: { authorization: `Bearer ${viewerToken}` },
      })
      expect(res.json().data).toHaveLength(0)
    })
  })

  describe('POST /api/v1/materials', () => {
    it('creates material under location (requireWrite)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/materials',
        headers: { authorization: `Bearer ${editorToken}` },
        payload: {
          name: 'Bombilla Osram E27',
          typeId: seed.materialType.id,
          locationId: seed.structure.id,
          attributes: { power_w: 12 },
        },
      })
      expect(res.statusCode).toBe(201)
      expect(res.json().data).toMatchObject({
        name: 'Bombilla Osram E27',
        locationId: seed.structure.id,
      })
    })

    it('returns 400 when missing required locationId', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/materials',
        headers: { authorization: `Bearer ${editorToken}` },
        payload: {
          name: 'Sin padre',
          typeId: seed.materialType.id,
          attributes: {},
        },
      })
      expect(res.statusCode).toBe(400)
    })

    it('returns 422 when required attribute missing', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/materials',
        headers: { authorization: `Bearer ${editorToken}` },
        payload: {
          name: 'Sin potencia',
          typeId: seed.materialType.id,
          locationId: seed.structure.id,
          attributes: {},
        },
      })
      expect(res.statusCode).toBe(422)
    })



    it('returns 403 for viewer', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/materials',
        headers: { authorization: `Bearer ${viewerToken}` },
        payload: { name: 'X', typeId: seed.materialType.id, locationId: seed.structure.id, attributes: { power_w: 1 } },
      })
      expect(res.statusCode).toBe(403)
    })
  })

  describe('GET /api/v1/materials/:id', () => {
    it('returns material detail with type info', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/materials/${seed.material.id}`,
        headers: { authorization: `Bearer ${viewerToken}` },
      })
      expect(res.statusCode).toBe(200)
      const body = res.json().data
      expect(body).toMatchObject({ id: seed.material.id, name: 'Bombilla Philips E27' })
      expect(body.type).toMatchObject({ code: 'led_bulb' })
    })

    it('returns 404 for unknown id', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/materials/99999',
        headers: { authorization: `Bearer ${viewerToken}` },
      })
      expect(res.statusCode).toBe(404)
    })
  })

  describe('GET /api/v1/locations/:id/materials', () => {
    it('returns materials in a location', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/locations/${seed.structure.id}/materials`,
        headers: { authorization: `Bearer ${viewerToken}` },
      })
      expect(res.statusCode).toBe(200)
      expect(res.json().data).toHaveLength(1)
      expect(res.json().data[0].name).toBe('Bombilla Philips E27')
    })
  })

  describe('PATCH /api/v1/materials/:id', () => {
    it('updates material attributes (requireWrite)', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/materials/${seed.material.id}`,
        headers: { authorization: `Bearer ${editorToken}` },
        payload: { attributes: { power_w: 15 } },
      })
      expect(res.statusCode).toBe(200)
      expect(res.json().data.attributes).toMatchObject({ power_w: 15 })
    })

    it('returns 404 for unknown id', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: '/api/v1/materials/99999',
        headers: { authorization: `Bearer ${editorToken}` },
        payload: { name: 'X' },
      })
      expect(res.statusCode).toBe(404)
    })
  })

  describe('DELETE /api/v1/materials/:id', () => {
    it('soft-deletes material (requireManage)', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/materials/${seed.material.id}`,
        headers: { authorization: `Bearer ${managerToken}` },
      })
      expect(res.statusCode).toBe(204)
      const check = await testDb.material.findUnique({ where: { id: seed.material.id } })
      expect(check?.deletedAt).not.toBeNull()
    })

    it('returns 403 for editor', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/materials/${seed.material.id}`,
        headers: { authorization: `Bearer ${editorToken}` },
      })
      expect(res.statusCode).toBe(403)
    })
  })
})
