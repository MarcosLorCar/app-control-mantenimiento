import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listStructuresByInfra,
  createStructureUnderInfra,
  createStructureUnderDep,
  getStructure,
  updateStructure,
  deleteStructure,
} from '../api/structures'

export const structKeys = {
  all: ['structures'] as const,
  infra: (infraId: number) => ['structures', 'infra', infraId] as const,
  detail: (id: number) => ['structures', id] as const,
}

export function useStructuresByInfra(infraId: number) {
  return useQuery({
    queryKey: structKeys.infra(infraId),
    queryFn: () => listStructuresByInfra(infraId),
    enabled: !!infraId,
  })
}

export function useStructure(id: number) {
  return useQuery({
    queryKey: structKeys.detail(id),
    queryFn: () => getStructure(id),
    enabled: !!id,
  })
}

export function useCreateStructureUnderInfra() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ infraId, body }: { infraId: number; body: { code: string; name: string; description?: string } }) =>
      createStructureUnderInfra(infraId, body),
    onSuccess: (_data, { infraId }) => {
      qc.invalidateQueries({ queryKey: structKeys.infra(infraId) })
    },
  })
}

export function useCreateStructureUnderDep() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ depId, body }: { depId: number; body: { code: string; name: string; description?: string } }) =>
      createStructureUnderDep(depId, body),
    onSuccess: (_data, { depId }) => {
      qc.invalidateQueries({ queryKey: ['dependencies', depId] })
    },
  })
}

export function useUpdateStructure() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: { name?: string; description?: string } }) =>
      updateStructure(id, body),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: structKeys.detail(id) })
    },
  })
}

export function useDeleteStructure() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteStructure(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: structKeys.all })
    },
  })
}
