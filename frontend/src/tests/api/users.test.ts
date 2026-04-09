import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as client from '../../api/client'
import { listUsers, getUser, createUser, updateUser, deleteUser } from '../../api/users'

vi.mock('../../api/client', async (importOriginal) => {
  const mod = await importOriginal<typeof client>()
  return { ...mod, apiFetch: vi.fn() }
})

const mockFetch = vi.mocked(client.apiFetch)

const user = {
  id: 1, email: 'admin@example.com', fullName: 'Admin', roleId: 1,
  isActive: true, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', deletedAt: null,
}

beforeEach(() => { vi.clearAllMocks() })

describe('listUsers', () => {
  it('llama a GET /api/v1/users', async () => {
    mockFetch.mockResolvedValue({ data: [user] })
    const result = await listUsers()
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/users')
    expect(result).toEqual([user])
  })
})

describe('getUser', () => {
  it('llama a GET /api/v1/users/:id', async () => {
    mockFetch.mockResolvedValue({ data: user })
    await getUser(1)
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/users/1')
  })
})

describe('createUser', () => {
  it('llama a POST /api/v1/users con body', async () => {
    mockFetch.mockResolvedValue({ data: user })
    await createUser({ email: 'a@a.com', password: 'pass1234', fullName: 'A', roleId: 1 })
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/users', {
      method: 'POST',
      body: JSON.stringify({ email: 'a@a.com', password: 'pass1234', fullName: 'A', roleId: 1 }),
    })
  })
})

describe('updateUser', () => {
  it('llama a PATCH /api/v1/users/:id', async () => {
    mockFetch.mockResolvedValue({ data: user })
    await updateUser(1, { isActive: false })
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/users/1', {
      method: 'PATCH',
      body: JSON.stringify({ isActive: false }),
    })
  })
})

describe('deleteUser', () => {
  it('llama a DELETE /api/v1/users/:id', async () => {
    mockFetch.mockResolvedValue({ data: { ok: true } })
    const result = await deleteUser(1)
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/users/1', { method: 'DELETE' })
    expect(result).toBeUndefined()
  })
})
