import { apiFetch, API_BASE } from './client'
import type { Dependency, DependencyWithChildren } from './types'

type ApiData<T> = { data: T }

export function listTopLevelDependencies(infraId: number): Promise<Dependency[]> {
  return apiFetch<ApiData<Dependency[]>>(`${API_BASE}/infrastructures/${infraId}/dependencies`).then(r => r.data)
}

export function getDependency(id: number): Promise<DependencyWithChildren> {
  return apiFetch<ApiData<DependencyWithChildren>>(`${API_BASE}/dependencies/${id}`).then(r => r.data)
}

export function createTopLevelDependency(
  infraId: number,
  body: { code: string; name: string; description?: string },
): Promise<Dependency> {
  return apiFetch<ApiData<Dependency>>(`${API_BASE}/infrastructures/${infraId}/dependencies`, {
    method: 'POST',
    body: JSON.stringify(body),
  }).then(r => r.data)
}

export function createChildDependency(
  parentId: number,
  body: { code: string; name: string; description?: string },
): Promise<Dependency> {
  return apiFetch<ApiData<Dependency>>(`${API_BASE}/dependencies/${parentId}/children`, {
    method: 'POST',
    body: JSON.stringify(body),
  }).then(r => r.data)
}

export function updateDependency(
  id: number,
  body: { name?: string; description?: string },
): Promise<Dependency> {
  return apiFetch<ApiData<Dependency>>(`${API_BASE}/dependencies/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }).then(r => r.data)
}

export function deleteDependency(id: number): Promise<void> {
  return apiFetch(`${API_BASE}/dependencies/${id}`, { method: 'DELETE' }).then(() => undefined)
}
