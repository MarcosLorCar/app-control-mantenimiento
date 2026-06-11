import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { useCreateLocation, useUpdateLocation } from '../../hooks/useLocations'
import { useInfrastructureTypes } from '../../hooks/useCatalog'
import type { Location } from '../../api/types'

interface Props {
  parentId?: number | null
  infraTypeId?: number | null
  existing?: Location
  onClose: () => void
  onSuccess?: (created: Location) => void
}

export function LocationForm({ parentId, infraTypeId, existing, onClose, onSuccess }: Props) {
  const isEdit = !!existing
  const [name, setName] = useState(existing?.name ?? '')
  const [description, setDescription] = useState(existing?.description ?? '')
  const [selectedInfraTypeId, setSelectedInfraTypeId] = useState<number | ''>(
    existing?.infraTypeId ?? infraTypeId ?? ''
  )
  const [error, setError] = useState('')

  const createLoc = useCreateLocation()
  const updateLoc = useUpdateLocation()
  const { data: infraTypes = [] } = useInfrastructureTypes()
  const isPending = createLoc.isPending || updateLoc.isPending

  const inputCls = 'w-full border border-app-border rounded-lg px-3 py-2 text-sm bg-card text-fg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors'

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const body = {
      name: name.trim(),
      description: description.trim() || null,
      infraTypeId: selectedInfraTypeId ? Number(selectedInfraTypeId) : null,
      parentId: isEdit ? existing?.parentId : parentId ?? null,
    }

    if (!body.name) {
      setError('El nombre es obligatorio.')
      return
    }

    if (!body.parentId && !body.infraTypeId) {
      setError('La categoría principal es obligatoria para ubicaciones principales.')
      return
    }

    if (isEdit) {
      updateLoc.mutate(
        { id: existing!.id, body: body as any },
        {
          onSuccess: (data) => {
            if (onSuccess) onSuccess(data)
            onClose()
          },
          onError: (e: any) => setError(e?.error?.message ?? 'Error al actualizar ubicación'),
        }
      )
    } else {
      createLoc.mutate(
        body as any,
        {
          onSuccess: (data) => {
            if (onSuccess) onSuccess(data)
            onClose()
          },
          onError: (e: any) => setError(e?.error?.message ?? 'Error al crear ubicación'),
        }
      )
    }
  }

  return (
    <Modal title={isEdit ? 'Editar ubicación' : 'Nueva ubicación'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-fg-secondary mb-1">Nombre <span className="text-error">*</span></label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nombre de la ubicación"
            className={inputCls}
            required
          />
        </div>

        {(!parentId || (isEdit && !existing?.parentId)) && (
          <div>
            <label className="block text-xs font-semibold text-fg-secondary mb-1">Categoría Principal <span className="text-error">*</span></label>
            <select
              value={selectedInfraTypeId}
              onChange={e => setSelectedInfraTypeId(e.target.value ? Number(e.target.value) : '')}
              className={inputCls}
              required
            >
              <option value="">Seleccionar categoría...</option>
              {infraTypes.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-fg-secondary mb-1">Descripción</label>
          <textarea
            rows={2}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Detalles adicionales..."
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
            disabled={isPending}
            className="px-4 py-2 text-sm text-primary-fg bg-primary rounded-lg hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors"
          >
            {isPending ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
