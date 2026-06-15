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
        <p className="text-sm text-gray-700">
          Contraseña temporal generada (solo visible ahora):
        </p>
        <div className="flex items-center gap-2">
          <p className="flex-1 font-mono text-sm bg-gray-100 p-3 rounded select-all break-all">
            {tempPassword}
          </p>
          <button
            onClick={handleCopy}
            className="shrink-0 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            {copied ? '¡Copiado!' : 'Copiar'}
          </button>
        </div>
        <p className="text-xs text-gray-500">
          El usuario deberá cambiarla al primer acceso.
        </p>
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={e => setConfirmed(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
          />
          <span className="text-sm text-gray-700">
            He guardado la contraseña en un lugar seguro
          </span>
        </label>
        <button
          onClick={onClose}
          disabled={!confirmed}
          className="w-full px-4 py-2 text-sm text-white bg-primary rounded-lg hover:bg-[var(--primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed"
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

  const inputCls = 'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900'

  if (tempPassword) {
    return <PasswordModal tempPassword={tempPassword} onClose={onClose} />
  }

  return (
    <Modal title="Nuevo usuario" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre completo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            className={inputCls}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rol <span className="text-red-500">*</span>
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

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={createUser.isPending}
            className="px-4 py-2 text-sm text-white bg-primary rounded-lg hover:bg-[var(--primary-hover)] disabled:opacity-50"
          >
            {createUser.isPending ? 'Creando...' : 'Crear'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
