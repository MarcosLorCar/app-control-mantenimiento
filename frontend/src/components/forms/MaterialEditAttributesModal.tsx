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
  readOnly?: boolean
  titleOverride?: string
}

export function MaterialEditAttributesModal({ material, onClose, readOnly, titleOverride }: Props) {
  const { data: fixedProperties = [], isLoading } = useFixedProperties()

  return (
    <Modal title={titleOverride ?? `Detalles de Material - ${material.name}`} onClose={onClose}>
      {isLoading ? (
        <div className="text-center py-8 text-muted text-sm">Cargando especificaciones...</div>
      ) : (
        <MaterialEditAttributesForm
          fixedProperties={fixedProperties}
          material={material}
          onClose={onClose}
          readOnly={readOnly}
        />
      )}
    </Modal>
  )
}

function MaterialEditAttributesForm({
  fixedProperties,
  material,
  onClose,
  readOnly = false,
}: {
  fixedProperties: any[]
  material: Material
  onClose: () => void
  readOnly?: boolean
}) {
  const qc = useQueryClient()
  const updateMaterialMut = useUpdateMaterial()
  const deleteMaterialMut = useDeleteMaterial()
  const updateMaterialTypeMut = useUpdateMaterialType()

  const [error, setError] = useState('')
  const [description, setDescription] = useState(material.description ?? '')
  const [attributes, setAttributes] = useState<Record<string, any>>(() => ({ ...material.attributes }))
  const [customAttrs, setCustomAttrs] = useState<{ code: string; name: string; type: string }[]>(() => {
    let typeAttrs: { code: string; name: string; type: string }[] = []
    if (material.type && material.type.customAttributes) {
      try {
        const attrs = typeof material.type.customAttributes === 'string'
          ? JSON.parse(material.type.customAttributes)
          : material.type.customAttributes
        if (Array.isArray(attrs)) {
          typeAttrs = [...attrs]
        }
      } catch {
        // ignore
      }
    }

    const existingAttrKeys = typeAttrs.map(a => a.code)
    const fixedKeys = fixedProperties.map(p => p.code)

    const extraAttrs: { code: string; name: string; type: string }[] = []
    if (material.attributes) {
      Object.entries(material.attributes).forEach(([key, val]) => {
        if (!existingAttrKeys.includes(key) && !fixedKeys.includes(key)) {
          let detectedType = 'STRING'
          if (typeof val === 'number') {
            detectedType = 'NUMBER'
          } else if (typeof val === 'boolean') {
            detectedType = 'BOOLEAN'
          } else if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
            detectedType = 'DATE'
          }

          const readableName = key
            .replace(/_/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase())

          extraAttrs.push({
            code: key,
            name: readableName,
            type: detectedType
          })
        }
      })
    }

    return [...typeAttrs, ...extraAttrs]
  })
  const [newAttrName, setNewAttrName] = useState('')
  const [newAttrType, setNewAttrType] = useState<'STRING' | 'NUMBER'>('STRING')

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
    setCustomAttrs(prev => [...prev, { code, name: newAttrName.trim(), type: newAttrType }])
    setNewAttrName('')
    setNewAttrType('STRING')
    setError('')
  }

  const inputCls = `w-full border border-app-border rounded-lg px-3 py-2 text-sm bg-card text-fg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors ${readOnly ? 'bg-app-bg/40 cursor-not-allowed opacity-90' : ''}`

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
      let oldAttrsParsed: any[] = []
      if (material.type && material.type.customAttributes) {
        try {
          oldAttrsParsed = typeof material.type.customAttributes === 'string'
            ? JSON.parse(material.type.customAttributes)
            : material.type.customAttributes
        } catch {
          // ignore
        }
      }
      if (!Array.isArray(oldAttrsParsed)) {
        oldAttrsParsed = []
      }

      const oldAttrsStr = JSON.stringify(oldAttrsParsed)
      const newAttrsStr = JSON.stringify(customAttrs)

      if (oldAttrsStr !== newAttrsStr) {
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
      <div className="flex-1 overflow-y-auto pr-3 pb-4 space-y-4">
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
            disabled={readOnly}
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
                    disabled={readOnly}
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
                      disabled={readOnly}
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
                      disabled={readOnly}
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
                      disabled={readOnly}
                      onChange={e => handleAttrChange(prop.code, e.target.checked)}
                      className="rounded border-app-border text-primary focus:ring-primary/40 disabled:opacity-60 disabled:cursor-not-allowed"
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
                    disabled={readOnly}
                    onChange={e => handleAttrChange(prop.code, e.target.value)}
                    className={inputCls}
                    placeholder={`Valor para ${prop.name}`}
                  />
                </div>
              )
            })}

            {/* 3. Inline custom attribute adder */}
            {!readOnly && (
              <div className="pt-3.5 border-t border-app-border/40 space-y-3">
                <span className="block text-[11px] font-bold text-fg-secondary uppercase tracking-wider">Añadir Propiedad Técnica Personalizada</span>
                <div className="bg-app-bg/60 p-3 rounded-lg border border-app-border/80 space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-muted mb-1">Nombre (ej: Potencia)</label>
                      <input
                        type="text"
                        value={newAttrName}
                        onChange={e => setNewAttrName(e.target.value)}
                        placeholder="Ej: Marca, Modelo, Rango..."
                        className="w-full border border-app-border rounded-lg px-2.5 py-1.5 bg-card text-xs text-fg focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-muted mb-1">Tipo de Dato</label>
                      <select
                        value={newAttrType}
                        onChange={e => setNewAttrType(e.target.value as any)}
                        className="w-full border border-app-border rounded-lg px-2.5 py-1.5 bg-card text-xs text-fg focus:outline-none"
                      >
                        <option value="STRING">Texto (STRING)</option>
                        <option value="NUMBER">Número (NUMBER)</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleAddCustomAttr}
                      disabled={!newAttrName.trim()}
                      className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" /> Añadir Propiedad
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {error && <p className="text-error text-sm">{error}</p>}
      </div>

      {readOnly ? (
        <div className="flex justify-end pt-3 border-t border-app-border/40 bg-card shrink-0 w-full">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-primary-fg bg-primary rounded-lg hover:bg-[var(--primary-hover)] transition-colors font-semibold"
          >
            Cerrar
          </button>
        </div>
      ) : (
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
      )}
    </form>
  )
}
