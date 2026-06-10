import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { buildTestApp, getManagerToken, getEditorToken, getViewerToken } from './helpers/app'
import { testDb, clearDb, seedTestData } from './helpers/db'

describe('Actions', () => {
  let app: Awaited<ReturnType<typeof buildTestApp>>
  let seed: Awaited<ReturnType<typeof seedTestData>>
  let editorToken: string
  let managerToken: string
  let viewerToken: string

  beforeEach(async () => {
    await clearDb(testDb)
    seed = await seedTestData(testDb)
    app = await buildTestApp()
    editorToken = await getEditorToken(app)
    managerToken = await getManagerToken(app)
    viewerToken = await getViewerToken(app)
  })

  afterAll(async () => { await testDb.$disconnect() })

  describe('GET /api/v1/actions', () => {
    it('returns empty list when no actions', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/actions',
        headers: { authorization: `Bearer ${viewerToken}` },
      })
      expect(res.statusCode).toBe(200)
      expect(res.json().data).toBeInstanceOf(Array)
      expect(res.json().data).toHaveLength(0)
    })

    it('returns actions list with relations', async () => {
      await testDb.action.create({
        data: {
          title: 'Revisión inicial',
          typeId: seed.actionType.id,
          materialId: seed.material.id,
          performedBy: seed.editor.id,
        },
      })
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/actions',
        headers: { authorization: `Bearer ${viewerToken}` },
      })
      expect(res.statusCode).toBe(200)
      const data = res.json().data
      expect(data).toHaveLength(1)
      expect(data[0]).toMatchObject({ title: 'Revisión inicial' })
      expect(data[0].type).toBeDefined()
      expect(data[0].material).toBeDefined()
      expect(data[0].performer).toBeDefined()
    })

    it('returns 401 without auth', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/actions' })
      expect(res.statusCode).toBe(401)
    })
  })

  describe('POST /api/v1/actions', () => {
    it('creates action linked to material (requireWrite)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/actions',
        headers: { authorization: `Bearer ${editorToken}` },
        payload: {
          title: 'Inspección bombilla',
          description: 'Revisión periódica',
          typeId: seed.actionType.id,
          materialId: seed.material.id,
        },
      })
      expect(res.statusCode).toBe(201)
      const body = res.json().data
      expect(body).toMatchObject({ title: 'Inspección bombilla', materialId: seed.material.id })
      expect(body.type).toMatchObject({ code: 'inspection' })
      expect(body.material).toMatchObject({ name: 'Bombilla Philips E27' })
      expect(body.performer).toBeDefined()
    })

    it('sets performedBy from JWT (current user)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/actions',
        headers: { authorization: `Bearer ${editorToken}` },
        payload: {
          title: 'Test performer',
          typeId: seed.actionType.id,
          materialId: seed.material.id,
        },
      })
      expect(res.statusCode).toBe(201)
      expect(res.json().data.performedBy).toBe(seed.editor.id)
    })

    it('returns 400 when all targets missing', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/actions',
        headers: { authorization: `Bearer ${editorToken}` },
        payload: { title: 'Sin material', typeId: seed.actionType.id },
      })
      expect(res.statusCode).toBe(400)
    })

    it('creates action linked to location', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/actions',
        headers: { authorization: `Bearer ${editorToken}` },
        payload: {
          title: 'Limpieza general',
          description: 'Limpieza de hojas y basura',
          typeId: seed.actionType.id,
          locationId: seed.infra.id,
          latitude: 40.416775,
          longitude: -3.703790,
        },
      })
      expect(res.statusCode).toBe(201)
      const body = res.json().data
      expect(body).toMatchObject({ title: 'Limpieza general', locationId: seed.infra.id, latitude: 40.416775, longitude: -3.703790 })
      expect(body.location).toBeDefined()
    })

    it('creates action and registers a new location on-the-fly', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/actions',
        headers: { authorization: `Bearer ${editorToken}` },
        payload: {
          title: 'Instalación farola nueva',
          description: 'Nueva farola instalada en pista',
          typeId: seed.actionType.id,
          newLocation: {
            name: 'Farola F13 Nueva',
            type: 'POST',
            parentId: seed.dep.id,
            latitude: 40.4165,
            longitude: -3.6852,
          },
        },
      })
      expect(res.statusCode).toBe(201)
      const body = res.json().data
      expect(body).toMatchObject({ title: 'Instalación farola nueva' })
      expect(body.locationId).toBeDefined()
      expect(body.location).toMatchObject({
        name: 'Farola F13 Nueva',
        parentId: seed.dep.id,
        latitude: 40.4165,
        longitude: -3.6852,
      })
    })


    it('returns 403 for viewer', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/actions',
        headers: { authorization: `Bearer ${viewerToken}` },
        payload: {
          title: 'Test',
          typeId: seed.actionType.id,
          materialId: seed.material.id,
        },
      })
      expect(res.statusCode).toBe(403)
    })
  })

  describe('GET /api/v1/actions/:id', () => {
    it('returns action detail with all relations', async () => {
      const action = await testDb.action.create({
        data: {
          title: 'Detalle test',
          typeId: seed.actionType.id,
          materialId: seed.material.id,
          performedBy: seed.editor.id,
        },
      })
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/actions/${action.id}`,
        headers: { authorization: `Bearer ${viewerToken}` },
      })
      expect(res.statusCode).toBe(200)
      const body = res.json().data
      expect(body.id).toBe(action.id)
      expect(body.type).toBeDefined()
      expect(body.material).toBeDefined()
      expect(body.performer).toBeDefined()
    })

    it('returns 404 for unknown id', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/actions/99999',
        headers: { authorization: `Bearer ${viewerToken}` },
      })
      expect(res.statusCode).toBe(404)
    })
  })

  describe('GET /api/v1/materials/:materialId/actions', () => {
    it('returns actions for a material', async () => {
      await testDb.action.create({
        data: {
          title: 'Acción material',
          typeId: seed.actionType.id,
          materialId: seed.material.id,
          performedBy: seed.editor.id,
        },
      })
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/materials/${seed.material.id}/actions`,
        headers: { authorization: `Bearer ${viewerToken}` },
      })
      expect(res.statusCode).toBe(200)
      expect(res.json().data).toHaveLength(1)
      expect(res.json().data[0].title).toBe('Acción material')
    })
  })

  describe('GET /api/v1/locations/:locId/actions', () => {
    it('returns actions for a location', async () => {
      await testDb.action.create({
        data: {
          title: 'Acción ubicacion',
          typeId: seed.actionType.id,
          locationId: seed.infra.id,
          performedBy: seed.editor.id,
        },
      })
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/locations/${seed.infra.id}/actions`,
        headers: { authorization: `Bearer ${viewerToken}` },
      })
      expect(res.statusCode).toBe(200)
      expect(res.json().data).toHaveLength(1)
      expect(res.json().data[0].title).toBe('Acción ubicacion')
    })
  })

  describe('PATCH /api/v1/actions/:id', () => {
    it('updates status (requireWrite)', async () => {
      const action = await testDb.action.create({
        data: {
          title: 'Para actualizar',
          typeId: seed.actionType.id,
          materialId: seed.material.id,
          performedBy: seed.editor.id,
        },
      })
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/actions/${action.id}`,
        headers: { authorization: `Bearer ${editorToken}` },
        payload: { description: 'Completado sin incidencias' },
      })
      expect(res.statusCode).toBe(200)
      expect(res.json().data.description).toBe('Completado sin incidencias')
    })
  })

  describe('DELETE /api/v1/actions/:id', () => {
    it('hard-deletes action (requireManage)', async () => {
      const action = await testDb.action.create({
        data: {
          title: 'Para borrar',
          typeId: seed.actionType.id,
          materialId: seed.material.id,
          performedBy: seed.editor.id,
        },
      })
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/actions/${action.id}`,
        headers: { authorization: `Bearer ${managerToken}` },
      })
      expect(res.statusCode).toBe(204)
      const check = await testDb.action.findUnique({ where: { id: action.id } })
      expect(check).toBeNull()
    })
  })
})
