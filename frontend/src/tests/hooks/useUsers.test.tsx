import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import * as usersApi from '../../api/users'
import {
  useUsers, useUser, useCreateUser, useUpdateUser, useDeleteUser,
} from '../../hooks/useUsers'

vi.mock('../../api/users')

const user = {
  id: 1, email: 'admin@example.com', fullName: 'Admin', roleId: 1,
  isActive: true, mustChangePassword: false,
  createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', deletedAt: null,
}

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

beforeEach(() => { vi.clearAllMocks() })

describe('useUsers', () => {
  it('devuelve lista de usuarios', async () => {
    vi.mocked(usersApi.listUsers).mockResolvedValue([user])
    const { result } = renderHook(() => useUsers(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([user])
  })
})

describe('useUser', () => {
  it('devuelve un usuario por id', async () => {
    vi.mocked(usersApi.getUser).mockResolvedValue(user)
    const { result } = renderHook(() => useUser(1), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(user)
  })
})

describe('useCreateUser', () => {
  it('llama a createUser con body', async () => {
    vi.mocked(usersApi.createUser).mockResolvedValue(user)
    const { result } = renderHook(() => useCreateUser(), { wrapper: makeWrapper() })
    result.current.mutate({ email: 'a@a.com', fullName: 'A', roleId: 1 })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(usersApi.createUser).toHaveBeenCalledWith({ email: 'a@a.com', fullName: 'A', roleId: 1 })
  })
})

describe('useUpdateUser', () => {
  it('llama a updateUser con id y body', async () => {
    vi.mocked(usersApi.updateUser).mockResolvedValue(user)
    const { result } = renderHook(() => useUpdateUser(), { wrapper: makeWrapper() })
    result.current.mutate({ id: 1, body: { isActive: false } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(usersApi.updateUser).toHaveBeenCalledWith(1, { isActive: false })
  })
})

describe('useDeleteUser', () => {
  it('llama a deleteUser con id', async () => {
    vi.mocked(usersApi.deleteUser).mockResolvedValue(undefined)
    const { result } = renderHook(() => useDeleteUser(), { wrapper: makeWrapper() })
    result.current.mutate(1)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(usersApi.deleteUser).toHaveBeenCalledWith(1)
  })
})
