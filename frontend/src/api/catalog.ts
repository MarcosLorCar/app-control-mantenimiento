import { apiFetch, API_BASE } from './client'
import type { Role, InfrastructureType, ActionType, MaterialType, MaterialCategory } from './types'

type ApiData<T> = { data: T }

// ==================== INFRASTRUCTURE TYPES ====================

export function listInfrastructureTypes(): Promise<InfrastructureType[]> {
  return apiFetch<{ data: InfrastructureType[] }>(`${API_BASE}/infrastructure-types`).then(r => r.data)
}

export function createInfrastructureType(body: {
  name: string
  description?: string
  icon?: string
  color?: string
}): Promise<InfrastructureType> {
  return apiFetch<{ data: InfrastructureType }>(`${API_BASE}/infrastructure-types`, {
    method: 'POST',
    body: JSON.stringify(body),
  }).then(r => r.data)
}

export function updateInfrastructureType(
  id: number,
  body: { name?: string; description?: string; icon?: string | null; color?: string | null },
): Promise<InfrastructureType> {
  return apiFetch<{ data: InfrastructureType }>(`${API_BASE}/infrastructure-types/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }).then(r => r.data)
}

export function deleteInfrastructureType(id: number): Promise<void> {
  return apiFetch(`${API_BASE}/infrastructure-types/${id}`, { method: 'DELETE' }).then(() => undefined)
}

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
