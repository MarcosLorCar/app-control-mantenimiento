import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { useCreateMaterial } from '../../hooks/useMaterials'
import { useMaterialTypes, useCreateMaterialType, useFixedProperties } from '../../hooks/useCatalog'
import { Eye } from 'lucide-react'
import type { Material } from '../../api/types'

interface Props {
  locationId: number
  onClose: () => void
  onSuccess?: (created: Material) => void
}

export function MaterialForm({ locationId, onClose, onSuccess }: Props) {
  const [name, setName] = useState('')
  const [typeId, setTypeId] = useState<number>(0)
  const [description, setDescription] = useState('')
  const [attributes, setAttributes] = useState<Record<string, any>>({})
  const [showAdvancedAttrs, setShowAdvancedAttrs] = useState(false)
  const [error, setError] = useState('')

  // Inline "nuevo tipo de material" fields
  const [showNewTypeInput, setShowNewTypeInput] = useState(false)
  const [newTypeName, setNewTypeName] = useState('')

  const createMaterialMut = useCreateMaterial()
  const createMaterialTypeMut = useCreateMaterialType()
  const { data: materialTypes = [] } = useMaterialTypes()
  const { data: fixedProperties = [] } = useFixedProperties()

  const [localCreatedTypes, setLocalCreatedTypes] = useState<any[]>([])
  const allMaterialTypes = [...materialTypes, ...localCreatedTypes]

  const isPending = createMaterialMut.isPending || createMaterialTypeMut.isPending
  const inputCls = 'w-full border border-app-border rounded-lg px-3 py-2 text-sm bg-card text-fg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors'

  function handleTypeChange(val: string) {
    if (val === '__new__') {
      setShowNewTypeInput(true)
    } else {
      setShowNewTypeInput(false)
      setTypeId(Number(val))
    }
  }

  function handleCreateType() {
    if (!newTypeName.trim()) return
    const code = newTypeName.trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_')
    createMaterialTypeMut.mutate(
      { code, name: newTypeName.trim() },
      {
        onSuccess: (created) => {
          setLocalCreatedTypes(prev => [...prev, created])
          setTypeId(created.id)
          setNewTypeName('')
          setShowNewTypeInput(false)
        },
        onError: (err: any) => {
          setError(err?.error?.message ?? 'Error al crear tipo de material')
        }
      }
    )
  }

  const handleAttrChange = (code: string, val: any) => {
    setAttributes(prev => ({ ...prev, [code]: val }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('El nombre del material es obligatorio.')
      return
    }

    if (!typeId) {
      setError('El tipo de material es obligatorio.')
      return
    }

    createMaterialMut.mutate(
      {
        name: name.trim(),
        typeId,
        description: description.trim() || undefined,
        attributes,
        locationId,
      },
      {
        onSuccess: (data) => {
          if (onSuccess) onSuccess(data)
          onClose()
        },
        onError: (err: any) => {
          setError(err?.error?.message ?? 'Error al añadir el material')
        }
      }
    )
  }

  return (
    <Modal title="Añadir Material a la Ubicación" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
        <div>
          <label className="block text-xs font-semibold text-fg-secondary mb-1">
            Nombre del Material <span className="text-error">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ej: Bomba Centrífuga Estanque A"
            className={inputCls}
            required
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-fg-secondary mb-1">
            Tipo de Material <span className="text-error">*</span>
          </label>
          <select
            value={showNewTypeInput ? '__new__' : String(typeId || '')}
            onChange={e => handleTypeChange(e.target.value)}
            className={inputCls}
            required
          >
            <option value="">Seleccionar tipo...</option>
            {allMaterialTypes.map(t => (
              <option key={t.id} value={String(t.id)}>{t.name}</option>
            ))}
            <option value="__new__">+ Crear nuevo tipo...</option>
          </select>

          {showNewTypeInput && (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={newTypeName}
                onChange={e => setNewTypeName(e.target.value)}
                placeholder="Nombre del nuevo tipo (ej: Compresor)"
                className={inputCls}
                autoFocus
              />
              <button
                type="button"
                onClick={handleCreateType}
                disabled={!newTypeName.trim() || createMaterialTypeMut.isPending}
                className="px-3 py-2 text-xs text-primary-fg bg-primary rounded-lg disabled:opacity-50 shrink-0 font-semibold"
              >
                Crear
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-fg-secondary mb-1">Descripción / Notas</label>
          <textarea
            rows={2}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Especificaciones técnicas o detalles..."
            className={inputCls}
          />
        </div>



        {error && <p className="text-error text-xs">{error}</p>}

        <div className="flex justify-end gap-3 pt-2 border-t border-app-border/40">
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
            className="px-4 py-2 text-sm text-primary-fg bg-primary rounded-lg hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors font-semibold"
          >
            {isPending ? 'Guardando...' : 'Añadir Material'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
