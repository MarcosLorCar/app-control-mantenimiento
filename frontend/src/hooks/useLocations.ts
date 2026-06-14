import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listLocations,
  getLocation,
  createLocation,
  updateLocation,
  deleteLocation,
  uploadLocationImage,
  deleteLocationImage,
  getLocationGallery,
  uploadLocationPhoto,
  deleteLocationPhoto,
} from '../api/locations'

export const locationKeys = {
  all: ['locations'] as const,
  lists: () => [...locationKeys.all, 'list'] as const,
  list: (parentId?: number | null, infraTypeId?: number) => [
    ...locationKeys.lists(),
    {
      parentId: parentId === undefined ? 'all' : parentId,
      infraTypeId: infraTypeId === undefined ? 'all' : infraTypeId
    }
  ] as const,
  details: () => [...locationKeys.all, 'detail'] as const,
  detail: (id: number) => [...locationKeys.details(), id] as const,
  gallery: (id: number) => [...locationKeys.detail(id), 'gallery'] as const,
}

export function useLocations(parentId?: number | null, infraTypeId?: number) {
  return useQuery({
    queryKey: locationKeys.list(parentId, infraTypeId),
    queryFn: () => listLocations(parentId, infraTypeId),
  })
}

export function useLocation(id: number) {
  return useQuery({
    queryKey: locationKeys.detail(id),
    queryFn: () => getLocation(id),
    enabled: !!id && !isNaN(id),
  })
}

export function useCreateLocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Parameters<typeof createLocation>[0]) => createLocation(body),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: locationKeys.lists() })
      if (data.parentId) {
        qc.invalidateQueries({ queryKey: locationKeys.detail(data.parentId) })
      }
    },
  })
}

export function useUpdateLocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Parameters<typeof updateLocation>[1] }) =>
      updateLocation(id, body),
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: locationKeys.lists() })
      qc.invalidateQueries({ queryKey: locationKeys.detail(variables.id) })
      if (data.parentId) {
        qc.invalidateQueries({ queryKey: locationKeys.detail(data.parentId) })
      }
    },
  })
}

export function useDeleteLocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteLocation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: locationKeys.all })
    },
  })
}

export function useUploadLocationImage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) => uploadLocationImage(id, file),
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: locationKeys.lists() })
      qc.invalidateQueries({ queryKey: locationKeys.detail(variables.id) })
      if (data.parentId) {
        qc.invalidateQueries({ queryKey: locationKeys.detail(data.parentId) })
      }
    },
  })
}

export function useDeleteLocationImage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteLocationImage(id),
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: locationKeys.lists() })
      qc.invalidateQueries({ queryKey: locationKeys.detail(variables) })
      if (data.parentId) {
        qc.invalidateQueries({ queryKey: locationKeys.detail(data.parentId) })
      }
    },
  })
}

export function useLocationGallery(id: number) {
  return useQuery({
    queryKey: locationKeys.gallery(id),
    queryFn: () => getLocationGallery(id),
  })
}

export function useUploadLocationPhoto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, file, date, description }: { id: number; file: File; date?: string; description?: string }) =>
      uploadLocationPhoto(id, file, date, description),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: locationKeys.all })
    },
  })
}

export function useDeleteLocationPhoto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ locationId, photoId }: { locationId: number; photoId: number }) => deleteLocationPhoto(photoId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: locationKeys.all })
    },
  })
}


