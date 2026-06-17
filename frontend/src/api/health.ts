import { API_BASE, apiFetch } from './client'

export interface HealthInfo {
  status: string
  version: string
}

export function getHealth(): Promise<HealthInfo> {
  return apiFetch<HealthInfo>(`${API_BASE}/health`, { skipAuth: true })
}
