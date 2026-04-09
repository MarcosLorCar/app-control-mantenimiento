import { apiFetch, API_BASE } from './client'
import type { ActionWithRelations, ActionMaterial } from './types'

type ApiData<T> = { data: T }

export function listActions(infraId: number): Promise<ActionWithRelations[]> {
  return apiFetch<ApiData<ActionWithRelations[]>>(`${API_BASE}/infrastructures/${infraId}/actions`).then(r => r.data)
}

export function getAction(id: number): Promise<ActionWithRelations> {
  return apiFetch<ApiData<ActionWithRelations>>(`${API_BASE}/actions/${id}`).then(r => r.data)
}

export function createAction(
  infraId: number,
  body: { actionTypeId: number; description?: string; performedAt?: string },
): Promise<ActionWithRelations> {
  return apiFetch<ApiData<ActionWithRelations>>(`${API_BASE}/infrastructures/${infraId}/actions`, {
    method: 'POST',
    body: JSON.stringify(body),
  }).then(r => r.data)
}

export function updateAction(
  id: number,
  body: { actionTypeId?: number; description?: string; performedAt?: string },
): Promise<ActionWithRelations> {
  return apiFetch<ApiData<ActionWithRelations>>(`${API_BASE}/actions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }).then(r => r.data)
}

export function deleteAction(id: number): Promise<void> {
  return apiFetch(`${API_BASE}/actions/${id}`, { method: 'DELETE' }).then(() => undefined)
}

export function listMaterials(actionId: number): Promise<ActionMaterial[]> {
  return apiFetch<ApiData<ActionMaterial[]>>(`${API_BASE}/actions/${actionId}/materials`).then(r => r.data)
}

export function createMaterial(
  actionId: number,
  body: {
    name: string
    unit: string
    quantity: number
    description?: string
    unitCost?: number
    supplier?: string
    notes?: string
  },
): Promise<ActionMaterial> {
  return apiFetch<ApiData<ActionMaterial>>(`${API_BASE}/actions/${actionId}/materials`, {
    method: 'POST',
    body: JSON.stringify(body),
  }).then(r => r.data)
}

export function updateMaterial(
  id: number,
  body: {
    name?: string
    unit?: string
    quantity?: number
    description?: string
    unitCost?: number
    supplier?: string
    notes?: string
  },
): Promise<ActionMaterial> {
  return apiFetch<ApiData<ActionMaterial>>(`${API_BASE}/materials/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }).then(r => r.data)
}

export function deleteMaterial(id: number): Promise<void> {
  return apiFetch(`${API_BASE}/materials/${id}`, { method: 'DELETE' }).then(() => undefined)
}
