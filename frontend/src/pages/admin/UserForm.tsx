import { useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { useCreateUser } from '../../hooks/useUsers'
import { useRoles } from '../../hooks/useCatalog'

interface PasswordModalProps {
  tempPassword: string
  onClose: () => void
}

export function PasswordModal({ tempPassword, onClose }: PasswordModalProps) {
  const [copied, setCopied] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(tempPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Modal title="Contraseña temporal" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-fg-secondary">
          Contraseña temporal generada (solo visible ahora):
        </p>
        <div className="flex items-center gap-2">
          <p className="flex-1 font-mono text-sm bg-app-bg p-3 rounded-lg border border-app-border select-all break-all text-fg">
            {tempPassword}
          </p>
          <button
            onClick={handleCopy}
            className="shrink-0 px-3 py-2 text-sm border border-app-border bg-card text-fg-secondary rounded-lg hover:bg-app-bg transition-colors"
          >
            {copied ? '¡Copiado!' : 'Copiar'}
          </button>
        </div>
        <p className="text-xs text-muted">
          El usuario deberá cambiarla al primer acceso.
        </p>
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={e => setConfirmed(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-app-border text-primary focus:ring-primary/40 bg-card"
          />
          <span className="text-sm text-fg-secondary">
            He guardado la contraseña en un lugar seguro
          </span>
        </label>
        <button
          onClick={onClose}
          disabled={!confirmed}
          className="w-full px-4 py-2 text-sm text-primary-fg bg-primary rounded-lg hover:bg-[var(--primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed font-semibold transition-colors"
        >
          Cerrar
        </button>
      </div>
    </Modal>
  )
}

interface Props {
  onClose: () => void
}

export function UserForm({ onClose }: Props) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [roleId, setRoleId] = useState(0)
  const [error, setError] = useState('')
  const [tempPassword, setTempPassword] = useState<string | null>(null)

  const { data: roles = [] } = useRoles()
  const createUser = useCreateUser()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName || !email || roleId === 0) {
      setError('Nombre, email y rol son obligatorios.')
      return
    }
    setError('')
    createUser.mutate(
      { fullName, email, roleId },
      {
        onSuccess: (data) => {
          if (data.tempPassword) setTempPassword(data.tempPassword)
          else onClose()
        },
        onError: (err: any) => setError(err?.error?.message ?? 'Error al crear usuario'),
      }
    )
  }

  const inputCls = 'w-full border border-app-border bg-card text-fg rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors'

  if (tempPassword) {
    return <PasswordModal tempPassword={tempPassword} onClose={onClose} />
  }

  return (
    <Modal title="Nuevo usuario" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-fg-secondary mb-1">
            Nombre completo <span className="text-error">*</span>
          </label>
          <input
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            className={inputCls}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-fg-secondary mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className={inputCls}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-fg-secondary mb-1">
            Rol <span className="text-error">*</span>
          </label>
          <select
            value={roleId}
            onChange={e => setRoleId(Number(e.target.value))}
            className={inputCls}
          >
            <option value={0} disabled>Selecciona un rol</option>
            {roles.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>

        {error && <p className="text-error text-sm">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-fg-secondary border border-app-border rounded-lg hover:bg-app-bg transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={createUser.isPending}
            className="px-4 py-2 text-sm text-primary-fg bg-primary rounded-lg hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors font-semibold"
          >
            {createUser.isPending ? 'Creando...' : 'Crear'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
