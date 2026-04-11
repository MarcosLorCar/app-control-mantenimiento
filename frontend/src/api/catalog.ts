import { apiFetch, API_BASE, getToken } from './client'
import type { ActionType, Role, InfrastructureType } from './types'

type ApiData<T> = { data: T }

export function listActionTypes(): Promise<ActionType[]> {
  return apiFetch<ApiData<ActionType[]>>(`${API_BASE}/catalog/action-types`).then(r => r.data)
}

export function listRoles(): Promise<Role[]> {
  return apiFetch<ApiData<Role[]>>(`${API_BASE}/catalog/roles`).then(r => r.data)
}

export function createActionType(body: {
  name: string
  description?: string
  consumesMaterials: boolean
  icon?: string
  color?: string
}): Promise<ActionType> {
  return apiFetch<ApiData<ActionType>>(`${API_BASE}/catalog/action-types`, {
    method: 'POST',
    body: JSON.stringify(body),
  }).then(r => r.data)
}

export function updateActionType(id: number, body: {
  name?: string
  description?: string
  consumesMaterials?: boolean
  icon?: string | null
  color?: string | null
}): Promise<ActionType> {
  return apiFetch<ApiData<ActionType>>(`${API_BASE}/catalog/action-types/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }).then(r => r.data)
}

export function listInfrastructureTypes(): Promise<InfrastructureType[]> {
  return apiFetch<ApiData<InfrastructureType[]>>(`${API_BASE}/catalog/infrastructure-types`).then(r => r.data)
}

export function createInfrastructureType(body: { name: string; description?: string }): Promise<InfrastructureType> {
  return apiFetch<ApiData<InfrastructureType>>(`${API_BASE}/catalog/infrastructure-types`, {
    method: 'POST',
    body: JSON.stringify(body),
  }).then(r => r.data)
}

export async function uploadInfraTypeIcon(id: number, file: File): Promise<InfrastructureType> {
  const formData = new FormData()
  formData.append('file', file)
  const token = getToken()
  const res = await fetch(`${API_BASE}/catalog/infrastructure-types/${id}/icon`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })
  if (!res.ok) throw await res.json()
  const { data } = await res.json()
  return data
}
