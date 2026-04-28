import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listTopLevelDependencies,
  getDependency,
  createTopLevelDependency,
  createChildDependency,
  updateDependency,
  deleteDependency,
} from '../api/dependencies'

export const depKeys = {
  all: ['dependencies'] as const,
  infra: (infraId: number) => ['dependencies', 'infra', infraId] as const,
  detail: (id: number) => ['dependencies', id] as const,
}

export function useTopLevelDependencies(infraId: number) {
  return useQuery({
    queryKey: depKeys.infra(infraId),
    queryFn: () => listTopLevelDependencies(infraId),
    enabled: !!infraId,
  })
}

export function useDependency(id: number) {
  return useQuery({
    queryKey: depKeys.detail(id),
    queryFn: () => getDependency(id),
    enabled: !!id,
  })
}

export function useCreateTopLevelDependency() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ infraId, body }: { infraId: number; body: { code: string; name: string; description?: string } }) =>
      createTopLevelDependency(infraId, body),
    onSuccess: (_data, { infraId }) => {
      qc.invalidateQueries({ queryKey: depKeys.infra(infraId) })
    },
  })
}

export function useCreateChildDependency() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ parentId, body }: { parentId: number; body: { code: string; name: string; description?: string } }) =>
      createChildDependency(parentId, body),
    onSuccess: (_data, { parentId }) => {
      qc.invalidateQueries({ queryKey: depKeys.detail(parentId) })
    },
  })
}

export function useUpdateDependency() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: { name?: string; description?: string } }) =>
      updateDependency(id, body),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: depKeys.detail(id) })
    },
  })
}

export function useDeleteDependency() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteDependency(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: depKeys.all })
    },
  })
}
