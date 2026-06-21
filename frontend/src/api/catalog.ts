import { apiFetch, API_BASE } from './client'
import type { Role, InfrastructureType, MaterialType, FixedProperty, SystemSetting } from './types'

type ApiData<T> = { data: T }

// ==================== INFRASTRUCTURE TYPES ====================

export function listInfrastructureTypes(): Promise<InfrastructureType[]> {
  return apiFetch<{ data: InfrastructureType[] }>(`${API_BASE}/infrastructure-types`).then(r => r.data)
}

export function createInfrastructureType(body: {
  name: string
  description?: string
  icon?: string
  color?: string | null
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

// ==================== MATERIAL TYPES ====================

export function listMaterialTypes(infraTypeId?: number | null): Promise<MaterialType[]> {
  const query = infraTypeId ? `?infraTypeId=${infraTypeId}` : ''
  return apiFetch<ApiData<MaterialType[]>>(`${API_BASE}/material-types${query}`).then(r => r.data)
}

export function createMaterialType(body: {
  code: string
  name: string
  description?: string
  icon?: string
  infraTypeId?: number | null
  customAttributes?: any
}): Promise<MaterialType> {
  return apiFetch<ApiData<MaterialType>>(`${API_BASE}/material-types`, {
    method: 'POST',
    body: JSON.stringify(body),
  }).then(r => r.data)
}

export function updateMaterialType(
  id: number,
  body: { name?: string; description?: string; icon?: string | null; customAttributes?: any; categoryIds?: number[] },
): Promise<MaterialType> {
  return apiFetch<ApiData<MaterialType>>(`${API_BASE}/material-types/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }).then(r => r.data)
}

export function deleteMaterialType(id: number): Promise<void> {
  return apiFetch(`${API_BASE}/material-types/${id}`, {
    method: 'DELETE',
  }).then(() => undefined)
}

// ==================== GLOBAL FIXED PROPERTIES ====================

export function listFixedProperties(): Promise<FixedProperty[]> {
  return apiFetch<ApiData<FixedProperty[]>>(`${API_BASE}/fixed-properties`).then(r => r.data)
}

export function createFixedProperty(body: {
  code: string;
  name: string;
  type: 'STRING' | 'DATE' | 'NUMBER' | 'BOOLEAN';
}): Promise<FixedProperty> {
  return apiFetch<ApiData<FixedProperty>>(`${API_BASE}/fixed-properties`, {
    method: 'POST',
    body: JSON.stringify(body),
  }).then(r => r.data)
}

export function deleteFixedProperty(id: number): Promise<void> {
  return apiFetch(`${API_BASE}/fixed-properties/${id}`, { method: 'DELETE' }).then(() => undefined)
}

// ==================== SYSTEM SETTINGS ====================

export function listSystemSettings(): Promise<SystemSetting[]> {
  return apiFetch<ApiData<SystemSetting[]>>(`${API_BASE}/system-settings`).then(r => r.data)
}

export function updateSystemSettings(body: {
  default_latitude: string
  default_longitude: string
  default_location_name: string
}): Promise<SystemSetting[]> {
  return apiFetch<ApiData<SystemSetting[]>>(`${API_BASE}/system-settings`, {
    method: 'POST',
    body: JSON.stringify(body),
  }).then(r => r.data)
}

