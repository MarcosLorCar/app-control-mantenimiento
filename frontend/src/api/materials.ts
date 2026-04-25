import { apiFetch, API_BASE } from './client'
import type { Material } from './types'

type ApiData<T> = { data: T }

export function listMaterials(): Promise<Material[]> {
  return apiFetch<ApiData<Material[]>>(`${API_BASE}/materials`).then(r => r.data)
}

export function getMaterial(id: number): Promise<Material> {
  return apiFetch<ApiData<Material>>(`${API_BASE}/materials/${id}`).then(r => r.data)
}

export function createMaterial(body: {
  code: string
  name: string
  typeId: number
  attributes?: Record<string, unknown>
  description?: string
  serialNumber?: string
  installedAt?: string
  structureId?: number
  dependencyId?: number
  infrastructureId?: number
}): Promise<Material> {
  return apiFetch<ApiData<Material>>(`${API_BASE}/materials`, {
    method: 'POST',
    body: JSON.stringify(body),
  }).then(r => r.data)
}

export function updateMaterial(
  id: number,
  body: { name?: string; description?: string; serialNumber?: string; attributes?: Record<string, unknown> },
): Promise<Material> {
  return apiFetch<ApiData<Material>>(`${API_BASE}/materials/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }).then(r => r.data)
}

export function deleteMaterial(id: number): Promise<void> {
  return apiFetch(`${API_BASE}/materials/${id}`, { method: 'DELETE' }).then(() => undefined)
}

export function listMaterialsByInfra(infraId: number): Promise<Material[]> {
  return apiFetch<ApiData<Material[]>>(`${API_BASE}/infrastructures/${infraId}/materials`).then(r => r.data)
}

export function listMaterialsByDependency(depId: number): Promise<Material[]> {
  return apiFetch<ApiData<Material[]>>(`${API_BASE}/dependencies/${depId}/materials`).then(r => r.data)
}

export function listMaterialsByStructure(structId: number): Promise<Material[]> {
  return apiFetch<ApiData<Material[]>>(`${API_BASE}/structures/${structId}/materials`).then(r => r.data)
}
