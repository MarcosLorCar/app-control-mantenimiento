import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { buildTestApp, getManagerToken, getEditorToken, getViewerToken } from './helpers/app'
import { testDb, clearDb, seedTestData } from './helpers/db'

describe('Catalog — ActionTypes', () => {
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

  describe('GET /api/v1/action-types', () => {
    it('returns list for authenticated users', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/action-types',
        headers: { authorization: `Bearer ${viewerToken}` },
      })
      expect(res.statusCode).toBe(200)
      expect(res.json().data[0]).toMatchObject({ code: 'inspection', name: 'Inspección' })
    })

    it('returns 401 without auth', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/action-types' })
      expect(res.statusCode).toBe(401)
    })

    it('excludes soft-deleted action types', async () => {
      await testDb.actionType.update({ where: { id: seed.actionType.id }, data: { deletedAt: new Date() } })
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/action-types',
        headers: { authorization: `Bearer ${viewerToken}` },
      })
      expect(res.json().data).toHaveLength(0)
    })
  })

  describe('POST /api/v1/action-types', () => {
    it('creates action type (requireManage)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/action-types',
        headers: { authorization: `Bearer ${managerToken}` },
        payload: { code: 'replacement', name: 'Sustitución', icon: 'refresh', color: '#10B981' },
      })
      expect(res.statusCode).toBe(201)
      expect(res.json().data).toMatchObject({ code: 'replacement', name: 'Sustitución' })
    })

    it('rejects duplicate code', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/action-types',
        headers: { authorization: `Bearer ${managerToken}` },
        payload: { code: 'inspection', name: 'Dup' },
      })
      expect(res.statusCode).toBe(409)
    })

    it('returns 403 for editor', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/action-types',
        headers: { authorization: `Bearer ${editorToken}` },
        payload: { code: 'repair', name: 'Reparación' },
      })
      expect(res.statusCode).toBe(403)
    })
  })

  describe('PATCH /api/v1/action-types/:id', () => {
    it('updates action type (requireManage)', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/action-types/${seed.actionType.id}`,
        headers: { authorization: `Bearer ${managerToken}` },
        payload: { name: 'Inspección Actualizada', color: '#FF0000' },
      })
      expect(res.statusCode).toBe(200)
      expect(res.json().data.name).toBe('Inspección Actualizada')
    })

    it('returns 404 for unknown id', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: '/api/v1/action-types/99999',
        headers: { authorization: `Bearer ${managerToken}` },
        payload: { name: 'X' },
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
