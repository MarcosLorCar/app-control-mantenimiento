import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { changePassword } from '../api/auth'
import { useAuth } from '../hooks/useAuth'

export function ChangePassword() {
  const { user, logout } = useAuth()
  const isFirstTime = user?.must_change_password ?? true

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [isPending, setIsPending] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (newPassword !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setError('')
    setIsPending(true)
    try {
      await changePassword(newPassword, isFirstTime ? undefined : currentPassword)
      await logout()
      navigate('/login')
    } catch (err: any) {
      setError(err?.error?.message ?? 'Error al cambiar la contraseña.')
    } finally {
      setIsPending(false)
    }
  }

  const inputCls = 'w-full border border-app-border rounded-lg px-3 py-2 text-sm bg-card text-fg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors'

  return (
    <div className="min-h-screen flex items-center justify-center bg-app-bg text-fg">
      <div className="bg-card border border-app-border rounded-2xl shadow-xl p-8 w-full max-w-md">
        <h1 className="text-xl font-bold text-fg mb-1">
          {isFirstTime ? 'Establece tu contraseña' : 'Cambiar contraseña'}
        </h1>
        <p className="text-sm text-muted mb-6">
          {isFirstTime
            ? 'Tu cuenta requiere que establezcas una nueva contraseña antes de continuar.'
            : 'Ingresa tu contraseña actual y luego la nueva.'}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isFirstTime && (
            <div>
              <label className="block text-sm font-medium text-fg-secondary mb-1">Contraseña actual</label>
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className={inputCls}
                autoFocus
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-fg-secondary mb-1">Nueva contraseña</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className={inputCls}
              autoFocus={isFirstTime}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-fg-secondary mb-1">Confirmar contraseña</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className={inputCls}
            />
          </div>
          {error && <p className="text-error text-sm">{error}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="w-full px-4 py-2 text-sm text-primary-fg bg-primary rounded-lg hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors font-semibold"
          >
            {isPending ? 'Guardando...' : 'Guardar contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}
