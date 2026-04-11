import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listActions, listAllActions, getAction, createAction, updateAction, deleteAction,
  listMaterials, listAllMaterials, createMaterial, updateMaterial, deleteMaterial,
} from '../api/actions'
import type { ActionWithRelations, ActionMaterial, ActionWithInfra, MaterialWithAction } from '../api/types'

export const actionKeys = {
  byInfra: (infraId: number) => ['actions', 'infra', infraId] as const,
  detail: (id: number) => ['actions', id] as const,
  materials: (actionId: number) => ['actions', actionId, 'materials'] as const,
  all: () => ['actions', 'all'] as const,
  allMaterials: () => ['materials', 'all'] as const,
}

export function useActions(infraId: number) {
  return useQuery({ queryKey: actionKeys.byInfra(infraId), queryFn: () => listActions(infraId) })
}

export function useAction(id: number) {
  return useQuery({ queryKey: actionKeys.detail(id), queryFn: () => getAction(id) })
}

export function useCreateAction(infraId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Parameters<typeof createAction>[1]) => createAction(infraId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: actionKeys.byInfra(infraId) }),
  })
}

export function useUpdateAction(infraId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Parameters<typeof updateAction>[1] }) =>
      updateAction(id, body),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: actionKeys.byInfra(infraId) })
      qc.invalidateQueries({ queryKey: actionKeys.detail(variables.id) })
    },
  })
}

export function useDeleteAction(infraId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteAction(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: actionKeys.byInfra(infraId) }),
  })
}

export function useMaterials(actionId: number) {
  return useQuery({ queryKey: actionKeys.materials(actionId), queryFn: () => listMaterials(actionId) })
}

export function useCreateMaterial(actionId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Parameters<typeof createMaterial>[1]) => createMaterial(actionId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: actionKeys.materials(actionId) }),
  })
}

export function useUpdateMaterial(actionId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Parameters<typeof updateMaterial>[1] }) =>
      updateMaterial(id, body),
    onSuccess: (_data: ActionMaterial) => {
      qc.invalidateQueries({ queryKey: actionKeys.materials(actionId) })
    },
  })
}

export function useDeleteMaterial(actionId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteMaterial(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: actionKeys.materials(actionId) }),
  })
}

export function useDeleteActionGlobal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteAction(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: actionKeys.all() })
      qc.invalidateQueries({ queryKey: ['actions', 'infra'] })
    },
  })
}

export function useUpdateActionGlobal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Parameters<typeof updateAction>[1] }) =>
      updateAction(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: actionKeys.all() }),
  })
}

export function useAllActions() {
  return useQuery<ActionWithInfra[]>({
    queryKey: actionKeys.all(),
    queryFn: listAllActions,
  })
}

export function useAllMaterials() {
  return useQuery<MaterialWithAction[]>({
    queryKey: actionKeys.allMaterials(),
    queryFn: listAllMaterials,
  })
}
