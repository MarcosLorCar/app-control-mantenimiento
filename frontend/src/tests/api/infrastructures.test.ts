import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as client from '../../api/client'
import {
  listInfrastructures,
  getInfrastructure,
  createInfrastructure,
  updateInfrastructure,
  deleteInfrastructure,
} from '../../api/infrastructures'

vi.mock('../../api/client', async (importOriginal) => {
  const mod = await importOriginal<typeof client>()
  return { ...mod, apiFetch: vi.fn() }
})

const mockFetch = vi.mocked(client.apiFetch)

const infra = {
  id: 1, name: 'HQ', description: null, location: null,
  createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', deletedAt: null,
}

beforeEach(() => { vi.clearAllMocks() })

describe('listInfrastructures', () => {
  it('llama a GET /api/v1/infrastructures y devuelve el array', async () => {
    mockFetch.mockResolvedValue({ data: [infra] })
    const result = await listInfrastructures()
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/infrastructures')
    expect(result).toEqual([infra])
  })
})

describe('getInfrastructure', () => {
  it('llama a GET /api/v1/infrastructures/:id', async () => {
    mockFetch.mockResolvedValue({ data: infra })
    const result = await getInfrastructure(1)
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/infrastructures/1')
    expect(result).toEqual(infra)
  })
})

describe('createInfrastructure', () => {
  it('llama a POST con el body', async () => {
    mockFetch.mockResolvedValue({ data: infra })
    await createInfrastructure({ name: 'HQ' })
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/infrastructures', {
      method: 'POST',
      body: JSON.stringify({ name: 'HQ' }),
    })
  })
})

describe('updateInfrastructure', () => {
  it('llama a PATCH con id y body', async () => {
    mockFetch.mockResolvedValue({ data: infra })
    await updateInfrastructure(1, { name: 'Updated' })
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/infrastructures/1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated' }),
    })
  })
})

describe('deleteInfrastructure', () => {
  it('llama a DELETE y devuelve undefined', async () => {
    mockFetch.mockResolvedValue({ data: { ok: true } })
    const result = await deleteInfrastructure(1)
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/infrastructures/1', { method: 'DELETE' })
    expect(result).toBeUndefined()
  })
})
