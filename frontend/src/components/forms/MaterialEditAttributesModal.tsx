import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { useUpdateMaterial } from '../../hooks/useMaterials'
import { useFixedProperties } from '../../hooks/useCatalog'
import { useQueryClient } from '@tanstack/react-query'
import { actionKeys } from '../../hooks/useActions'
import { locationKeys } from '../../hooks/useLocations'
import type { Material } from '../../api/types'

interface Props {
  material: Material
  onClose: () => void
}

export function MaterialEditAttributesModal({ material, onClose }: Props) {
  const { data: fixedProperties = [], isLoading } = useFixedProperties()

  return (
    <Modal title={`Detalles de Material - ${material.name}`} onClose={onClose}>
      {isLoading ? (
        <div className="text-center py-8 text-muted text-sm">Cargando especificaciones...</div>
      ) : (
        <MaterialEditAttributesForm fixedProperties={fixedProperties} material={material} onClose={onClose} />
      )}
    </Modal>
  )
}

function MaterialEditAttributesForm({
  fixedProperties,
  material,
  onClose,
}: {
  fixedProperties: any[]
  material: Material
  onClose: () => void
}) {
  const qc = useQueryClient()
  const updateMaterialMut = useUpdateMaterial()

  const [error, setError] = useState('')
  const [description, setDescription] = useState(material.description ?? '')
  const [attributes, setAttributes] = useState<Record<string, any>>(() => ({ ...material.attributes }))

  const handleAttrChange = (code: string, val: any) => {
    setAttributes(prev => ({ ...prev, [code]: val }))
  }

  const inputCls = 'w-full border border-app-border rounded-lg px-3 py-2 text-sm bg-card text-fg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors'

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    updateMaterialMut.mutate(
      {
        id: material.id,
        body: {
          description: description.trim() || null,
          attributes,
        },
      },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: actionKeys.all })
          qc.invalidateQueries({ queryKey: locationKeys.all })
          if (material.locationId) {
            qc.invalidateQueries({ queryKey: locationKeys.detail(material.locationId) })
          }
          onClose()
        },
        onError: (e: any) => setError(e?.error?.message ?? 'Error al actualizar material'),
      }
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-fg-secondary mb-1">Nombre</label>
        <input
          type="text"
          value={material.name}
          disabled
          className={`${inputCls} bg-app-bg/50 cursor-not-allowed`}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-fg-secondary mb-1">Tipo de Material</label>
        <input
          type="text"
          value={material.type.name}
          disabled
          className={`${inputCls} bg-app-bg/50 cursor-not-allowed`}
        />
      </div>



      <div>
        <label className="block text-xs font-semibold text-fg-secondary mb-1">Descripción / Ficha Técnica</label>
        <textarea
          rows={3}
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Especifica las características técnicas aquí (ej: 12W, 1000 lm, 220V)..."
          className={inputCls}
        />
      </div>

      {fixedProperties.length > 0 && (
        <div className="space-y-3 p-3.5 bg-app-bg/50 rounded-lg border border-app-border">
          <h4 className="text-xs font-bold text-fg-secondary uppercase tracking-wider mb-2">Propiedades Fijas</h4>
          
          {fixedProperties.map(prop => {
            const value = attributes[prop.code] ?? ''
            const label = (
              <label className="block text-[11px] font-semibold text-fg-secondary mb-1">
                {prop.name}
              </label>
            )

            if (prop.type === 'DATE') {
              return (
                <div key={prop.id}>
                  {label}
                  <input
                    type="date"
                    value={value ? value.slice(0, 10) : ''}
                    onChange={e => handleAttrChange(prop.code, e.target.value)}
                    className={inputCls}
                  />
                </div>
              )
            }

            if (prop.type === 'NUMBER') {
              return (
                <div key={prop.id}>
                  {label}
                  <input
                    type="number"
                    value={value}
                    onChange={e => handleAttrChange(prop.code, e.target.value === '' ? undefined : Number(e.target.value))}
                    className={inputCls}
                  />
                </div>
              )
            }

            if (prop.type === 'BOOLEAN') {
              return (
                <div key={prop.id} className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    id={`prop-${prop.code}`}
                    checked={!!value}
                    onChange={e => handleAttrChange(prop.code, e.target.checked)}
                    className="rounded border-app-border text-primary focus:ring-primary/40"
                  />
                  <label htmlFor={`prop-${prop.code}`} className="text-xs font-semibold text-fg-secondary">
                    {prop.name}
                  </label>
                </div>
              )
            }

            return (
              <div key={prop.id}>
                {label}
                <input
                  type="text"
                  value={value}
                  onChange={e => handleAttrChange(prop.code, e.target.value)}
                  className={inputCls}
                  placeholder={`Valor para ${prop.name}`}
                />
              </div>
            )
          })}
        </div>
      )}

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
          disabled={updateMaterialMut.isPending}
          className="px-4 py-2 text-sm text-primary-fg bg-primary rounded-lg disabled:opacity-50 transition-colors"
        >
          {updateMaterialMut.isPending ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}
