import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listActions, getAction, createAction, updateAction, deleteAction,
  listMaterialActions, listLocationActions,
} from '../api/actions'
import { locationKeys } from './useLocations'

export const actionKeys = {
  all: ['actions'] as const,
  detail: (id: number) => ['actions', id] as const,
  byMaterial: (materialId: number) => ['materials', materialId, 'actions'] as const,
  byLocation: (locationId: number) => ['locations', locationId, 'actions'] as const,
}

export function useActions() {
  return useQuery({ queryKey: actionKeys.all, queryFn: listActions })
}

export function useAction(id: number) {
  return useQuery({ queryKey: actionKeys.detail(id), queryFn: () => getAction(id) })
}

export function useMaterialActions(materialId: number) {
  return useQuery({
    queryKey: actionKeys.byMaterial(materialId),
    queryFn: () => listMaterialActions(materialId),
    enabled: materialId > 0,
  })
}

export function useLocationActions(locationId: number) {
  return useQuery({
    queryKey: actionKeys.byLocation(locationId),
    queryFn: () => listLocationActions(locationId),
    enabled: locationId > 0,
  })
}

export function useCreateAction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Parameters<typeof createAction>[0]) => createAction(body),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: actionKeys.all })
      if (data.materialId) {
        qc.invalidateQueries({ queryKey: actionKeys.byMaterial(data.materialId) })
      }
      if (data.locationId) {
        qc.invalidateQueries({ queryKey: actionKeys.byLocation(data.locationId) })
        qc.invalidateQueries({ queryKey: locationKeys.detail(data.locationId) })
      }
    },
  })
}

export function useUpdateAction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Parameters<typeof updateAction>[1] }) =>
      updateAction(id, body),
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: actionKeys.all })
      qc.invalidateQueries({ queryKey: actionKeys.detail(variables.id) })
      if (data.materialId) {
        qc.invalidateQueries({ queryKey: actionKeys.byMaterial(data.materialId) })
      }
      if (data.locationId) {
        qc.invalidateQueries({ queryKey: actionKeys.byLocation(data.locationId) })
        qc.invalidateQueries({ queryKey: locationKeys.detail(data.locationId) })
      }
    },
  })
}

export function useDeleteAction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteAction(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: actionKeys.all })
      qc.invalidateQueries({ queryKey: locationKeys.all })
    },
  })
}
