import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RecursiveMaterialModal } from '../../components/forms/RecursiveMaterialModal'
import * as locationsApi from '../../api/locations'

vi.mock('../../api/locations')

const mockLocations = [
  {
    id: 18,
    name: 'Parque de El Retiro',
    parentId: null,
    path: '/18/',
    infraTypeId: 6,
    infraType: { id: 6, name: 'Parque', icon: '🌳', color: '#10B981' },
    createdAt: '',
    updatedAt: '',
    deletedAt: null
  },
  {
    id: 19,
    name: 'Estanque Grande del Retiro',
    parentId: 18,
    path: '/18/19/',
    infraTypeId: 6,
    infraType: { id: 6, name: 'Parque', icon: '🌳', color: '#10B981' },
    createdAt: '',
    updatedAt: '',
    deletedAt: null
  }
]

const mockLocationDetail = {
  id: 18,
  name: 'Parque de El Retiro',
  description: 'Jardín histórico',
  path: '/18/',
  parentId: null,
  infraTypeId: 6,
  children: [
    {
      id: 19,
      name: 'Estanque Grande del Retiro',
      parentId: 18,
      path: '/18/19/',
      infraTypeId: 6,
      infraType: { id: 6, name: 'Parque' },
      _count: { children: 0, materials: 0, actions: 0 }
    }
  ],
  materials: [],
  actions: [],
  descendantMaterials: [
    {
      id: 10,
      name: 'Bomba de Recirculación B-01',
      installedAt: '2026-06-12T15:05:50.503Z',
      attributes: {},
      typeId: 8,
      locationId: 19,
      type: { id: 8, name: 'Bomba Hidráulica', code: 'bomba_hidraulica' },
      location: { id: 19, name: 'Estanque Grande del Retiro', path: '/18/19/' },
      createdAt: '',
      updatedAt: '',
      deletedAt: null
    }
  ]
}

describe('RecursiveMaterialModal', () => {
  let qc: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    qc = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: Infinity,
        }
      }
    })
  })

  it('renders the tree correctly when queries resolve', async () => {
    // Mock listLocations to return all locations
    vi.mocked(locationsApi.listLocations).mockResolvedValue(mockLocations as any)
    // Mock getLocation to return detail for 18
    vi.mocked(locationsApi.getLocation).mockResolvedValue(mockLocationDetail as any)

    render(
      <QueryClientProvider client={qc}>
        <RecursiveMaterialModal
          rootLocationId={18}
          allLocations={mockLocations as any}
          initialChanges={[]}
          onClose={() => {}}
          onConfirm={() => {}}
        />
      </QueryClientProvider>
    )

    // Initially should show loading
    expect(screen.getByText(/Cargando jerarquía/i)).toBeInTheDocument()

    // Wait for the loader to disappear and check if tree renders child nodes and materials
    await waitFor(() => {
      expect(screen.queryByText(/Cargando jerarquía/i)).not.toBeInTheDocument()
    })

    // Check if root location name renders
    expect(screen.getByText('Parque de El Retiro')).toBeInTheDocument()
    // Check if child location name renders
    const childFolder = screen.getByText('Estanque Grande del Retiro')
    expect(childFolder).toBeInTheDocument()

    // Expand child folder
    fireEvent.click(childFolder)

    // Check if material name renders after expansion
    expect(screen.getByText('Bomba de Recirculación B-01')).toBeInTheDocument()
  })

  it('renders correctly even after dashboard and category queries are in the cache', async () => {
    // 1. Mock the API responses
    // Mock listLocations when parentId is null (dashboard)
    vi.mocked(locationsApi.listLocations).mockImplementation(async (parentId, infraTypeId) => {
      if (parentId === null && infraTypeId === undefined) {
        // Only root locations
        return mockLocations.filter(l => l.parentId === null) as any
      }
      if (parentId === null && infraTypeId === 6) {
        // Root locations for category 6
        return mockLocations.filter(l => l.parentId === null && l.infraTypeId === 6) as any
      }
      if (parentId === undefined) {
        // All locations
        return mockLocations as any
      }
      return []
    })

    // Mock getLocation detail
    vi.mocked(locationsApi.getLocation).mockResolvedValue(mockLocationDetail as any)

    // 2. Simulate dashboard query
    await qc.prefetchQuery({
      queryKey: ['locations', 'list', { parentId: null, infraTypeId: 'all' }],
      queryFn: () => locationsApi.listLocations(null)
    })

    // 3. Simulate category list query
    await qc.prefetchQuery({
      queryKey: ['locations', 'list', { parentId: null, infraTypeId: 6 }],
      queryFn: () => locationsApi.listLocations(null, 6)
    })

    // 4. Simulate ActionFormPage loading all locations
    await qc.prefetchQuery({
      queryKey: ['locations', 'list', { parentId: 'all', infraTypeId: 'all' }],
      queryFn: () => locationsApi.listLocations(undefined)
    })

    // 5. Render the modal
    render(
      <QueryClientProvider client={qc}>
        <RecursiveMaterialModal
          rootLocationId={18}
          allLocations={mockLocations as any}
          initialChanges={[]}
          onClose={() => {}}
          onConfirm={() => {}}
        />
      </QueryClientProvider>
    )

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText(/Cargando jerarquía/i)).not.toBeInTheDocument()
    })

    // Verify root and child render
    expect(screen.getByText('Parque de El Retiro')).toBeInTheDocument()
    const childFolder = screen.getByText('Estanque Grande del Retiro')
    expect(childFolder).toBeInTheDocument()

    // Expand
    fireEvent.click(childFolder)
    expect(screen.getByText('Bomba de Recirculación B-01')).toBeInTheDocument()
  })
})

