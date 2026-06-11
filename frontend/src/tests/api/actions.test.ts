import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as client from '../../api/client'
import {
  listActions, getAction, createAction, updateAction, deleteAction, listMaterialActions,
} from '../../api/actions'

vi.mock('../../api/client', async (importOriginal) => {
  const mod = await importOriginal<typeof client>()
  return { ...mod, apiFetch: vi.fn() }
})

const mockFetch = vi.mocked(client.apiFetch)

const action = {
  id: 1, title: 'Revisión', description: null,
  performedAt: '2026-01-01T00:00:00.000Z', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
  locationId: 1, performedBy: 1,
  materials: [{
    actionId: 1,
    materialId: 1,
    operation: 'INSTALL' as const,
    material: {
      id: 1,
      name: 'Bombilla',
      description: null,
      installedAt: null,
      attributes: {},
      typeId: 1,
      type: { id: 1, code: 'bulb', name: 'Bombilla', icon: null },
      locationId: 1,
      location: { id: 1, name: 'Location 1', path: '/1/' },
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      deletedAt: null,
    }
  }],
  performer: { id: 1, fullName: 'Admin', email: 'admin@example.com' },
}

beforeEach(() => { vi.clearAllMocks() })

describe('listActions', () => {
  it('llama a GET /api/v1/actions', async () => {
    mockFetch.mockResolvedValue({ data: [action] })
    const result = await listActions()
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/actions')
    expect(result).toEqual([action])
  })
})

describe('getAction', () => {
  it('llama a GET /api/v1/actions/:id', async () => {
    mockFetch.mockResolvedValue({ data: action })
    await getAction(1)
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/actions/1')
  })
})

describe('createAction', () => {
  it('llama a POST /api/v1/actions con el body', async () => {
    mockFetch.mockResolvedValue({ data: action })
    await createAction({ title: 'Revisión', locationId: 1 })
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/actions', {
      method: 'POST',
      body: JSON.stringify({ title: 'Revisión', locationId: 1 }),
    })
  })
})

describe('updateAction', () => {
  it('llama a PATCH /api/v1/actions/:id', async () => {
    mockFetch.mockResolvedValue({ data: action })
    await updateAction(1, { title: 'Revisión actualizada' })
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/actions/1', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Revisión actualizada' }),
    })
  })
})

describe('deleteAction', () => {
  it('llama a DELETE /api/v1/actions/:id', async () => {
    mockFetch.mockResolvedValue({ data: { ok: true } })
    const result = await deleteAction(1)
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/actions/1', { method: 'DELETE' })
    expect(result).toBeUndefined()
  })
})

describe('listMaterialActions', () => {
  it('llama a GET /api/v1/materials/:id/actions', async () => {
    mockFetch.mockResolvedValue({ data: [action] })
    const result = await listMaterialActions(1)
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/materials/1/actions')
    expect(result).toEqual([action])
  })
})
