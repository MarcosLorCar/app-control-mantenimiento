import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import * as infraApi from '../../api/infrastructures'
import {
  useInfrastructures,
  useInfrastructure,
  useCreateInfrastructure,
  useUpdateInfrastructure,
  useDeleteInfrastructure,
} from '../../hooks/useInfrastructures'

vi.mock('../../api/infrastructures')

const infra = {
  id: 1, name: 'HQ', description: null, location: null,
  latitude: null, longitude: null,
  infraTypeId: null, infraType: null,
  createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', deletedAt: null,
}

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

beforeEach(() => { vi.clearAllMocks() })

describe('useInfrastructures', () => {
  it('devuelve lista de infraestructuras', async () => {
    vi.mocked(infraApi.listInfrastructures).mockResolvedValue([infra])
    const { result } = renderHook(() => useInfrastructures(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([infra])
  })
})

describe('useInfrastructure', () => {
  it('devuelve una infraestructura por id', async () => {
    vi.mocked(infraApi.getInfrastructure).mockResolvedValue(infra)
    const { result } = renderHook(() => useInfrastructure(1), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(infra)
  })
})

describe('useCreateInfrastructure', () => {
  it('llama a createInfrastructure al mutar', async () => {
    vi.mocked(infraApi.listInfrastructures).mockResolvedValue([])
    vi.mocked(infraApi.createInfrastructure).mockResolvedValue(infra)
    const { result } = renderHook(() => useCreateInfrastructure(), { wrapper: makeWrapper() })
    result.current.mutate({ name: 'HQ' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const calls = (infraApi.createInfrastructure as any).mock.calls
    expect(calls[0][0]).toEqual({ name: 'HQ' })
  })
})

describe('useUpdateInfrastructure', () => {
  it('llama a updateInfrastructure con id y body', async () => {
    vi.mocked(infraApi.listInfrastructures).mockResolvedValue([])
    vi.mocked(infraApi.updateInfrastructure).mockResolvedValue(infra)
    const { result } = renderHook(() => useUpdateInfrastructure(), { wrapper: makeWrapper() })
    result.current.mutate({ id: 1, body: { name: 'Nuevo' } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(infraApi.updateInfrastructure).toHaveBeenCalledWith(1, { name: 'Nuevo' })
  })
})

describe('useDeleteInfrastructure', () => {
  it('llama a deleteInfrastructure con id', async () => {
    vi.mocked(infraApi.listInfrastructures).mockResolvedValue([])
    vi.mocked(infraApi.deleteInfrastructure).mockResolvedValue(undefined)
    const { result } = renderHook(() => useDeleteInfrastructure(), { wrapper: makeWrapper() })
    result.current.mutate(1)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const calls = (infraApi.deleteInfrastructure as any).mock.calls
    expect(calls[0][0]).toBe(1)
  })
})
