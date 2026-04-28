import { apiFetch, API_BASE } from './client'
import type { Structure } from './types'

type ApiData<T> = { data: T }

export function listStructuresByInfra(infraId: number): Promise<Structure[]> {
  return apiFetch<ApiData<Structure[]>>(`${API_BASE}/infrastructures/${infraId}/structures`).then(r => r.data)
}

export function createStructureUnderInfra(
  infraId: number,
  body: { code: string; name: string; description?: string },
): Promise<Structure> {
  return apiFetch<ApiData<Structure>>(`${API_BASE}/infrastructures/${infraId}/structures`, {
    method: 'POST',
    body: JSON.stringify(body),
  }).then(r => r.data)
}

export function createStructureUnderDep(
  depId: number,
  body: { code: string; name: string; description?: string },
): Promise<Structure> {
  return apiFetch<ApiData<Structure>>(`${API_BASE}/dependencies/${depId}/structures`, {
    method: 'POST',
    body: JSON.stringify(body),
  }).then(r => r.data)
}

export function getStructure(id: number): Promise<Structure> {
  return apiFetch<ApiData<Structure>>(`${API_BASE}/structures/${id}`).then(r => r.data)
}

export function updateStructure(
  id: number,
  body: { name?: string; description?: string },
): Promise<Structure> {
  return apiFetch<ApiData<Structure>>(`${API_BASE}/structures/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }).then(r => r.data)
}

export function deleteStructure(id: number): Promise<void> {
  return apiFetch(`${API_BASE}/structures/${id}`, { method: 'DELETE' }).then(() => undefined)
}
