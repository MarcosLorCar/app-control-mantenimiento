import { apiFetch, API_BASE } from './client'
import type { Action } from './types'

type ApiData<T> = { data: T }

export function listActions(): Promise<Action[]> {
  return apiFetch<ApiData<Action[]>>(`${API_BASE}/actions`).then(r => r.data)
}

export function getAction(id: number): Promise<Action> {
  return apiFetch<ApiData<Action>>(`${API_BASE}/actions/${id}`).then(r => r.data)
}

export function createAction(body: {
  title: string
  locationId?: number | null
  latitude?: number | null
  longitude?: number | null
  description?: string | null
  performedAt?: string
  newLocation?: {
    name: string
    type?: string | null
    parentId?: number | null
    latitude?: number | null
    longitude?: number | null
    infraTypeId?: number | null
  } | null
  materials?: {
    materialId?: number
    name?: string
    typeId?: number
    description?: string | null
    attributes?: Record<string, any>
    locationId?: number | null
    operation: 'INSTALL' | 'UNINSTALL' | 'UPDATE'
  }[]
}): Promise<Action> {
  return apiFetch<ApiData<Action>>(`${API_BASE}/actions`, {
    method: 'POST',
    body: JSON.stringify(body),
  }).then(r => r.data)
}

export function updateAction(
  id: number,
  body: { title?: string; description?: string | null; performedAt?: string },
): Promise<Action> {
  return apiFetch<ApiData<Action>>(`${API_BASE}/actions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }).then(r => r.data)
}

export function deleteAction(id: number): Promise<void> {
  return apiFetch(`${API_BASE}/actions/${id}`, { method: 'DELETE' }).then(() => undefined)
}

export function listMaterialActions(materialId: number): Promise<Action[]> {
  return apiFetch<ApiData<Action[]>>(`${API_BASE}/materials/${materialId}/actions`).then(r => r.data)
}

export function listLocationActions(locationId: number): Promise<Action[]> {
  return apiFetch<ApiData<Action[]>>(`${API_BASE}/locations/${locationId}/actions`).then(r => r.data)
}

export function uploadActionPhoto(actionId: number, file: File): Promise<any> {
  const formData = new FormData()
  formData.append('file', file)
  return apiFetch<ApiData<any>>(`${API_BASE}/actions/${actionId}/image`, {
    method: 'POST',
    body: formData,
  }).then(r => r.data)
}

