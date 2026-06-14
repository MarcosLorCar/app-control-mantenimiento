// El token vive en memoria — se pierde al recargar (la cookie de refresh lo restaura)
let accessToken: string | null = null

export const API_BASE = '/api/v1'

export function setToken(token: string | null) {
  accessToken = token
}

export function getToken() {
  return accessToken
}

interface RequestOptions extends RequestInit {
  skipAuth?: boolean
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuth, ...fetchOptions } = options

  const headers: Record<string, string> = {
    ...(fetchOptions.body != null && !(fetchOptions.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
    ...(fetchOptions.headers as Record<string, string>),
  }

  if (!skipAuth && accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  const res = await fetch(path, { ...fetchOptions, headers })

  // Token expirado — intentar refresh automático
  if (res.status === 401 && !skipAuth) {
    const refreshed = await tryRefresh()
    if (refreshed) {
      headers['Authorization'] = `Bearer ${accessToken}`
      const retryRes = await fetch(path, { ...fetchOptions, headers })
      if (!retryRes.ok) throw await retryRes.json()
      return retryRes.json() as Promise<T>
    }
    // Refresh falló — limpiar token y dejar que el router redirija
    setToken(null)
    throw { error: { code: 'UNAUTHORIZED', message: 'Sesión expirada' } }
  }

  if (!res.ok) throw await res.json()

  // 204 No Content or empty body — don't try to parse JSON
  const contentType = res.headers.get('content-type') ?? ''
  const contentLength = res.headers.get('content-length')
  if (res.status === 204 || contentLength === '0' || !contentType.includes('application/json')) {
    return undefined as T
  }

  return res.json() as Promise<T>
}

async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, { method: 'POST' })
    if (!res.ok) return false
    const { data } = await res.json() as { data: { accessToken: string } }
    setToken(data.accessToken)
    return true
  } catch {
    return false
  }
}
