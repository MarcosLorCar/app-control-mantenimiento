import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as client from '../../api/client'
import {
  listActions, getAction, createAction, updateAction, deleteAction,
  listMaterials, createMaterial, updateMaterial, deleteMaterial,
} from '../../api/actions'

vi.mock('../../api/client', async (importOriginal) => {
  const mod = await importOriginal<typeof client>()
  return { ...mod, apiFetch: vi.fn() }
})

const mockFetch = vi.mocked(client.apiFetch)

const action = {
  id: 1, infrastructureId: 1, performedBy: 1, actionTypeId: 1,
  description: null, performedAt: '2026-01-01T00:00:00.000Z', createdAt: '2026-01-01T00:00:00.000Z',
}
const material = {
  id: 1, actionId: 1, name: 'Cable', description: null, unit: 'm',
  quantity: '10.0000', unitCost: '2.50', totalCost: '25.00', supplier: null, notes: null,
}

beforeEach(() => vi.clearAllMocks())

describe('listActions', () => {
  it('llama a GET /api/v1/infrastructures/:infraId/actions', async () => {
    mockFetch.mockResolvedValue({ data: [action] })
    const result = await listActions(1)
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/infrastructures/1/actions')
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
  it('llama a POST /api/v1/infrastructures/:infraId/actions', async () => {
    mockFetch.mockResolvedValue({ data: action })
    await createAction(1, { actionTypeId: 1 })
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/infrastructures/1/actions', {
      method: 'POST',
      body: JSON.stringify({ actionTypeId: 1 }),
    })
  })
})

describe('updateAction', () => {
  it('llama a PATCH /api/v1/actions/:id', async () => {
    mockFetch.mockResolvedValue({ data: action })
    await updateAction(1, { description: 'Actualizado' })
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/actions/1', {
      method: 'PATCH',
      body: JSON.stringify({ description: 'Actualizado' }),
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

describe('listMaterials', () => {
  it('llama a GET /api/v1/actions/:id/materials', async () => {
    mockFetch.mockResolvedValue({ data: [material] })
    const result = await listMaterials(1)
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/actions/1/materials')
    expect(result).toEqual([material])
  })
})

describe('createMaterial', () => {
  it('llama a POST /api/v1/actions/:id/materials', async () => {
    mockFetch.mockResolvedValue({ data: material })
    await createMaterial(1, { name: 'Cable', unit: 'm', quantity: 10 })
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/actions/1/materials', {
      method: 'POST',
      body: JSON.stringify({ name: 'Cable', unit: 'm', quantity: 10 }),
    })
  })
})

describe('updateMaterial', () => {
  it('llama a PATCH /api/v1/materials/:id', async () => {
    mockFetch.mockResolvedValue({ data: material })
    await updateMaterial(1, { quantity: 20 })
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/materials/1', {
      method: 'PATCH',
      body: JSON.stringify({ quantity: 20 }),
    })
  })
})

describe('deleteMaterial', () => {
  it('llama a DELETE /api/v1/materials/:id', async () => {
    mockFetch.mockResolvedValue({ data: { ok: true } })
    const result = await deleteMaterial(1)
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/materials/1', { method: 'DELETE' })
    expect(result).toBeUndefined()
  })
})
