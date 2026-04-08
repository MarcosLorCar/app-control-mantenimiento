import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import * as actionsApi from '../../api/actions'
import {
  useActions, useAction,
  useCreateAction, useUpdateAction, useDeleteAction,
  useMaterials, useCreateMaterial, useUpdateMaterial, useDeleteMaterial,
} from '../../hooks/useActions'

vi.mock('../../api/actions')

const action = {
  id: 1, infrastructureId: 1, performedBy: 1, actionTypeId: 1,
  description: null, performedAt: '2026-01-01T00:00:00.000Z', createdAt: '2026-01-01T00:00:00.000Z',
}
const material = {
  id: 1, actionId: 1, name: 'Cable', description: null, unit: 'm',
  quantity: '10.0000', unitCost: '2.50', totalCost: '25.00', supplier: null, notes: null,
}

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

beforeEach(() => vi.clearAllMocks())

describe('useActions', () => {
  it('devuelve acciones de una infraestructura', async () => {
    vi.mocked(actionsApi.listActions).mockResolvedValue([action])
    const { result } = renderHook(() => useActions(1), { wrapper: makeWrapper() })
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
  it('llama a createAction con infraId y body', async () => {
    vi.mocked(actionsApi.listActions).mockResolvedValue([])
    vi.mocked(actionsApi.createAction).mockResolvedValue(action)
    const { result } = renderHook(() => useCreateAction(1), { wrapper: makeWrapper() })
    result.current.mutate({ actionTypeId: 1 })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(actionsApi.createAction).toHaveBeenCalledWith(1, { actionTypeId: 1 })
  })
})

describe('useUpdateAction', () => {
  it('llama a updateAction con id y body', async () => {
    vi.mocked(actionsApi.listActions).mockResolvedValue([])
    vi.mocked(actionsApi.updateAction).mockResolvedValue(action)
    const { result } = renderHook(() => useUpdateAction(1), { wrapper: makeWrapper() })
    result.current.mutate({ id: 1, body: { description: 'x' } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(actionsApi.updateAction).toHaveBeenCalledWith(1, { description: 'x' })
  })
})

describe('useDeleteAction', () => {
  it('llama a deleteAction con id', async () => {
    vi.mocked(actionsApi.listActions).mockResolvedValue([])
    vi.mocked(actionsApi.deleteAction).mockResolvedValue(undefined)
    const { result } = renderHook(() => useDeleteAction(1), { wrapper: makeWrapper() })
    result.current.mutate(1)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(actionsApi.deleteAction).toHaveBeenCalledWith(1)
  })
})

describe('useMaterials', () => {
  it('devuelve materiales de una acción', async () => {
    vi.mocked(actionsApi.listMaterials).mockResolvedValue([material])
    const { result } = renderHook(() => useMaterials(1), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([material])
  })
})

describe('useCreateMaterial', () => {
  it('llama a createMaterial con actionId y body', async () => {
    vi.mocked(actionsApi.listMaterials).mockResolvedValue([])
    vi.mocked(actionsApi.createMaterial).mockResolvedValue(material)
    const { result } = renderHook(() => useCreateMaterial(1), { wrapper: makeWrapper() })
    result.current.mutate({ name: 'Cable', unit: 'm', quantity: 10 })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(actionsApi.createMaterial).toHaveBeenCalledWith(1, { name: 'Cable', unit: 'm', quantity: 10 })
  })
})

describe('useUpdateMaterial', () => {
  it('llama a updateMaterial con id y body', async () => {
    vi.mocked(actionsApi.listMaterials).mockResolvedValue([])
    vi.mocked(actionsApi.updateMaterial).mockResolvedValue(material)
    const { result } = renderHook(() => useUpdateMaterial(1), { wrapper: makeWrapper() })
    result.current.mutate({ id: 1, body: { quantity: 20 } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(actionsApi.updateMaterial).toHaveBeenCalledWith(1, { quantity: 20 })
  })
})

describe('useDeleteMaterial', () => {
  it('llama a deleteMaterial con id', async () => {
    vi.mocked(actionsApi.listMaterials).mockResolvedValue([])
    vi.mocked(actionsApi.deleteMaterial).mockResolvedValue(undefined)
    const { result } = renderHook(() => useDeleteMaterial(1), { wrapper: makeWrapper() })
    result.current.mutate(1)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(actionsApi.deleteMaterial).toHaveBeenCalledWith(1)
  })
})
