import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listUsers, getUser, createUser, updateUser, deleteUser, resetUserPassword } from '../api/users'
import type { User } from '../api/types'

export const userKeys = {
  all: ['users'] as const,
  detail: (id: number) => ['users', id] as const,
}

export function useUsers() {
  return useQuery({ queryKey: userKeys.all, queryFn: listUsers })
}

export function useUser(id: number) {
  return useQuery({ queryKey: userKeys.detail(id), queryFn: () => getUser(id) })
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Parameters<typeof createUser>[0]) => createUser(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
  })
}

export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Parameters<typeof updateUser>[1] }) =>
      updateUser(id, body),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: userKeys.all })
      qc.invalidateQueries({ queryKey: userKeys.detail(variables.id) })
    },
  })
}

export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
  })
}

export function useResetUserPassword() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => resetUserPassword(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
  })
}
