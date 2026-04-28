import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listActions, getAction, createAction, updateAction, deleteAction, listMaterialActions,
} from '../api/actions'

export const actionKeys = {
  all: ['actions'] as const,
  detail: (id: number) => ['actions', id] as const,
  byMaterial: (materialId: number) => ['materials', materialId, 'actions'] as const,
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
  })
}

export function useCreateAction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createAction,
    onSuccess: () => qc.invalidateQueries({ queryKey: actionKeys.all }),
  })
}

export function useUpdateAction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Parameters<typeof updateAction>[1] }) =>
      updateAction(id, body),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: actionKeys.all })
      qc.invalidateQueries({ queryKey: actionKeys.detail(variables.id) })
    },
  })
}

export function useDeleteAction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteAction,
    onSuccess: () => qc.invalidateQueries({ queryKey: actionKeys.all }),
  })
}
