import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { buildTestApp, getManagerToken, getEditorToken, getViewerToken } from './helpers/app'
import { testDb, clearDb, seedTestData } from './helpers/db'

describe('Dependencies', () => {
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

  describe('GET /api/v1/infrastructures/:infraId/dependencies', () => {
    it('returns top-level dependencies', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/infrastructures/${seed.infra.id}/dependencies`,
        headers: { authorization: `Bearer ${viewerToken}` },
      })
      expect(res.statusCode).toBe(200)
      expect(res.json().data).toBeInstanceOf(Array)
      expect(res.json().data[0]).toMatchObject({ code: 'WING-A', name: 'Ala A' })
    })

    it('returns 401 without auth', async () => {
      const res = await app.inject({ method: 'GET', url: `/api/v1/infrastructures/${seed.infra.id}/dependencies` })
      expect(res.statusCode).toBe(401)
    })
  })

  describe('POST /api/v1/infrastructures/:infraId/dependencies', () => {
    it('creates top-level dependency (requireWrite)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/infrastructures/${seed.infra.id}/dependencies`,
        headers: { authorization: `Bearer ${editorToken}` },
        payload: { code: 'WING-B', name: 'Ala B' },
      })
      expect(res.statusCode).toBe(201)
      const body = res.json().data
      expect(body).toMatchObject({ code: 'WING-B', parentId: null, infrastructureId: seed.infra.id })
    })

    it('returns 403 for viewer', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/infrastructures/${seed.infra.id}/dependencies`,
        headers: { authorization: `Bearer ${viewerToken}` },
        payload: { code: 'WING-C', name: 'Ala C' },
      })
      expect(res.statusCode).toBe(403)
    })
  })

  describe('POST /api/v1/dependencies/:id/children', () => {
    it('creates child dependency (requireWrite)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/dependencies/${seed.dep.id}/children`,
        headers: { authorization: `Bearer ${editorToken}` },
        payload: { code: 'FLOOR-1', name: 'Planta 1' },
      })
      expect(res.statusCode).toBe(201)
      const body = res.json().data
      expect(body.parentId).toBe(seed.dep.id)
      expect(body.infrastructureId).toBe(seed.infra.id)
    })

    it('returns 404 for unknown parent', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/dependencies/99999/children',
        headers: { authorization: `Bearer ${editorToken}` },
        payload: { code: 'X', name: 'X' },
      })
      expect(res.statusCode).toBe(404)
    })
  })

  describe('GET /api/v1/dependencies/:id', () => {
    it('returns dependency with children and structures', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/dependencies/${seed.dep.id}`,
        headers: { authorization: `Bearer ${viewerToken}` },
      })
      expect(res.statusCode).toBe(200)
      const body = res.json().data
      expect(body).toMatchObject({ id: seed.dep.id, code: 'WING-A' })
      expect(body.children).toBeInstanceOf(Array)
      expect(body.structures).toBeInstanceOf(Array)
    })

    it('returns 404 for unknown id', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/dependencies/99999',
        headers: { authorization: `Bearer ${viewerToken}` },
      })
      expect(res.statusCode).toBe(404)
    })
  })

  describe('PATCH /api/v1/dependencies/:id', () => {
    it('updates dependency (requireWrite)', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/dependencies/${seed.dep.id}`,
        headers: { authorization: `Bearer ${editorToken}` },
        payload: { name: 'Ala A Actualizada' },
      })
      expect(res.statusCode).toBe(200)
      expect(res.json().data.name).toBe('Ala A Actualizada')
    })

    it('returns 404 for unknown id', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: '/api/v1/dependencies/99999',
        headers: { authorization: `Bearer ${editorToken}` },
        payload: { name: 'X' },
      })
      expect(res.statusCode).toBe(404)
    })
  })

  describe('DELETE /api/v1/dependencies/:id', () => {
    it('soft-deletes dependency (requireManage)', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/dependencies/${seed.dep.id}`,
        headers: { authorization: `Bearer ${managerToken}` },
      })
      expect(res.statusCode).toBe(204)
      const check = await testDb.dependency.findUnique({ where: { id: seed.dep.id } })
      expect(check?.deletedAt).not.toBeNull()
    })

    it('returns 403 for editor', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/dependencies/${seed.dep.id}`,
        headers: { authorization: `Bearer ${editorToken}` },
      })
      expect(res.statusCode).toBe(403)
    })
  })
})

describe('Structures', () => {
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

  describe('POST /api/v1/dependencies/:depId/structures', () => {
    it('creates structure under dependency (requireWrite)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/dependencies/${seed.dep.id}/structures`,
        headers: { authorization: `Bearer ${editorToken}` },
        payload: { code: 'ROOM-102', name: 'Habitación 102' },
      })
      expect(res.statusCode).toBe(201)
      expect(res.json().data).toMatchObject({ code: 'ROOM-102', dependencyId: seed.dep.id, infrastructureId: null })
    })

    it('returns 404 for unknown dependency', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/dependencies/99999/structures',
        headers: { authorization: `Bearer ${editorToken}` },
        payload: { code: 'X', name: 'X' },
      })
      expect(res.statusCode).toBe(404)
    })
  })

  describe('POST /api/v1/infrastructures/:infraId/structures', () => {
    it('creates structure directly under infrastructure', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/infrastructures/${seed.infra.id}/structures`,
        headers: { authorization: `Bearer ${editorToken}` },
        payload: { code: 'LOBBY', name: 'Lobby principal' },
      })
      expect(res.statusCode).toBe(201)
      expect(res.json().data).toMatchObject({ code: 'LOBBY', infrastructureId: seed.infra.id, dependencyId: null })
    })
  })

  describe('GET /api/v1/structures/:id', () => {
    it('returns structure detail', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/structures/${seed.structure.id}`,
        headers: { authorization: `Bearer ${viewerToken}` },
      })
      expect(res.statusCode).toBe(200)
      expect(res.json().data).toMatchObject({ id: seed.structure.id, code: 'ROOM-101' })
    })

    it('returns 404 for unknown', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/structures/99999',
        headers: { authorization: `Bearer ${viewerToken}` },
      })
      expect(res.statusCode).toBe(404)
    })
  })

  describe('PATCH /api/v1/structures/:id', () => {
    it('updates structure (requireWrite)', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/structures/${seed.structure.id}`,
        headers: { authorization: `Bearer ${editorToken}` },
        payload: { name: 'Hab 101 Renovada' },
      })
      expect(res.statusCode).toBe(200)
      expect(res.json().data.name).toBe('Hab 101 Renovada')
    })
  })

  describe('DELETE /api/v1/structures/:id', () => {
    it('soft-deletes structure (requireManage)', async () => {
      // Need a structure not linked to any material to avoid FK constraint errors
      const extraStructure = await testDb.structure.create({
        data: { code: 'TEMP-001', name: 'Temp', dependencyId: seed.dep.id },
      })
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/structures/${extraStructure.id}`,
        headers: { authorization: `Bearer ${managerToken}` },
      })
      expect(res.statusCode).toBe(204)
      const check = await testDb.structure.findUnique({ where: { id: extraStructure.id } })
      expect(check?.deletedAt).not.toBeNull()
    })
  })
})
