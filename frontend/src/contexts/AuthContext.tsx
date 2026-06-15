import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { JwtPayload } from '@infragest/shared'
import { login as apiLogin, logout as apiLogout, restoreSession } from '../api/auth'

interface AuthContextValue {
  user: JwtPayload | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<JwtPayload | null>(null)
  const [loading, setLoading] = useState(true)

  // Al montar, intentar restaurar sesión con la cookie de refresh
  useEffect(() => {
    restoreSession()
      .then(setUser)
      .finally(() => setLoading(false))
  }, [])

  async function login(email: string, password: string) {
    const payload = await apiLogin(email, password)
    setUser(payload)
  }

  async function logout() {
    await apiLogout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
