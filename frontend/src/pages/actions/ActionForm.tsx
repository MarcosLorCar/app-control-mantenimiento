import { useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { useCreateAction, useUpdateAction, useUpdateActionGlobal } from '../../hooks/useActions'
import { useActionTypes } from '../../hooks/useCatalog'
import { useInfrastructures } from '../../hooks/useInfrastructures'
import type { ActionWithRelations } from '../../api/types'

interface Props {
  infrastructureId?: number
  action?: ActionWithRelations
  onClose: () => void
}

export function ActionForm({ infrastructureId, action, onClose }: Props) {
  const isEdit = !!action
  const [actionTypeId, setActionTypeId] = useState(action?.actionTypeId ?? 0)
  const [description, setDescription] = useState(action?.description ?? '')
  const [performedAt, setPerformedAt] = useState(
    action ? action.performedAt.slice(0, 10) : new Date().toISOString().slice(0, 10)
  )
  const [error, setError] = useState('')

  const { data: actionTypes = [] } = useActionTypes()
  const { data: allInfras = [] } = useInfrastructures()
  const [selectedInfraId, setSelectedInfraId] = useState<number | ''>(infrastructureId ?? '')
  const resolvedInfraId = infrastructureId ?? (selectedInfraId === '' ? undefined : Number(selectedInfraId))

  const createMut = useCreateAction(resolvedInfraId ?? 0)
  const updateScoped = useUpdateAction(infrastructureId ?? 0)
  const updateGlobal = useUpdateActionGlobal()
  const updateMut = infrastructureId ? updateScoped : updateGlobal

  const isPending = isEdit ? updateMut.isPending : createMut.isPending

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isEdit && !resolvedInfraId) {
      setError('Selecciona una infraestructura.')
      return
    }
    if (actionTypeId === 0 || !performedAt) {
      setError('Selecciona un tipo de acción y una fecha.')
      return
    }
    setError('')
    const body = {
      actionTypeId,
      description: description || undefined,
      performedAt: new Date(performedAt).toISOString(),
    }
    if (isEdit) {
      updateMut.mutate(
        { id: action!.id, body },
        {
          onSuccess: onClose,
          onError: (err: any) => setError(err?.error?.message ?? 'Error al actualizar'),
        }
      )
    } else {
      createMut.mutate(body, {
        onSuccess: onClose,
        onError: (err: any) => setError(err?.error?.message ?? 'Error al registrar'),
      })
    }
  }

  const inputCls = 'w-full border border-app-border rounded-lg px-3 py-2 text-sm bg-card text-fg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors'

  return (
    <Modal title={isEdit ? 'Editar acción' : 'Registrar acción'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {!infrastructureId && !isEdit && (
          <div>
            <label className="block text-xs font-semibold text-fg-secondary mb-1">
              Infraestructura <span className="text-error">*</span>
            </label>
            <select
              value={selectedInfraId}
              onChange={e => setSelectedInfraId(Number(e.target.value))}
              className={inputCls}
              required
            >
              <option value="">Seleccionar infraestructura...</option>
              {allInfras.map(i => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-fg-secondary mb-1">
            Tipo de acción <span className="text-error">*</span>
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
          <label className="block text-xs font-semibold text-fg-secondary mb-1">Descripción</label>
          <textarea
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            className={inputCls}
            placeholder="Detalles del trabajo realizado..."
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-fg-secondary mb-1">
            Fecha realización <span className="text-error">*</span>
          </label>
          <input
            type="date"
            value={performedAt}
            onChange={e => setPerformedAt(e.target.value)}
            className={inputCls}
          />
        </div>

        {error && <p className="text-error text-sm">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-fg-secondary border border-app-border rounded-lg hover:bg-app-bg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending || (!isEdit && !resolvedInfraId)}
            className="px-4 py-2 text-sm text-primary-fg bg-primary rounded-lg hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors"
          >
            {isPending ? (isEdit ? 'Guardando...' : 'Registrando...') : (isEdit ? 'Guardar' : 'Registrar')}
          </button>
        </div>
      </form>
    </Modal>
  )
}
