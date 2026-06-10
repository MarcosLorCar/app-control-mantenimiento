import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { buildTestApp } from './helpers/app'
import { testDb, clearDb, seedTestData } from './helpers/db'
import { getManagerToken, getEditorToken, getViewerToken } from './helpers/app'

describe('Locations API', () => {
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

  afterAll(async () => {
    await testDb.$disconnect()
  })

  describe('GET /api/v1/locations', () => {
    it('returns root locations if parentId=null', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/locations?parentId=null',
        headers: { authorization: `Bearer ${viewerToken}` },
      })
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data).toBeInstanceOf(Array)
      // seed.infra is root (parentId: null)
      expect(body.data).toHaveLength(1)
      expect(body.data[0]).toMatchObject({ id: seed.infra.id, name: 'Hospital Central' })
      expect(body.data[0]._count).toBeDefined()
    })

    it('returns sub-locations if parentId=X', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/locations?parentId=${seed.infra.id}`,
        headers: { authorization: `Bearer ${viewerToken}` },
      })
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data).toBeInstanceOf(Array)
      // seed.dep parent is seed.infra
      expect(body.data).toHaveLength(1)
      expect(body.data[0]).toMatchObject({ id: seed.dep.id, name: 'Ala A' })
    })
  })

  describe('POST /api/v1/locations', () => {
    it('creates root location', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/locations',
        headers: { authorization: `Bearer ${editorToken}` },
        payload: { name: 'Campus Principal', type: 'INFRASTRUCTURE' },
      })
      expect(res.statusCode).toBe(201)
      const data = res.json().data
      expect(data).toMatchObject({ name: 'Campus Principal', parentId: null })
      expect(data.path).toBe(`/${data.id}/`)
    })

    it('creates child location', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/locations',
        headers: { authorization: `Bearer ${editorToken}` },
        payload: { name: 'Planta 2', parentId: seed.dep.id, type: 'DEPENDENCY' },
      })
      expect(res.statusCode).toBe(201)
      const data = res.json().data
      expect(data).toMatchObject({ name: 'Planta 2', parentId: seed.dep.id })
      expect(data.path).toBe(`/${seed.infra.id}/${seed.dep.id}/${data.id}/`)
    })


  })

  describe('GET /api/v1/locations/:id', () => {
    it('returns location detail with children, materials, actions', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/locations/${seed.dep.id}`,
        headers: { authorization: `Bearer ${viewerToken}` },
      })
      expect(res.statusCode).toBe(200)
      const data = res.json().data
      expect(data).toMatchObject({ id: seed.dep.id, name: 'Ala A' })
      expect(data.children).toBeInstanceOf(Array)
      expect(data.children[0]).toMatchObject({ id: seed.structure.id, name: 'Habitación 101' })
      expect(data.materials).toBeInstanceOf(Array)
      expect(data.actions).toBeInstanceOf(Array)
    })

    it('returns 404 for unknown location', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/locations/99999',
        headers: { authorization: `Bearer ${viewerToken}` },
      })
      expect(res.statusCode).toBe(404)
    })
  })

  describe('PATCH /api/v1/locations/:id', () => {
    it('updates metadata', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/locations/${seed.dep.id}`,
        headers: { authorization: `Bearer ${editorToken}` },
        payload: { name: 'Ala A Renombrada' },
      })
      expect(res.statusCode).toBe(200)
      expect(res.json().data.name).toBe('Ala A Renombrada')
    })

    it('reparents node and updates path of node and descendants', async () => {
      // Create another root location
      const anotherRoot = await testDb.location.create({
        data: { name: 'Otro Edificio', path: '/' },
      })
      await testDb.location.update({
        where: { id: anotherRoot.id },
        data: { path: `/${anotherRoot.id}/` },
      })

      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/locations/${seed.dep.id}`,
        headers: { authorization: `Bearer ${editorToken}` },
        payload: { parentId: anotherRoot.id },
      })
      expect(res.statusCode).toBe(200)
      expect(res.json().data.parentId).toBe(anotherRoot.id)
      expect(res.json().data.path).toBe(`/${anotherRoot.id}/${seed.dep.id}/`)

      // Verify that descendant path (seed.structure) was updated too
      const updatedStructure = await testDb.location.findUnique({ where: { id: seed.structure.id } })
      expect(updatedStructure?.path).toBe(`/${anotherRoot.id}/${seed.dep.id}/${seed.structure.id}/`)
    })

    it('prevents cycle reparenting (self)', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/locations/${seed.dep.id}`,
        headers: { authorization: `Bearer ${editorToken}` },
        payload: { parentId: seed.dep.id },
      })
      expect(res.statusCode).toBe(400)
      expect(res.json().error.code).toBe('CYCLE_ERROR')
    })

    it('prevents cycle reparenting (descendant)', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/locations/${seed.dep.id}`,
        headers: { authorization: `Bearer ${editorToken}` },
        payload: { parentId: seed.structure.id },
      })
      expect(res.statusCode).toBe(400)
      expect(res.json().error.code).toBe('CYCLE_ERROR')
    })
  })

  describe('DELETE /api/v1/locations/:id', () => {
    it('soft-deletes location and bubbles up child locations', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/locations/${seed.dep.id}`,
        headers: { authorization: `Bearer ${managerToken}` },
      })
      expect(res.statusCode).toBe(204)

      const deleted = await testDb.location.findUnique({ where: { id: seed.dep.id } })
      expect(deleted?.deletedAt).not.toBeNull()

      // Child (seed.structure) parentId should bubble up to parent of seed.dep (seed.infra.id)
      const child = await testDb.location.findUnique({ where: { id: seed.structure.id } })
      expect(child?.parentId).toBe(seed.infra.id)
      expect(child?.path).toBe(`/${seed.infra.id}/${seed.structure.id}/`)
    })
  })
})
