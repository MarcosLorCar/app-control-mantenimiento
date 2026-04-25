import { useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { useCreateAction, useUpdateAction } from '../../hooks/useActions'
import { useActionTypes, useActionStatuses } from '../../hooks/useCatalog'
import { useMaterials } from '../../hooks/useMaterials'
import type { Action } from '../../api/types'

interface Props {
  action?: Action
  onClose: () => void
}

export function ActionForm({ action, onClose }: Props) {
  const isEdit = !!action
  const [title, setTitle] = useState(action?.title ?? '')
  const [typeId, setTypeId] = useState(action?.typeId ?? 0)
  const [statusId, setStatusId] = useState(action?.statusId ?? 0)
  const [materialId, setMaterialId] = useState(action?.materialId ?? 0)
  const [description, setDescription] = useState(action?.description ?? '')
  const [performedAt, setPerformedAt] = useState(
    action ? action.performedAt.slice(0, 10) : new Date().toISOString().slice(0, 10)
  )
  const [error, setError] = useState('')

  const { data: actionTypes = [] } = useActionTypes()
  const { data: actionStatuses = [] } = useActionStatuses()
  const { data: materials = [] } = useMaterials()

  const createMut = useCreateAction()
  const updateMut = useUpdateAction()
  const isPending = createMut.isPending || updateMut.isPending

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (isEdit) {
      updateMut.mutate(
        {
          id: action!.id,
          body: {
            title: title || undefined,
            description: description || undefined,
            statusId: statusId || undefined,
            performedAt: new Date(performedAt).toISOString(),
          },
        },
        {
          onSuccess: onClose,
          onError: (err: any) => setError(err?.error?.message ?? 'Error al actualizar'),
        }
      )
    } else {
      if (!title || !typeId || !statusId || !materialId) {
        setError('Completa todos los campos obligatorios.')
        return
      }
      createMut.mutate(
        {
          title,
          typeId,
          statusId,
          materialId,
          description: description || undefined,
          performedAt: new Date(performedAt).toISOString(),
        },
        {
          onSuccess: onClose,
          onError: (err: any) => setError(err?.error?.message ?? 'Error al registrar'),
        }
      )
    }
  }

  const inputCls = 'w-full border border-app-border rounded-lg px-3 py-2 text-sm bg-card text-fg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors'

  return (
    <Modal title={isEdit ? 'Editar acción' : 'Registrar acción'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-fg-secondary mb-1">
            Título <span className="text-error">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            placeholder="Ej: Sustitución de bombilla"
            className={inputCls}
          />
        </div>

        {!isEdit && (
          <div>
            <label className="block text-xs font-semibold text-fg-secondary mb-1">
              Material <span className="text-error">*</span>
            </label>
            <select
              value={materialId}
              onChange={e => setMaterialId(Number(e.target.value))}
              className={inputCls}
              required
            >
              <option value={0}>Seleccionar material...</option>
              {materials.map(m => (
                <option key={m.id} value={m.id}>
                  {m.code} — {m.name} ({m.type.name})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-fg-secondary mb-1">
              Tipo <span className="text-error">*</span>
            </label>
            <select
              value={typeId}
              onChange={e => setTypeId(Number(e.target.value))}
              className={inputCls}
              disabled={isEdit}
              required={!isEdit}
            >
              <option value={0}>Seleccionar tipo...</option>
              {actionTypes.map(at => (
                <option key={at.id} value={at.id}>{at.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-fg-secondary mb-1">
              Estado <span className="text-error">*</span>
            </label>
            <select
              value={statusId}
              onChange={e => setStatusId(Number(e.target.value))}
              className={inputCls}
              required
            >
              <option value={0}>Seleccionar estado...</option>
              {actionStatuses.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
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
            disabled={isPending}
            className="px-4 py-2 text-sm text-primary-fg bg-primary rounded-lg hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors"
          >
            {isPending ? (isEdit ? 'Guardando...' : 'Registrando...') : (isEdit ? 'Guardar' : 'Registrar')}
          </button>
        </div>
      </form>
    </Modal>
  )
}
