import { useState, FormEvent, useEffect } from 'react'
import { useNavigate, Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../api/client'

function useAuthProviders() {
  return useQuery({
    queryKey: ['auth', 'providers'],
    queryFn: () => apiFetch<{ data: { google: boolean } }>('/api/v1/auth/providers').then(r => r.data),
    staleTime: Infinity,
  })
}

export function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { data: providers } = useAuthProviders()

  useEffect(() => {
    const oauthError = searchParams.get('error')
    if (oauthError === 'not_registered') {
      setError('Tu cuenta de Google no está registrada en el sistema.')
    } else if (oauthError === 'oauth_error') {
      setError('Error al conectar con Google. Inténtalo de nuevo.')
    }
  }, [searchParams])

  if (user) return <Navigate to="/" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err: any) {
      setError(err?.error?.message ?? 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full h-10 border border-app-border rounded-lg px-3 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors'

  return (
    <div className="min-h-screen bg-sidebar-bg flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-xl p-8 w-full max-w-[360px] border border-app-border">
        <div className="mb-8 text-center">
          <img src="/icon.svg" alt="Infragest" className="w-12 h-12 rounded-xl mx-auto mb-4" />
          <h1 className="text-xl font-bold text-fg">INFRAGEST</h1>
          <p className="text-xs text-muted mt-1">Sistema de gestión de infraestructuras</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-fg-secondary">Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              required autoFocus
              className={inputCls}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-fg-secondary">Contraseña</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              required
              className={inputCls}
            />
          </div>
          {error && <p className="text-error text-sm">{error}</p>}
          <div className="pt-1">
            <button
              type="submit" disabled={loading}
              className="w-full h-10 bg-primary text-primary-fg text-sm font-semibold rounded-lg hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors"
            >
              {loading ? 'Entrando...' : 'Iniciar sesión'}
            </button>
          </div>
        </form>
        {providers?.google && (
          <>
            <div className="mt-4 flex items-center gap-3">
              <span className="flex-1 border-t border-app-border" />
              <span className="text-xs text-muted">o</span>
              <span className="flex-1 border-t border-app-border" />
            </div>
            <a
              href="/api/v1/auth/google"
              className="mt-4 w-full h-10 flex items-center justify-center gap-2 border border-app-border rounded-lg text-sm font-medium text-fg hover:bg-sidebar-bg transition-colors"
            >
              <GoogleIcon />
              Iniciar sesión con Google
            </a>
          </>
        )}
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  )
}
