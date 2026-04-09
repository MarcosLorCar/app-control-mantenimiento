import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listActionTypes, listRoles, createActionType } from '../api/catalog'

export function useActionTypes() {
  return useQuery({
    queryKey: ['catalog', 'action-types'],
    queryFn: listActionTypes,
    staleTime: Infinity,
  })
}

export function useRoles() {
  return useQuery({
    queryKey: ['catalog', 'roles'],
    queryFn: listRoles,
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
