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
  typeId: 1, statusId: 1, materialId: 1, performedBy: 1,
  type: { id: 1, code: 'inspection', name: 'Inspección', icon: null, color: null },
  status: { id: 1, code: 'pending', name: 'Pendiente', color: null, isTerminal: false, sortOrder: 1 },
  material: { id: 1, code: 'MAT-001', name: 'Bombilla', typeId: 1 },
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
    await createAction({ title: 'Revisión', typeId: 1, statusId: 1, materialId: 1 })
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/actions', {
      method: 'POST',
      body: JSON.stringify({ title: 'Revisión', typeId: 1, statusId: 1, materialId: 1 }),
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
