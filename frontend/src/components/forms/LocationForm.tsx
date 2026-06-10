import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { useCreateLocation, useUpdateLocation } from '../../hooks/useLocations'
import { useInfrastructureTypes } from '../../hooks/useCatalog'
import type { Location } from '../../api/types'

interface Props {
  parentId?: number | null
  existing?: Location
  onClose: () => void
}

export function LocationForm({ parentId, existing, onClose }: Props) {
  const isEdit = !!existing
  const [code, setCode] = useState(existing?.code ?? '')
  const [name, setName] = useState(existing?.name ?? '')
  const [description, setDescription] = useState(existing?.description ?? '')
  const [type, setType] = useState(existing?.type ?? 'FOLDER')
  const [infraTypeId, setInfraTypeId] = useState<number | ''>(existing?.infraTypeId ?? '')
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
      code: code.trim() || null,
      name: name.trim(),
      description: description.trim() || null,
      type: type || null,
      infraTypeId: infraTypeId ? Number(infraTypeId) : null,
      parentId: isEdit ? existing?.parentId : parentId ?? null,
    }

    if (!body.name) {
      setError('El nombre es obligatorio.')
      return
    }

    if (isEdit) {
      updateLoc.mutate(
        { id: existing!.id, body },
        {
          onSuccess: onClose,
          onError: (e: any) => setError(e?.error?.message ?? 'Error al actualizar ubicación'),
        }
      )
    } else {
      createLoc.mutate(
        body,
        {
          onSuccess: onClose,
          onError: (e: any) => setError(e?.error?.message ?? 'Error al crear ubicación'),
        }
      )
    }
  }

  return (
    <Modal title={isEdit ? 'Editar ubicación' : 'Nueva ubicación'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-fg-secondary mb-1">Código</label>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="Ej: LOC-001"
              className={inputCls}
            />
          </div>
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
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-fg-secondary mb-1">Tipo de ubicación</label>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className={inputCls}
            >
              <option value="FOLDER">Carpeta / Dependencia</option>
              <option value="INFRASTRUCTURE">Infraestructura Principal</option>
              <option value="BUILDING">Edificio</option>
              <option value="ROOM">Sala / Habitación</option>
              <option value="STRUCTURE">Poste / Farola / Equipamiento</option>
            </select>
          </div>

          {(!parentId || (isEdit && !existing?.parentId)) && (
            <div>
              <label className="block text-xs font-semibold text-fg-secondary mb-1">Categoría Principal (Opcional)</label>
              <select
                value={infraTypeId}
                onChange={e => setInfraTypeId(e.target.value ? Number(e.target.value) : '')}
                className={inputCls}
              >
                <option value="">Ninguna</option>
                {infraTypes.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

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
            {isPending ? 'Guardando...' : isEdit ? 'Guardar' : 'Crear'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
