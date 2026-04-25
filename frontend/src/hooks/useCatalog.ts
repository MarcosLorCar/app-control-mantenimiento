import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listRoles,
  listActionTypes, createActionType, updateActionType,
  listActionStatuses, createActionStatus, updateActionStatus,
  listMaterialTypes, createMaterialType, updateMaterialType,
  listMaterialCategories, createMaterialCategory, updateMaterialCategory, deleteMaterialCategory,
} from '../api/catalog'

export function useRoles() {
  return useQuery({ queryKey: ['catalog', 'roles'], queryFn: listRoles, staleTime: Infinity })
}

export function useActionTypes() {
  return useQuery({
    queryKey: ['catalog', 'action-types'],
    queryFn: listActionTypes,
    staleTime: Infinity,
  })
}

export function useCreateActionType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createActionType,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog', 'action-types'] }),
  })
}

export function useUpdateActionType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Parameters<typeof updateActionType>[1] }) =>
      updateActionType(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog', 'action-types'] }),
  })
}

export function useActionStatuses() {
  return useQuery({
    queryKey: ['catalog', 'action-statuses'],
    queryFn: listActionStatuses,
    staleTime: Infinity,
  })
}

export function useCreateActionStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createActionStatus,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog', 'action-statuses'] }),
  })
}

export function useUpdateActionStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Parameters<typeof updateActionStatus>[1] }) =>
      updateActionStatus(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog', 'action-statuses'] }),
  })
}

export function useMaterialTypes() {
  return useQuery({
    queryKey: ['catalog', 'material-types'],
    queryFn: listMaterialTypes,
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
    mutationFn: ({ id, body }: { id: number; body: Parameters<typeof updateMaterialType>[1] }) =>
      updateMaterialType(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog', 'material-types'] }),
  })
}

export function useMaterialCategories(materialTypeId: number) {
  return useQuery({
    queryKey: ['catalog', 'material-types', materialTypeId, 'categories'],
    queryFn: () => listMaterialCategories(materialTypeId),
    enabled: materialTypeId > 0,
  })
}

export function useCreateMaterialCategory(materialTypeId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Parameters<typeof createMaterialCategory>[1]) =>
      createMaterialCategory(materialTypeId, body),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ['catalog', 'material-types', materialTypeId, 'categories'],
      }),
  })
}

export function useUpdateMaterialCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Parameters<typeof updateMaterialCategory>[1] }) =>
      updateMaterialCategory(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog', 'material-types'] }),
  })
}

export function useDeleteMaterialCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteMaterialCategory,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog', 'material-types'] }),
  })
}
