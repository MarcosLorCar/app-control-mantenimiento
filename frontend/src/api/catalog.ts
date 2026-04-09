import { apiFetch, API_BASE } from './client'
import type { ActionType, Role } from './types'

type ApiData<T> = { data: T }

export function listActionTypes(): Promise<ActionType[]> {
  return apiFetch<ApiData<ActionType[]>>(`${API_BASE}/catalog/action-types`).then(r => r.data)
}

export function listRoles(): Promise<Role[]> {
  return apiFetch<ApiData<Role[]>>(`${API_BASE}/catalog/roles`).then(r => r.data)
}

export function createActionType(body: { name: string; description?: string; consumesMaterials: boolean }): Promise<ActionType> {
  return apiFetch<ApiData<ActionType>>(`${API_BASE}/catalog/action-types`, {
    method: 'POST',
    body: JSON.stringify(body),
  }).then(r => r.data)
}
