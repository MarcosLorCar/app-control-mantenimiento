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

  const inputCls = 'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:opacity-60 disabled:cursor-not-allowed'

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
          <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
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
            <p className="text-xs text-gray-400 mt-1">No puedes cambiar tu propio rol.</p>
          )}
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
            disabled={updateUser.isPending}
            className="px-4 py-2 text-sm text-white bg-primary rounded-lg hover:bg-[var(--primary-hover)] disabled:opacity-50"
          >
            {updateUser.isPending ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>

      <div className="mt-6 pt-4 border-t border-red-200">
        <h3 className="text-sm font-semibold text-red-600 mb-2">Zona de peligro</h3>
        {isSelf ? (
          <p className="text-xs text-gray-400">No puedes eliminar tu propia cuenta.</p>
        ) : (
          <div className="border border-red-200 bg-red-50 rounded-md p-3 space-y-2">
            <p className="text-xs text-red-700">
              Esta acción desactiva al usuario y lo marca como eliminado. No se puede deshacer desde la interfaz.
            </p>
            {!confirmingDelete ? (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="text-xs font-semibold text-red-600 hover:text-red-800 border border-red-300 rounded-md px-3 py-1.5 hover:bg-red-100"
              >
                Eliminar usuario
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteUser.isPending}
                  className="text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md px-3 py-1.5 disabled:opacity-50"
                >
                  {deleteUser.isPending ? 'Eliminando...' : 'Confirmar eliminación'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="text-xs text-gray-600 hover:text-gray-800"
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
