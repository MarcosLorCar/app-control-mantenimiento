import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import * as actionsApi from '../../api/actions'
import {
  useActions, useAction,
  useCreateAction, useUpdateAction, useDeleteAction,
} from '../../hooks/useActions'

vi.mock('../../api/actions')

const action = {
  id: 1, title: 'Revisión', description: null,
  performedAt: '2026-01-01T00:00:00.000Z', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
  locationId: 1, location: { id: 1, name: 'Location 1', path: '/1/', parentId: null, latitude: null, longitude: null }, performedBy: 1,
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

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

beforeEach(() => { vi.clearAllMocks() })

describe('useActions', () => {
  it('devuelve lista global de acciones', async () => {
    vi.mocked(actionsApi.listActions).mockResolvedValue([action])
    const { result } = renderHook(() => useActions(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([action])
  })
})

describe('useAction', () => {
  it('devuelve una acción por id', async () => {
    vi.mocked(actionsApi.getAction).mockResolvedValue(action)
    const { result } = renderHook(() => useAction(1), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(action)
  })
})

describe('useCreateAction', () => {
  it('llama a createAction con el body correcto', async () => {
    vi.mocked(actionsApi.listActions).mockResolvedValue([])
    vi.mocked(actionsApi.createAction).mockResolvedValue(action)
    const { result } = renderHook(() => useCreateAction(), { wrapper: makeWrapper() })
    result.current.mutate({ title: 'Revisión', locationId: 1 })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(actionsApi.createAction).toHaveBeenCalledWith({ title: 'Revisión', locationId: 1 })
  })
})

describe('useUpdateAction', () => {
  it('llama a updateAction con id y body', async () => {
    vi.mocked(actionsApi.listActions).mockResolvedValue([])
    vi.mocked(actionsApi.updateAction).mockResolvedValue(action)
    const { result } = renderHook(() => useUpdateAction(), { wrapper: makeWrapper() })
    result.current.mutate({ id: 1, body: { title: 'Actualizado' } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(actionsApi.updateAction).toHaveBeenCalledWith(1, { title: 'Actualizado' })
  })
})

describe('useDeleteAction', () => {
  it('llama a deleteAction con id', async () => {
    vi.mocked(actionsApi.listActions).mockResolvedValue([])
    vi.mocked(actionsApi.deleteAction).mockResolvedValue(undefined)
    const { result } = renderHook(() => useDeleteAction(), { wrapper: makeWrapper() })
    result.current.mutate(1)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(actionsApi.deleteAction).toHaveBeenCalledWith(1)
  })
})
