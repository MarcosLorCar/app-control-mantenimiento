import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listInfrastructures,
  getInfrastructure,
  createInfrastructure,
  updateInfrastructure,
  deleteInfrastructure,
} from '../api/infrastructures'
import type { Infrastructure } from '../api/types'

export const infraKeys = {
  all: ['infrastructures'] as const,
  detail: (id: number) => ['infrastructures', id] as const,
}

export function useInfrastructures() {
  return useQuery({ queryKey: infraKeys.all, queryFn: listInfrastructures })
}

export function useInfrastructure(id: number) {
  return useQuery({ queryKey: infraKeys.detail(id), queryFn: () => getInfrastructure(id) })
}

export function useCreateInfrastructure() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createInfrastructure,
    onSuccess: () => qc.invalidateQueries({ queryKey: infraKeys.all }),
  })
}

export function useUpdateInfrastructure() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Parameters<typeof updateInfrastructure>[1] }) =>
      updateInfrastructure(id, body),
    onSuccess: (_data: Infrastructure, { id }: { id: number }) => {
      qc.invalidateQueries({ queryKey: infraKeys.all })
      qc.invalidateQueries({ queryKey: infraKeys.detail(id) })
    },
  })
}

export function useDeleteInfrastructure() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteInfrastructure,
    onSuccess: () => qc.invalidateQueries({ queryKey: infraKeys.all }),
  })
}
