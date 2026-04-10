import { useState, FormEvent } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { Warehouse } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4">
            <Warehouse className="w-6 h-6 text-white" />
          </div>
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
      </div>
    </div>
  )
}
