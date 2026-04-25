import { apiFetch, API_BASE } from './client'
import type { Role, ActionType, ActionStatus, MaterialType, MaterialCategory } from './types'

type ApiData<T> = { data: T }

// ==================== ROLES ====================

export function listRoles(): Promise<Role[]> {
  return apiFetch<ApiData<Role[]>>(`${API_BASE}/roles`).then(r => r.data)
}

// ==================== ACTION TYPES ====================

export function listActionTypes(): Promise<ActionType[]> {
  return apiFetch<ApiData<ActionType[]>>(`${API_BASE}/action-types`).then(r => r.data)
}

export function createActionType(body: {
  code: string
  name: string
  description?: string
  icon?: string
  color?: string
}): Promise<ActionType> {
  return apiFetch<ApiData<ActionType>>(`${API_BASE}/action-types`, {
    method: 'POST',
    body: JSON.stringify(body),
  }).then(r => r.data)
}

export function updateActionType(
  id: number,
  body: { name?: string; description?: string; icon?: string | null; color?: string | null },
): Promise<ActionType> {
  return apiFetch<ApiData<ActionType>>(`${API_BASE}/action-types/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }).then(r => r.data)
}

// ==================== ACTION STATUSES ====================

export function listActionStatuses(): Promise<ActionStatus[]> {
  return apiFetch<ApiData<ActionStatus[]>>(`${API_BASE}/action-statuses`).then(r => r.data)
}

export function createActionStatus(body: {
  code: string
  name: string
  isTerminal?: boolean
  color?: string
  sortOrder: number
}): Promise<ActionStatus> {
  return apiFetch<ApiData<ActionStatus>>(`${API_BASE}/action-statuses`, {
    method: 'POST',
    body: JSON.stringify(body),
  }).then(r => r.data)
}

export function updateActionStatus(
  id: number,
  body: { name?: string; color?: string | null; isTerminal?: boolean; sortOrder?: number },
): Promise<ActionStatus> {
  return apiFetch<ApiData<ActionStatus>>(`${API_BASE}/action-statuses/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }).then(r => r.data)
}

// ==================== MATERIAL TYPES ====================

export function listMaterialTypes(): Promise<MaterialType[]> {
  return apiFetch<ApiData<MaterialType[]>>(`${API_BASE}/material-types`).then(r => r.data)
}

export function createMaterialType(body: {
  code: string
  name: string
  description?: string
  icon?: string
}): Promise<MaterialType> {
  return apiFetch<ApiData<MaterialType>>(`${API_BASE}/material-types`, {
    method: 'POST',
    body: JSON.stringify(body),
  }).then(r => r.data)
}

export function updateMaterialType(
  id: number,
  body: { name?: string; description?: string; icon?: string | null },
): Promise<MaterialType> {
  return apiFetch<ApiData<MaterialType>>(`${API_BASE}/material-types/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }).then(r => r.data)
}

// ==================== MATERIAL CATEGORIES ====================

export function listMaterialCategories(materialTypeId: number): Promise<MaterialCategory[]> {
  return apiFetch<ApiData<MaterialCategory[]>>(
    `${API_BASE}/material-types/${materialTypeId}/categories`,
  ).then(r => r.data)
}

export function createMaterialCategory(
  materialTypeId: number,
  body: {
    code: string
    name: string
    dataType: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'DATE' | 'ENUM'
    unit?: string
    required?: boolean
    sortOrder?: number
    enumValues?: string[]
  },
): Promise<MaterialCategory> {
  return apiFetch<ApiData<MaterialCategory>>(
    `${API_BASE}/material-types/${materialTypeId}/categories`,
    { method: 'POST', body: JSON.stringify(body) },
  ).then(r => r.data)
}

export function updateMaterialCategory(
  id: number,
  body: { name?: string; unit?: string | null; required?: boolean; sortOrder?: number },
): Promise<MaterialCategory> {
  return apiFetch<ApiData<MaterialCategory>>(`${API_BASE}/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }).then(r => r.data)
}

export function deleteMaterialCategory(id: number): Promise<void> {
  return apiFetch(`${API_BASE}/categories/${id}`, { method: 'DELETE' }).then(() => undefined)
}
