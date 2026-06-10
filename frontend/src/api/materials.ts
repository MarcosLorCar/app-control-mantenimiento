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
  name: string
  typeId: number
  attributes?: Record<string, unknown>
  description?: string
  serialNumber?: string
  installedAt?: string
  locationId: number
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

export function listMaterialsByLocation(locationId: number): Promise<Material[]> {
  return apiFetch<ApiData<Material[]>>(`${API_BASE}/locations/${locationId}/materials`).then(r => r.data)
}
