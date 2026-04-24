import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { buildTestApp } from './helpers/app'
import { testDb, clearDb, seedTestData } from './helpers/db'
import { getManagerToken, getEditorToken, getViewerToken } from './helpers/app'

describe('Infrastructures', () => {
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

  describe('GET /api/v1/infrastructures', () => {
    it('returns list for authenticated users', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/infrastructures',
        headers: { authorization: `Bearer ${viewerToken}` },
      })
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data).toBeInstanceOf(Array)
      expect(body.data[0]).toMatchObject({ code: 'HOSP-001', name: 'Hospital Central' })
    })

    it('returns 401 for unauthenticated', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/infrastructures' })
      expect(res.statusCode).toBe(401)
    })

    it('excludes soft-deleted infrastructures', async () => {
      await testDb.infrastructure.update({
        where: { id: seed.infra.id },
        data: { deletedAt: new Date() },
      })
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/infrastructures',
        headers: { authorization: `Bearer ${viewerToken}` },
      })
      expect(res.statusCode).toBe(200)
      expect(res.json().data).toHaveLength(0)
    })
  })

  describe('POST /api/v1/infrastructures', () => {
    it('creates infrastructure (requireWrite)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/infrastructures',
        headers: { authorization: `Bearer ${editorToken}` },
        payload: { code: 'SCHOOL-001', name: 'Colegio Norte', description: 'Sede norte' },
      })
      expect(res.statusCode).toBe(201)
      expect(res.json().data).toMatchObject({ code: 'SCHOOL-001', name: 'Colegio Norte' })
    })

    it('rejects duplicate code', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/infrastructures',
        headers: { authorization: `Bearer ${editorToken}` },
        payload: { code: 'HOSP-001', name: 'Duplicado' },
      })
      expect(res.statusCode).toBe(409)
    })

    it('rejects missing required fields', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/infrastructures',
        headers: { authorization: `Bearer ${editorToken}` },
        payload: { name: 'Sin código' },
      })
      expect(res.statusCode).toBe(400)
    })

    it('returns 403 for viewer', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/infrastructures',
        headers: { authorization: `Bearer ${viewerToken}` },
        payload: { code: 'X-001', name: 'Test' },
      })
      expect(res.statusCode).toBe(403)
    })
  })

  describe('GET /api/v1/infrastructures/:id', () => {
    it('returns infrastructure by id', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/infrastructures/${seed.infra.id}`,
        headers: { authorization: `Bearer ${viewerToken}` },
      })
      expect(res.statusCode).toBe(200)
      expect(res.json().data).toMatchObject({ id: seed.infra.id, code: 'HOSP-001' })
    })

    it('returns 404 for unknown id', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/infrastructures/99999',
        headers: { authorization: `Bearer ${viewerToken}` },
      })
      expect(res.statusCode).toBe(404)
    })

    it('returns 404 for soft-deleted', async () => {
      await testDb.infrastructure.update({
        where: { id: seed.infra.id },
        data: { deletedAt: new Date() },
      })
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/infrastructures/${seed.infra.id}`,
        headers: { authorization: `Bearer ${viewerToken}` },
      })
      expect(res.statusCode).toBe(404)
    })
  })

  describe('PATCH /api/v1/infrastructures/:id', () => {
    it('updates name (requireWrite)', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/infrastructures/${seed.infra.id}`,
        headers: { authorization: `Bearer ${editorToken}` },
        payload: { name: 'Hospital Central Actualizado' },
      })
      expect(res.statusCode).toBe(200)
      expect(res.json().data.name).toBe('Hospital Central Actualizado')
    })

    it('returns 404 for unknown id', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: '/api/v1/infrastructures/99999',
        headers: { authorization: `Bearer ${editorToken}` },
        payload: { name: 'X' },
      })
      expect(res.statusCode).toBe(404)
    })

    it('returns 403 for viewer', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/infrastructures/${seed.infra.id}`,
        headers: { authorization: `Bearer ${viewerToken}` },
        payload: { name: 'X' },
      })
      expect(res.statusCode).toBe(403)
    })
  })

  describe('DELETE /api/v1/infrastructures/:id', () => {
    it('soft-deletes infrastructure (requireManage)', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/infrastructures/${seed.infra.id}`,
        headers: { authorization: `Bearer ${managerToken}` },
      })
      expect(res.statusCode).toBe(204)
      const check = await testDb.infrastructure.findUnique({ where: { id: seed.infra.id } })
      expect(check?.deletedAt).not.toBeNull()
    })

    it('returns 403 for editor', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/infrastructures/${seed.infra.id}`,
        headers: { authorization: `Bearer ${editorToken}` },
      })
      expect(res.statusCode).toBe(403)
    })

    it('returns 404 for unknown id', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: '/api/v1/infrastructures/99999',
        headers: { authorization: `Bearer ${managerToken}` },
      })
      expect(res.statusCode).toBe(404)
    })
  })
})
