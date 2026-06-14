import { apiFetch, API_BASE } from './client'
import type { Location, LocationDetail, LocationPhoto } from './types'

type ApiData<T> = { data: T }

export function listLocations(parentId?: number | null, infraTypeId?: number): Promise<Location[]> {
  const params: string[] = []
  if (parentId === null) {
    params.push('parentId=null')
  } else if (parentId !== undefined) {
    params.push(`parentId=${parentId}`)
  }
  if (infraTypeId !== undefined) {
    params.push(`infraTypeId=${infraTypeId}`)
  }
  const query = params.length > 0 ? `?${params.join('&')}` : ''
  const url = `${API_BASE}/locations${query}`
  return apiFetch<ApiData<Location[]>>(url).then(r => r.data)
}

export function getLocation(id: number): Promise<LocationDetail> {
  return apiFetch<ApiData<LocationDetail>>(`${API_BASE}/locations/${id}`).then(r => r.data)
}

export function createLocation(body: {
  code?: string | null
  name: string
  description?: string | null
  type?: string | null
  parentId?: number | null
  infraTypeId?: number | null
}): Promise<Location> {
  return apiFetch<ApiData<Location>>(`${API_BASE}/locations`, {
    method: 'POST',
    body: JSON.stringify(body),
  }).then(r => r.data)
}

export function updateLocation(
  id: number,
  body: {
    code?: string | null
    name?: string
    description?: string | null
    type?: string | null
    parentId?: number | null
    infraTypeId?: number | null
  },
): Promise<Location> {
  return apiFetch<ApiData<Location>>(`${API_BASE}/locations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }).then(r => r.data)
}

export function deleteLocation(id: number): Promise<void> {
  return apiFetch(`${API_BASE}/locations/${id}`, { method: 'DELETE' }).then(() => undefined)
}

export function uploadLocationImage(id: number, file: File): Promise<Location> {
  const formData = new FormData()
  formData.append('file', file)
  return apiFetch<ApiData<Location>>(`${API_BASE}/locations/${id}/image`, {
    method: 'POST',
    body: formData,
  }).then(r => r.data)
}

export function deleteLocationImage(id: number): Promise<Location> {
  return apiFetch<ApiData<Location>>(`${API_BASE}/locations/${id}/image`, {
    method: 'DELETE',
  }).then(r => r.data)
}

export function getLocationGallery(id: number): Promise<LocationPhoto[]> {
  return apiFetch<ApiData<LocationPhoto[]>>(`${API_BASE}/locations/${id}/gallery`).then(r => r.data)
}

export function uploadLocationPhoto(id: number, file: File, date?: string, description?: string): Promise<LocationPhoto> {
  const formData = new FormData()
  if (date) formData.append('takenAt', date)
  if (description) formData.append('description', description)
  formData.append('file', file)
  return apiFetch<ApiData<LocationPhoto>>(`${API_BASE}/locations/${id}/gallery`, {
    method: 'POST',
    body: formData,
  }).then(r => r.data)
}

export function deleteLocationPhoto(photoId: number): Promise<void> {
  return apiFetch(`${API_BASE}/locations/gallery/${photoId}`, {
    method: 'DELETE',
  }).then(() => undefined)
}


