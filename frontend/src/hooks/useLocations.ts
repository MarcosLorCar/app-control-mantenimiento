import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listLocations,
  getLocation,
  createLocation,
  updateLocation,
  deleteLocation,
} from '../api/locations'

export const locationKeys = {
  all: ['locations'] as const,
  lists: () => [...locationKeys.all, 'list'] as const,
  list: (parentId?: number | null, infraTypeId?: number) => [...locationKeys.lists(), parentId, infraTypeId] as const,
  details: () => [...locationKeys.all, 'detail'] as const,
  detail: (id: number) => [...locationKeys.details(), id] as const,
}

export function useLocations(parentId?: number | null, infraTypeId?: number) {
  return useQuery({
    queryKey: locationKeys.list(parentId, infraTypeId),
    queryFn: () => listLocations(parentId, infraTypeId),
  })
}

export function useLocation(id: number) {
  return useQuery({
    queryKey: locationKeys.detail(id),
    queryFn: () => getLocation(id),
    enabled: !!id && !isNaN(id),
  })
}

export function useCreateLocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Parameters<typeof createLocation>[0]) => createLocation(body),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: locationKeys.lists() })
      if (data.parentId) {
        qc.invalidateQueries({ queryKey: locationKeys.detail(data.parentId) })
      }
    },
  })
}

export function useUpdateLocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Parameters<typeof updateLocation>[1] }) =>
      updateLocation(id, body),
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: locationKeys.lists() })
      qc.invalidateQueries({ queryKey: locationKeys.detail(variables.id) })
      if (data.parentId) {
        qc.invalidateQueries({ queryKey: locationKeys.detail(data.parentId) })
      }
    },
  })
}

export function useDeleteLocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteLocation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: locationKeys.all })
    },
  })
}
