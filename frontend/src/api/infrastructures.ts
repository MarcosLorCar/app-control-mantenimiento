import { apiFetch, API_BASE } from './client'
import type { Infrastructure } from './types'

type ApiData<T> = { data: T }

export function listInfrastructures(): Promise<Infrastructure[]> {
  return apiFetch<ApiData<Infrastructure[]>>(`${API_BASE}/infrastructures`).then(r => r.data)
}

export function getInfrastructure(id: number): Promise<Infrastructure> {
  return apiFetch<ApiData<Infrastructure>>(`${API_BASE}/infrastructures/${id}`).then(r => r.data)
}

export function createInfrastructure(body: {
  name: string
  description?: string
  location?: string
}): Promise<Infrastructure> {
  return apiFetch<ApiData<Infrastructure>>(`${API_BASE}/infrastructures`, {
    method: 'POST',
    body: JSON.stringify(body),
  }).then(r => r.data)
}

export function updateInfrastructure(
  id: number,
  body: { name?: string; description?: string; location?: string },
): Promise<Infrastructure> {
  return apiFetch<ApiData<Infrastructure>>(`${API_BASE}/infrastructures/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }).then(r => r.data)
}

export function deleteInfrastructure(id: number): Promise<void> {
  return apiFetch(`${API_BASE}/infrastructures/${id}`, { method: 'DELETE' }).then(() => undefined)
}
