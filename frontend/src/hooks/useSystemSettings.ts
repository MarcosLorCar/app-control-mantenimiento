import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listSystemSettings, updateSystemSettings } from '../api/catalog'

export function useSystemSettings() {
  return useQuery({
    queryKey: ['catalog', 'system-settings'],
    queryFn: listSystemSettings,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useUpdateSystemSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: updateSystemSettings,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['catalog', 'system-settings'] })
    },
  })
}
