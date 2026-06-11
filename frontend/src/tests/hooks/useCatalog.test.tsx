import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import * as catalogApi from '../../api/catalog'
import { useFixedProperties, useRoles } from '../../hooks/useCatalog'

vi.mock('../../api/catalog')
beforeEach(() => { vi.clearAllMocks() })

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

describe('useFixedProperties', () => {
  it('devuelve propiedades fijas', async () => {
    vi.mocked(catalogApi.listFixedProperties).mockResolvedValue([
      { id: 1, code: 'warranty', name: 'Garantía', type: 'DATE' },
    ])
    const { result } = renderHook(() => useFixedProperties(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
  })
})

describe('useRoles', () => {
  it('devuelve roles', async () => {
    vi.mocked(catalogApi.listRoles).mockResolvedValue([
      { id: 1, name: 'admin', description: null, canWrite: true, canManage: true },
    ])
    const { result } = renderHook(() => useRoles(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
  })
})
