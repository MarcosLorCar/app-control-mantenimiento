import { apiFetch, API_BASE } from './client'
import type { User } from './types'

type ApiData<T> = { data: T }

export function listUsers(): Promise<User[]> {
  return apiFetch<ApiData<User[]>>(`${API_BASE}/users`).then(r => r.data)
}

export function getUser(id: number): Promise<User> {
  return apiFetch<ApiData<User>>(`${API_BASE}/users/${id}`).then(r => r.data)
}

export function createUser(body: {
  email: string
  fullName: string
  roleId: number
}): Promise<User & { tempPassword?: string }> {
  return apiFetch<ApiData<User & { tempPassword?: string }>>(`${API_BASE}/users`, {
    method: 'POST',
    body: JSON.stringify(body),
  }).then(r => r.data)
}

export function updateUser(
  id: number,
  body: { email?: string; fullName?: string; roleId?: number; isActive?: boolean },
): Promise<User> {
  return apiFetch<ApiData<User>>(`${API_BASE}/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }).then(r => r.data)
}

export function deleteUser(id: number): Promise<void> {
  return apiFetch(`${API_BASE}/users/${id}`, { method: 'DELETE' }).then(() => undefined)
}
