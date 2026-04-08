import { useQuery } from '@tanstack/react-query'
import { listActionTypes, listRoles } from '../api/catalog'

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
