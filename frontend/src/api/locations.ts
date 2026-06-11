import { apiFetch, API_BASE } from './client'
import type { Location, LocationDetail } from './types'

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
