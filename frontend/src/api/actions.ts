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
  typeId: number
  locationId?: number | null
  latitude?: number | null
  longitude?: number | null
  description?: string
  performedAt?: string
  newLocation?: {
    name: string
    type?: string | null
    parentId?: number | null
    latitude?: number | null
    longitude?: number | null
  } | null
}): Promise<Action> {
  return apiFetch<ApiData<Action>>(`${API_BASE}/actions`, {
    method: 'POST',
    body: JSON.stringify(body),
  }).then(r => r.data)
}

export function updateAction(
  id: number,
  body: { title?: string; description?: string; performedAt?: string },
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

export function associateMaterialToAction(actionId: number, materialId: number): Promise<Action> {
  return apiFetch<ApiData<Action>>(`${API_BASE}/actions/${actionId}/materials`, {
    method: 'POST',
    body: JSON.stringify({ materialId }),
  }).then(r => r.data)
}

export function disassociateMaterialFromAction(actionId: number, materialId: number): Promise<Action> {
  return apiFetch<ApiData<Action>>(`${API_BASE}/actions/${actionId}/materials/${materialId}`, {
    method: 'DELETE',
  }).then(r => r.data)
}
