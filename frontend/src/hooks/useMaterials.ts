import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listMaterials, getMaterial, createMaterial, updateMaterial, deleteMaterial,
  listMaterialsByInfra, listMaterialsByDependency, listMaterialsByStructure,
} from '../api/materials'

export const materialKeys = {
  all: ['materials'] as const,
  detail: (id: number) => ['materials', id] as const,
  byInfra: (infraId: number) => ['infrastructures', infraId, 'materials'] as const,
  byDependency: (depId: number) => ['dependencies', depId, 'materials'] as const,
  byStructure: (structId: number) => ['structures', structId, 'materials'] as const,
}

export function useMaterials() {
  return useQuery({ queryKey: materialKeys.all, queryFn: listMaterials })
}

export function useMaterial(id: number) {
  return useQuery({ queryKey: materialKeys.detail(id), queryFn: () => getMaterial(id) })
}

export function useMaterialsByInfra(infraId: number) {
  return useQuery({
    queryKey: materialKeys.byInfra(infraId),
    queryFn: () => listMaterialsByInfra(infraId),
    enabled: infraId > 0,
  })
}

export function useMaterialsByDependency(depId: number) {
  return useQuery({
    queryKey: materialKeys.byDependency(depId),
    queryFn: () => listMaterialsByDependency(depId),
    enabled: depId > 0,
  })
}

export function useMaterialsByStructure(structId: number) {
  return useQuery({
    queryKey: materialKeys.byStructure(structId),
    queryFn: () => listMaterialsByStructure(structId),
    enabled: structId > 0,
  })
}

export function useCreateMaterial() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createMaterial,
    onSuccess: () => qc.invalidateQueries({ queryKey: materialKeys.all }),
  })
}

export function useUpdateMaterial() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Parameters<typeof updateMaterial>[1] }) =>
      updateMaterial(id, body),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: materialKeys.all })
      qc.invalidateQueries({ queryKey: materialKeys.detail(variables.id) })
    },
  })
}

export function useDeleteMaterial() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteMaterial,
    onSuccess: () => qc.invalidateQueries({ queryKey: materialKeys.all }),
  })
}
