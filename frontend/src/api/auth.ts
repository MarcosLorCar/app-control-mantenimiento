import { apiFetch, setToken, API_BASE } from './client'
import { JwtPayload } from '@control-actions/shared'

interface LoginResponse {
  data: { accessToken: string }
}

export async function login(email: string, password: string): Promise<JwtPayload> {
  const res = await apiFetch<LoginResponse>(`${API_BASE}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    skipAuth: true,
  })
  setToken(res.data.accessToken)
  // Decodificar payload del JWT (sin verificar — el backend ya lo hizo)
  const payload = JSON.parse(atob(res.data.accessToken.split('.')[1])) as JwtPayload
  return payload
}

export async function logout(): Promise<void> {
  await apiFetch(`${API_BASE}/auth/logout`, { method: 'POST' }).catch(() => {})
  setToken(null)
}

export async function restoreSession(): Promise<JwtPayload | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, { method: 'POST' })
    if (!res.ok) return null
    const { data } = await res.json() as { data: { accessToken: string } }
    setToken(data.accessToken)
    return JSON.parse(atob(data.accessToken.split('.')[1])) as JwtPayload
  } catch {
    return null
  }
}
