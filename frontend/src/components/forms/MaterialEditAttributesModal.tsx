import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { useUpdateMaterial, useDeleteMaterial } from '../../hooks/useMaterials'
import { useFixedProperties, useUpdateMaterialType } from '../../hooks/useCatalog'
import { useQueryClient } from '@tanstack/react-query'
import { actionKeys } from '../../hooks/useActions'
import { locationKeys } from '../../hooks/useLocations'
import { Plus } from 'lucide-react'
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
  const deleteMaterialMut = useDeleteMaterial()
  const updateMaterialTypeMut = useUpdateMaterialType()

  const [error, setError] = useState('')
  const [description, setDescription] = useState(material.description ?? '')
  const [attributes, setAttributes] = useState<Record<string, any>>(() => ({ ...material.attributes }))
  const [customAttrs, setCustomAttrs] = useState<{ code: string; name: string; type: string }[]>(() => {
    if (material.type && material.type.customAttributes) {
      try {
        const attrs = typeof material.type.customAttributes === 'string'
          ? JSON.parse(material.type.customAttributes)
          : material.type.customAttributes
        return Array.isArray(attrs) ? attrs : []
      } catch {
        return []
      }
    }
    return []
  })
  const [newAttrName, setNewAttrName] = useState('')

  const handleAttrChange = (code: string, val: any) => {
    setAttributes(prev => ({ ...prev, [code]: val }))
  }

  const handleAddCustomAttr = () => {
    if (!newAttrName.trim()) return
    const code = newAttrName.trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_')
    if (customAttrs.some(a => a.code === code) || fixedProperties.some(p => p.code === code)) {
      setError('Ya existe una propiedad con ese nombre o código.')
      return
    }
    setCustomAttrs(prev => [...prev, { code, name: newAttrName.trim(), type: 'STRING' }])
    setNewAttrName('')
    setError('')
  }

  const inputCls = 'w-full border border-app-border rounded-lg px-3 py-2 text-sm bg-card text-fg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors'

  function handleDelete() {
    if (!confirm('¿Seguro que deseas eliminar este material permanentemente?')) return
    deleteMaterialMut.mutate(material.id, {
      onSuccess: () => {
        onClose()
      },
      onError: (e: any) => setError(e?.error?.message ?? 'Error al eliminar material')
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    try {
      const oldAttrs = material.type.customAttributes || []
      const oldLength = Array.isArray(oldAttrs) ? oldAttrs.length : 0
      if (customAttrs.length > oldLength) {
        await updateMaterialTypeMut.mutateAsync({
          id: material.typeId,
          body: { customAttributes: customAttrs }
        })
      }

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
    } catch (err: any) {
      setError(err?.error?.message ?? 'Error al actualizar tipo de material')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col max-h-[70vh]">
      <div className="flex-1 overflow-y-auto pr-1 pb-4 space-y-4">
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

        {(customAttrs.length > 0 || fixedProperties.length > 0) && (
          <div className="space-y-4 p-3.5 bg-app-bg/50 rounded-lg border border-app-border">
            <h4 className="text-xs font-bold text-fg-secondary uppercase tracking-wider mb-2">Propiedades Técnicas</h4>
            
            {/* 1. Custom Material-Type-Specific Properties */}
            {customAttrs.map(attr => {
              const value = attributes[attr.code] ?? ''
              const label = (
                <label className="block text-[11px] font-semibold text-primary mb-1">
                  {attr.name}
                </label>
              )

              return (
                <div key={attr.code}>
                  {label}
                  <input
                    type={attr.type === 'NUMBER' ? 'number' : attr.type === 'DATE' ? 'date' : 'text'}
                    value={attr.type === 'NUMBER' && value === '' ? '' : value}
                    onChange={e => {
                      let parsedVal: any = e.target.value
                      if (attr.type === 'NUMBER') {
                        parsedVal = e.target.value === '' ? '' : Number(e.target.value)
                      }
                      handleAttrChange(attr.code, parsedVal)
                    }}
                    className={inputCls}
                    placeholder={`Valor para ${attr.name}`}
                  />
                </div>
              )
            })}

            {/* 2. Global Fixed Properties */}
            {fixedProperties.map(prop => {
              const value = attributes[prop.code] ?? ''
              const label = (
                <label className="block text-[11px] font-semibold text-fg-secondary mb-1">
                  {prop.name} (Global)
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
                      {prop.name} (Global)
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

            {/* 3. Inline custom attribute adder */}
            <div className="pt-2 border-t border-dashed border-app-border/40 space-y-1.5">
              <label className="block text-[10px] font-semibold text-fg-secondary">Añadir Campo/Propiedad Técnica (Inline)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newAttrName}
                  onChange={e => setNewAttrName(e.target.value)}
                  placeholder="Ej: Potencia (W), Marca, Modelo..."
                  className="flex-1 border border-app-border rounded-lg px-3 py-1 bg-card text-xs text-fg focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddCustomAttr}
                  className="px-2.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Añadir
                </button>
              </div>
            </div>
          </div>
        )}

        {error && <p className="text-error text-sm">{error}</p>}
      </div>

      <div className="flex justify-between items-center gap-3 pt-3 border-t border-app-border/40 bg-card shrink-0 w-full">
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleteMaterialMut.isPending}
          className="px-4 py-2 text-sm text-red-600 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors font-semibold"
        >
          {deleteMaterialMut.isPending ? 'Eliminando...' : 'Eliminar'}
        </button>
        <div className="flex gap-3">
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
      </div>
    </form>
  )
}
