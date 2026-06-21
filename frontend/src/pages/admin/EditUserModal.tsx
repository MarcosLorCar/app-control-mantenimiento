import { useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { useUpdateUser, useDeleteUser } from '../../hooks/useUsers'
import { useRoles } from '../../hooks/useCatalog'
import type { User } from '../../api/types'

interface Props {
  user: User
  isSelf: boolean
  onClose: () => void
}

export function EditUserModal({ user, isSelf, onClose }: Props) {
  const [fullName, setFullName] = useState(user.fullName)
  const [roleId, setRoleId] = useState(user.roleId)
  const [error, setError] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const { data: roles = [] } = useRoles()
  const updateUser = useUpdateUser()
  const deleteUser = useDeleteUser()

  const inputCls = 'w-full border border-app-border bg-card text-fg rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed transition-colors'

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim()) {
      setError('El nombre es obligatorio.')
      return
    }
    setError('')
    const body: { fullName?: string; roleId?: number } = {}
    if (fullName.trim() !== user.fullName) body.fullName = fullName.trim()
    if (!isSelf && roleId !== user.roleId) body.roleId = roleId

    if (Object.keys(body).length === 0) {
      onClose()
      return
    }

    updateUser.mutate(
      { id: user.id, body },
      {
        onSuccess: () => onClose(),
        onError: (err: any) => setError(err?.error?.message ?? 'Error al actualizar usuario'),
      }
    )
  }

  function handleDelete() {
    deleteUser.mutate(user.id, {
      onSuccess: () => onClose(),
      onError: (err: any) => setError(err?.error?.message ?? 'Error al eliminar usuario'),
    })
  }

  return (
    <Modal title="Editar usuario" onClose={onClose}>
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
          <label className="block text-sm font-semibold text-fg-secondary mb-1">Rol</label>
          <select
            value={roleId}
            onChange={e => setRoleId(Number(e.target.value))}
            disabled={isSelf}
            className={inputCls}
          >
            {roles.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          {isSelf && (
            <p className="text-xs text-muted mt-1">No puedes cambiar tu propio rol.</p>
          )}
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
            disabled={updateUser.isPending}
            className="px-4 py-2 text-sm text-primary-fg bg-primary rounded-lg hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors font-semibold"
          >
            {updateUser.isPending ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>

      <div className="mt-6 pt-4 border-t border-error/20">
        <h3 className="text-sm font-bold text-error mb-2">Zona de peligro</h3>
        {isSelf ? (
          <p className="text-xs text-muted">No puedes eliminar tu propia cuenta.</p>
        ) : (
          <div className="border border-error/20 bg-error/5 rounded-lg p-3 space-y-2">
            <p className="text-xs text-error">
              Esta acción desactiva al usuario y lo marca como eliminado. No se puede deshacer desde la interfaz.
            </p>
            {!confirmingDelete ? (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="text-xs font-bold text-error hover:text-red-700 border border-error/25 rounded-lg px-3 py-1.5 hover:bg-error/10 transition-colors"
              >
                Eliminar usuario
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteUser.isPending}
                  className="text-xs font-bold text-white bg-error hover:bg-red-700 rounded-lg px-3 py-1.5 disabled:opacity-50 transition-colors"
                >
                  {deleteUser.isPending ? 'Eliminando...' : 'Confirmar eliminación'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="text-xs text-fg-secondary hover:text-fg font-semibold transition-colors"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
