import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listActionTypes, listRoles, createActionType, updateActionType,
  listInfrastructureTypes, createInfrastructureType, uploadInfraTypeIcon,
} from '../api/catalog'

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

export function useUpdateActionType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Parameters<typeof updateActionType>[1] }) =>
      updateActionType(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['catalog', 'action-types'] })
      qc.invalidateQueries({ queryKey: ['actions'] })
    },
  })
}

export function useInfrastructureTypes() {
  return useQuery({
    queryKey: ['catalog', 'infrastructure-types'],
    queryFn: listInfrastructureTypes,
    staleTime: Infinity,
  })
}

export function useCreateInfrastructureType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createInfrastructureType,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog', 'infrastructure-types'] }),
  })
}

export function useUploadInfraTypeIcon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) => uploadInfraTypeIcon(id, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['catalog', 'infrastructure-types'] })
      qc.invalidateQueries({ queryKey: ['infrastructures'] })
    },
  })
}
