import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as client from '../../api/client'
import { listActionTypes, listRoles } from '../../api/catalog'

vi.mock('../../api/client', async (importOriginal) => {
  const mod = await importOriginal<typeof client>()
  return { ...mod, apiFetch: vi.fn() }
})

const mockFetch = vi.mocked(client.apiFetch)
beforeEach(() => vi.clearAllMocks())

describe('listActionTypes', () => {
  it('llama a GET /api/v1/catalog/action-types', async () => {
    mockFetch.mockResolvedValue({ data: [{ id: 1, name: 'inspection', description: null, consumesMaterials: false }] })
    const result = await listActionTypes()
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/catalog/action-types')
    expect(result).toHaveLength(1)
  })
})

describe('listRoles', () => {
  it('llama a GET /api/v1/catalog/roles', async () => {
    mockFetch.mockResolvedValue({ data: [{ id: 1, name: 'admin', description: null, canWrite: true, canManage: true }] })
    const result = await listRoles()
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/catalog/roles')
    expect(result).toHaveLength(1)
  })
})
