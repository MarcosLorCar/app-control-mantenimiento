import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listMaterials, getMaterial, createMaterial, updateMaterial, deleteMaterial,
  listMaterialsByLocation,
} from '../api/materials'
import { locationKeys } from './useLocations'

export const materialKeys = {
  all: ['materials'] as const,
  detail: (id: number) => ['materials', id] as const,
  byLocation: (locId: number) => ['locations', locId, 'materials'] as const,
}

export function useMaterials() {
  return useQuery({ queryKey: materialKeys.all, queryFn: listMaterials })
}

export function useMaterial(id: number) {
  return useQuery({ queryKey: materialKeys.detail(id), queryFn: () => getMaterial(id) })
}

export function useMaterialsByLocation(locationId: number) {
  return useQuery({
    queryKey: materialKeys.byLocation(locationId),
    queryFn: () => listMaterialsByLocation(locationId),
    enabled: locationId > 0,
  })
}

export function useCreateMaterial() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createMaterial,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: materialKeys.all })
      if (data.locationId) {
        qc.invalidateQueries({ queryKey: materialKeys.byLocation(data.locationId) })
        qc.invalidateQueries({ queryKey: locationKeys.detail(data.locationId) })
      }
    },
  })
}

export function useUpdateMaterial() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Parameters<typeof updateMaterial>[1] }) =>
      updateMaterial(id, body),
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: materialKeys.all })
      qc.invalidateQueries({ queryKey: materialKeys.detail(variables.id) })
      if (data.locationId) {
        qc.invalidateQueries({ queryKey: materialKeys.byLocation(data.locationId) })
        qc.invalidateQueries({ queryKey: locationKeys.detail(data.locationId) })
      }
    },
  })
}

export function useDeleteMaterial() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteMaterial,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: materialKeys.all })
      qc.invalidateQueries({ queryKey: locationKeys.all })
    },
  })
}
