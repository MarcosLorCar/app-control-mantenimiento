import { apiFetch, API_BASE } from './client'
import type { Location, LocationDetail } from './types'

type ApiData<T> = { data: T }

export function listLocations(parentId?: number | null): Promise<Location[]> {
  const param = parentId === null ? 'parentId=null' : parentId !== undefined ? `parentId=${parentId}` : ''
  const url = `${API_BASE}/locations${param ? `?${param}` : ''}`
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
