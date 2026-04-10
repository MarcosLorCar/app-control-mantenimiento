import { useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { useCreateAction } from '../../hooks/useActions'
import { useActionTypes } from '../../hooks/useCatalog'

interface Props {
  infrastructureId: number
  onClose: () => void
}

export function ActionForm({ infrastructureId, onClose }: Props) {
  const [actionTypeId, setActionTypeId] = useState(0)
  const [description, setDescription] = useState('')
  const [performedAt, setPerformedAt] = useState(() => new Date().toISOString().slice(0, 10))
  const [error, setError] = useState('')

  const { data: actionTypes = [] } = useActionTypes()
  const createAction = useCreateAction(infrastructureId)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (actionTypeId === 0 || !performedAt) {
      setError('Selecciona un tipo de acción y una fecha.')
      return
    }
    setError('')
    createAction.mutate(
      {
        actionTypeId,
        description: description || undefined,
        performedAt: new Date(performedAt).toISOString(),
      },
      {
        onSuccess: onClose,
        onError: (err: any) => setError(err?.error?.message ?? 'Error al registrar'),
      }
    )
  }

  const inputCls = 'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900'

  return (
    <Modal title="Registrar acción" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de acción <span className="text-red-500">*</span>
          </label>
          <select
            value={actionTypeId}
            onChange={e => setActionTypeId(Number(e.target.value))}
            className={inputCls}
          >
            <option value={0} disabled>Selecciona un tipo</option>
            {actionTypes.map(at => (
              <option key={at.id} value={at.id}>{at.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          <textarea
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            className={inputCls}
            placeholder="Detalles del trabajo realizado..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha realización <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={performedAt}
            onChange={e => setPerformedAt(e.target.value)}
            className={inputCls}
          />
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
            disabled={createAction.isPending}
            className="px-4 py-2 text-sm text-white bg-primary rounded-lg hover:bg-[var(--primary-hover)] disabled:opacity-50"
          >
            {createAction.isPending ? 'Registrando...' : 'Registrar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
