import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listInfrastructureTypes, createInfrastructureType, updateInfrastructureType, deleteInfrastructureType,
  listRoles,
  listMaterialTypes, createMaterialType, updateMaterialType, deleteMaterialType as apiDeleteMaterialType,
  listFixedProperties, createFixedProperty, deleteFixedProperty,
} from '../api/catalog'

export function useInfrastructureTypes() {
  return useQuery({ queryKey: ['catalog', 'infrastructure-types'], queryFn: listInfrastructureTypes, staleTime: Infinity })
}

export function useCreateInfrastructureType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createInfrastructureType,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog', 'infrastructure-types'] }),
  })
}

export function useUpdateInfrastructureType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Parameters<typeof updateInfrastructureType>[1] }) =>
      updateInfrastructureType(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog', 'infrastructure-types'] }),
  })
}

export function useDeleteInfrastructureType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteInfrastructureType,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog', 'infrastructure-types'] }),
  })
}

export function useRoles() {
  return useQuery({ queryKey: ['catalog', 'roles'], queryFn: listRoles, staleTime: Infinity })
}

export function useMaterialTypes(infraTypeId?: number | null) {
  return useQuery({
    queryKey: ['catalog', 'material-types', infraTypeId ?? 'all'],
    queryFn: () => listMaterialTypes(infraTypeId),
    staleTime: Infinity,
  })
}

export function useCreateMaterialType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createMaterialType,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog', 'material-types'] }),
  })
}

export function useUpdateMaterialType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: any }) =>
      updateMaterialType(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog', 'material-types'] }),
  })
}

export function useDeleteMaterialType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: apiDeleteMaterialType,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog', 'material-types'] }),
  })
}

// Global Fixed Properties Hooks
export function useFixedProperties() {
  return useQuery({
    queryKey: ['catalog', 'fixed-properties'],
    queryFn: listFixedProperties,
    staleTime: Infinity,
  })
}

export function useCreateFixedProperty() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createFixedProperty,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog', 'fixed-properties'] }),
  })
}

export function useDeleteFixedProperty() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteFixedProperty,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog', 'fixed-properties'] }),
  })
}
