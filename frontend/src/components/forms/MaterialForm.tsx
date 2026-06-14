import { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { useCreateMaterial } from '../../hooks/useMaterials'
import { useLocation } from '../../hooks/useLocations'
import {
  useMaterialTypes,
  useCreateMaterialType,
  useUpdateMaterialType,
  useFixedProperties,
} from '../../hooks/useCatalog'
import { Plus } from 'lucide-react'
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
  const [error, setError] = useState('')

  // Inline "nuevo tipo de material" fields
  const [showNewTypeInput, setShowNewTypeInput] = useState(false)
  const [newTypeName, setNewTypeName] = useState('')

  // Inline custom attributes states
  const [customAttrs, setCustomAttrs] = useState<{ code: string; name: string; type: string }[]>([])
  const [newAttrName, setNewAttrName] = useState('')
  const [newAttrType, setNewAttrType] = useState<'STRING' | 'NUMBER'>('STRING')

  const createMaterialMut = useCreateMaterial()
  const createMaterialTypeMut = useCreateMaterialType()
  const updateMaterialTypeMut = useUpdateMaterialType()

  const { data: locationDetail } = useLocation(locationId)
  const categoryId = locationDetail?.infraTypeId ?? null

  const { data: materialTypes = [] } = useMaterialTypes(categoryId)
  const { data: allSystemTypes = [] } = useMaterialTypes()
  const { data: fixedProperties = [] } = useFixedProperties()

  const [localCreatedTypes, setLocalCreatedTypes] = useState<any[]>([])
  const allMaterialTypes = [...materialTypes, ...localCreatedTypes].filter(
    (t, idx, arr) => arr.findIndex(item => item.id === t.id) === idx
  )

  const isPending = createMaterialMut.isPending || createMaterialTypeMut.isPending || updateMaterialTypeMut.isPending
  const inputCls = 'w-full border border-app-border rounded-lg px-3 py-2 text-sm bg-card text-fg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors'

  // Update custom fields when type changes
  useEffect(() => {
    if (showNewTypeInput) {
      setCustomAttrs([])
    } else if (typeId) {
      const selectedType = allMaterialTypes.find(t => t.id === typeId)
      if (selectedType && selectedType.customAttributes) {
        try {
          const attrs = typeof selectedType.customAttributes === 'string'
            ? JSON.parse(selectedType.customAttributes)
            : selectedType.customAttributes
          setCustomAttrs(Array.isArray(attrs) ? attrs : [])
        } catch {
          setCustomAttrs([])
        }
      } else {
        setCustomAttrs([])
      }
    } else {
      setCustomAttrs([])
    }
  }, [typeId, showNewTypeInput])

  function handleTypeChange(val: string) {
    if (val === '__new__') {
      setShowNewTypeInput(true)
      setTypeId(0)
    } else {
      setShowNewTypeInput(false)
      setTypeId(Number(val))
    }
  }

  async function handleConfirmNewType() {
    if (!newTypeName.trim()) return
    setError('')
    try {
      const code = newTypeName.trim().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9_]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 50)

      const createdType = await createMaterialTypeMut.mutateAsync({
        code,
        name: newTypeName.trim(),
        infraTypeId: categoryId,
        customAttributes: []
      })

      setLocalCreatedTypes(prev => [...prev, createdType])
      setTypeId(createdType.id)
      setShowNewTypeInput(false)
      setNewTypeName('')
    } catch (err: any) {
      setError(err?.error?.message ?? 'Error al crear el tipo de material')
    }
  }

  function handleAddCustomAttr() {
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

  const handleAttrChange = (code: string, val: any) => {
    setAttributes(prev => ({ ...prev, [code]: val }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('El nombre del material es obligatorio.')
      return
    }

    if (!showNewTypeInput && !typeId) {
      setError('El tipo de material es obligatorio.')
      return
    }

    if (showNewTypeInput) {
      setError('Por favor, confirme el nuevo tipo de material primero.')
      return
    }

    try {
      let finalTypeId = typeId

      // Check if we need to update the existing Material Type's custom attributes
      const selectedType = allMaterialTypes.find(t => t.id === typeId)
      if (selectedType) {
        const oldAttrs = selectedType.customAttributes || []
        const oldLength = Array.isArray(oldAttrs) ? oldAttrs.length : 0
        if (customAttrs.length > oldLength) {
          await updateMaterialTypeMut.mutateAsync({
            id: typeId,
            body: { customAttributes: customAttrs }
          })
        }
      }

      // 3. Save the Material itself
      createMaterialMut.mutate(
        {
          name: name.trim(),
          typeId: finalTypeId,
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
    } catch (err: any) {
      setError(err?.error?.message ?? 'Error al procesar el tipo de material')
    }
  }

  return (
    <Modal title="Añadir Material a la Ubicación" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-3">
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
            <option value="" disabled hidden>Seleccionar tipo...</option>
            <option value="__new__" className="text-blue-500 font-semibold" style={{ color: 'var(--primary, #2563eb)' }}>
              + Crear nuevo tipo...
            </option>
            {allMaterialTypes.map(t => (
              <option key={t.id} value={String(t.id)}>{t.name}</option>
            ))}
          </select>

          {showNewTypeInput && (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                list="material-type-suggestions"
                value={newTypeName}
                onChange={e => setNewTypeName(e.target.value)}
                placeholder="Nombre del nuevo tipo (ej: Alumbrado)"
                className={inputCls}
                required
                autoFocus
              />
              <button
                type="button"
                onClick={handleConfirmNewType}
                disabled={createMaterialTypeMut.isPending}
                className="px-4 py-2 text-sm text-primary-fg bg-primary rounded-lg hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors font-semibold shrink-0"
              >
                {createMaterialTypeMut.isPending ? 'Confirmando...' : 'Confirmar'}
              </button>
            </div>
          )}

          <datalist id="material-type-suggestions">
            {allSystemTypes.map(t => (
              <option key={t.id} value={t.name} />
            ))}
          </datalist>
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

        {/* Technical Attributes Section */}
        {typeId > 0 && !showNewTypeInput && (
          <div className="space-y-3 pt-2 border-t border-app-border/40">
            <h4 className="text-xs font-bold text-fg-secondary uppercase tracking-wider">Propiedades Técnicas</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* 1. Custom Material-Type-Specific Properties */}
              {customAttrs.map(attr => {
                const val = attributes[attr.code] ?? ''
                return (
                  <div key={attr.code}>
                    <label className="block text-[11px] font-semibold text-primary mb-1">
                      {attr.name}
                    </label>
                    <input
                      type={attr.type === 'NUMBER' ? 'number' : attr.type === 'DATE' ? 'date' : 'text'}
                      value={attr.type === 'NUMBER' && val === '' ? '' : val}
                      onChange={e => {
                        let parsedVal: any = e.target.value
                        if (attr.type === 'NUMBER') {
                          parsedVal = e.target.value === '' ? '' : Number(e.target.value)
                        }
                        handleAttrChange(attr.code, parsedVal)
                      }}
                      placeholder={`Valor para ${attr.name}`}
                      className={inputCls}
                    />
                  </div>
                )
              })}

              {/* 2. Global Fixed Properties */}
              {fixedProperties.map(prop => {
                const val = attributes[prop.code] ?? ''
                return (
                  <div key={prop.code}>
                    <label className="block text-[11px] font-semibold text-muted mb-1">
                      {prop.name} (Global)
                    </label>
                    <input
                      type={prop.type === 'NUMBER' ? 'number' : prop.type === 'DATE' ? 'date' : 'text'}
                      value={prop.type === 'NUMBER' && val === '' ? '' : val}
                      onChange={e => {
                        let parsedVal: any = e.target.value
                        if (prop.type === 'NUMBER') {
                          parsedVal = e.target.value === '' ? '' : Number(e.target.value)
                        }
                        handleAttrChange(prop.code, parsedVal)
                      }}
                      placeholder={`Valor para ${prop.name}`}
                      className={inputCls}
                    />
                  </div>
                )
              })}
            </div>

            {/* 3. Inline custom attribute adder */}
            <div className="pt-3.5 border-t border-app-border/45 space-y-3">
              <span className="block text-[11px] font-bold text-fg-secondary uppercase tracking-wider">Añadir Propiedad Técnica Personalizada</span>
              <div className="bg-app-bg/65 p-3 rounded-lg border border-app-border/75 space-y-2.5">
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
          </div>
        )}

        {error && <p className="text-error text-xs">{error}</p>}

        <div className="sticky bottom-0 bg-card flex justify-end gap-3 pt-4 pb-1 border-t border-app-border/40 z-10">
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
