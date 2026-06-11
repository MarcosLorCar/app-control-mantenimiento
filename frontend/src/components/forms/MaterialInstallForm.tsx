import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { useCreateMaterial, materialKeys } from '../../hooks/useMaterials'
import { useMaterialTypes, useMaterialCategories, useCreateMaterialType, useCreateMaterialCategory } from '../../hooks/useCatalog'
import { useQueryClient } from '@tanstack/react-query'
import { locationKeys } from '../../hooks/useLocations'
import { actionKeys } from '../../hooks/useActions'

interface Props {
  locationId: number
  actionId?: number
  onClose: () => void
}

export function MaterialInstallForm({ locationId, actionId, onClose }: Props) {
  const [selectedTypeVal, setSelectedTypeVal] = useState('0')
  const [newTypeName, setNewTypeName] = useState('')
  const [serialNumber, setSerialNumber] = useState('')
  const [installedAt, setInstalledAt] = useState(new Date().toISOString().slice(0, 10))
  const [attributes, setAttributes] = useState<Record<string, any>>({})
  const [error, setError] = useState('')
  const [showNewAttrForm, setShowNewAttrForm] = useState(false)
  const [newAttr, setNewAttr] = useState<{
    name: string
    code: string
    dataType: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'DATE' | 'ENUM'
    unit: string
    required: boolean
    enumValuesStr: string
  }>({
    name: '',
    code: '',
    dataType: 'STRING',
    unit: '',
    required: false,
    enumValuesStr: '',
  })

  const { data: materialTypes = [] } = useMaterialTypes()
  
  const typeId = selectedTypeVal !== 'new' ? Number(selectedTypeVal) : 0
  const { data: categories = [] } = useMaterialCategories(typeId)
  
  const createMaterial = useCreateMaterial()
  const createMaterialTypeMut = useCreateMaterialType()
  const createCategoryMut = useCreateMaterialCategory(typeId)
  const qc = useQueryClient()

  const handleAttrChange = (code: string, val: any) => {
    setAttributes(prev => ({ ...prev, [code]: val }))
  }

  const handleCreateCategory = () => {
    if (!newAttr.name.trim()) return
    const code = newAttr.code.trim() || newAttr.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_')
    
    createCategoryMut.mutate(
      {
        name: newAttr.name.trim(),
        code,
        dataType: newAttr.dataType,
        unit: newAttr.unit.trim() || undefined,
        required: newAttr.required,
        enumValues: newAttr.dataType === 'ENUM'
          ? newAttr.enumValuesStr.split(',').map(s => s.trim()).filter(Boolean)
          : undefined,
      },
      {
        onSuccess: () => {
          setShowNewAttrForm(false)
          setNewAttr({
            name: '',
            code: '',
            dataType: 'STRING',
            unit: '',
            required: false,
            enumValuesStr: '',
          })
        },
        onError: (err: any) => {
          setError(err?.error?.message ?? 'Error al crear atributo')
        }
      }
    )
  }

  const inputCls = 'w-full border border-app-border rounded-lg px-3 py-2 text-sm bg-card text-fg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors'

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (selectedTypeVal === '0') {
      setError('El tipo de material es obligatorio.')
      return
    }

    const finalAttrs: Record<string, any> = { ...attributes }

    const proceedWithMaterialCreation = (resolvedTypeId: number, materialName: string) => {
      createMaterial.mutate(
        {
          name: materialName,
          typeId: resolvedTypeId,
          serialNumber: serialNumber.trim() || undefined,
          installedAt: installedAt ? new Date(installedAt).toISOString() : undefined,
          locationId,
          actionId,
          attributes: finalAttrs,
        },
        {
          onSuccess: () => {
            qc.invalidateQueries({ queryKey: materialKeys.byLocation(locationId) })
            qc.invalidateQueries({ queryKey: locationKeys.detail(locationId) })
            if (actionId) {
              qc.invalidateQueries({ queryKey: actionKeys.detail(actionId) })
              qc.invalidateQueries({ queryKey: actionKeys.all })
            }
            onClose()
          },
          onError: (e: any) => setError(e?.error?.message ?? 'Error al instalar material'),
        }
      )
    }

    if (selectedTypeVal === 'new') {
      if (!newTypeName.trim()) {
        setError('El nombre del nuevo tipo es obligatorio.')
        return
      }
      const code = newTypeName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_')
      createMaterialTypeMut.mutate(
        { name: newTypeName.trim(), code },
        {
          onSuccess: (newType) => {
            proceedWithMaterialCreation(newType.id, newType.name)
          },
          onError: (e: any) => setError(e?.error?.message ?? 'Error al crear el tipo de material'),
        }
      )
    } else {
      const selectedType = materialTypes.find(t => t.id === typeId)
      proceedWithMaterialCreation(typeId, selectedType?.name ?? 'Material')
    }
  }

  return (
    <Modal title="Instalar material" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-fg-secondary mb-1">Tipo de material <span className="text-error">*</span></label>
          <select 
            value={selectedTypeVal} 
            onChange={e => { 
              setSelectedTypeVal(e.target.value) 
              setAttributes({})
            }} 
            className={inputCls} 
            required
          >
            <option value="0">Seleccionar tipo...</option>
            {materialTypes.map(t => (
              <option key={t.id} value={String(t.id)}>{t.name}</option>
            ))}
            <option value="new">+ Crear nuevo tipo...</option>
          </select>
        </div>

        {selectedTypeVal === 'new' && (
          <div>
            <label className="block text-xs font-semibold text-fg-secondary mb-1">Nombre del nuevo tipo <span className="text-error">*</span></label>
            <input 
              type="text" 
              value={newTypeName} 
              onChange={e => setNewTypeName(e.target.value)} 
              placeholder="Ej: Bombilla Inteligente" 
              className={inputCls} 
              required 
            />
          </div>
        )}

        {categories.length > 0 && (
          <div className="space-y-3 p-3 bg-app-bg/50 rounded-lg border border-app-border">
            <h4 className="text-xs font-bold text-fg-secondary uppercase tracking-wider mb-2">Atributos del catálogo</h4>
            {categories.map(cat => {
              const value = attributes[cat.code] ?? '';
              const label = (
                <label className="block text-xs font-semibold text-fg-secondary mb-1">
                  {cat.name} {cat.unit ? `(${cat.unit})` : ''} {cat.required && <span className="text-error">*</span>}
                </label>
              );
              
              if (cat.dataType === 'ENUM') {
                return (
                  <div key={cat.id}>
                    {label}
                    <select
                      value={value}
                      onChange={e => handleAttrChange(cat.code, e.target.value)}
                      className={inputCls}
                      required={cat.required}
                    >
                      <option value="">Seleccionar...</option>
                      {cat.enumValues.map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                );
              }
              
              if (cat.dataType === 'BOOLEAN') {
                return (
                  <div key={cat.id} className="flex items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      id={`attr-${cat.code}`}
                      checked={!!value}
                      onChange={e => handleAttrChange(cat.code, e.target.checked)}
                      className="rounded border-app-border text-primary focus:ring-primary/40"
                    />
                    <label htmlFor={`attr-${cat.code}`} className="text-xs font-semibold text-fg-secondary">
                      {cat.name} {cat.required && <span className="text-error">*</span>}
                    </label>
                  </div>
                );
              }
              
              if (cat.dataType === 'NUMBER') {
                return (
                  <div key={cat.id}>
                    {label}
                    <input
                      type="number"
                      value={value}
                      onChange={e => {
                        const v = e.target.value === '' ? undefined : Number(e.target.value);
                        handleAttrChange(cat.code, v);
                      }}
                      className={inputCls}
                      required={cat.required}
                      placeholder="Ej: 12"
                    />
                  </div>
                );
              }

              if (cat.dataType === 'DATE') {
                return (
                  <div key={cat.id}>
                    {label}
                    <input
                      type="date"
                      value={value}
                      onChange={e => handleAttrChange(cat.code, e.target.value)}
                      className={inputCls}
                      required={cat.required}
                    />
                  </div>
                );
              }

              return (
                <div key={cat.id}>
                  {label}
                  <input
                    type="text"
                    value={value}
                    onChange={e => handleAttrChange(cat.code, e.target.value)}
                    className={inputCls}
                    required={cat.required}
                    placeholder="Ej: Valor"
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Inline new catalog attribute definition form */}
        {typeId > 0 && (
          <div className="space-y-3 p-3 bg-app-bg/30 rounded-lg border border-app-border">
            {showNewAttrForm ? (
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-fg-secondary">Definir Nuevo Atributo</h5>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-fg-secondary mb-1">Nombre</label>
                    <input
                      type="text"
                      value={newAttr.name}
                      onChange={e => {
                        const val = e.target.value
                        setNewAttr(prev => ({
                          ...prev,
                          name: val,
                          code: prev.code === '' || prev.code === prev.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_')
                            ? val.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_')
                            : prev.code
                        }))
                      }}
                      placeholder="Ej: Lúmenes"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-fg-secondary mb-1">Código único</label>
                    <input
                      type="text"
                      value={newAttr.code}
                      onChange={e => setNewAttr(prev => ({ ...prev, code: e.target.value.toLowerCase().replace(/[^a-z0-9_]+/g, '') }))}
                      placeholder="ej_lumens"
                      className={inputCls}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-fg-secondary mb-1">Tipo de dato</label>
                    <select
                      value={newAttr.dataType}
                      onChange={e => setNewAttr(prev => ({ ...prev, dataType: e.target.value as any }))}
                      className={inputCls}
                    >
                      <option value="STRING">Texto (STRING)</option>
                      <option value="NUMBER">Número (NUMBER)</option>
                      <option value="BOOLEAN">Sí/No (BOOLEAN)</option>
                      <option value="DATE">Fecha (DATE)</option>
                      <option value="ENUM">Opciones (ENUM)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-fg-secondary mb-1">Unidad (opcional)</label>
                    <input
                      type="text"
                      value={newAttr.unit}
                      onChange={e => setNewAttr(prev => ({ ...prev, unit: e.target.value }))}
                      placeholder="Ej: lm, W, kg"
                      className={inputCls}
                    />
                  </div>
                </div>
                
                {newAttr.dataType === 'ENUM' && (
                  <div>
                    <label className="block text-[10px] font-semibold text-fg-secondary mb-1">Opciones (separadas por comas)</label>
                    <input
                      type="text"
                      value={newAttr.enumValuesStr}
                      onChange={e => setNewAttr(prev => ({ ...prev, enumValuesStr: e.target.value }))}
                      placeholder="Ej: Cálida, Fría, Neutra"
                      className={inputCls}
                    />
                  </div>
                )}

                <div className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    id="new-attr-required"
                    checked={newAttr.required}
                    onChange={e => setNewAttr(prev => ({ ...prev, required: e.target.checked }))}
                    className="rounded border-app-border text-primary focus:ring-primary/40"
                  />
                  <label htmlFor="new-attr-required" className="text-xs font-semibold text-fg-secondary">
                    ¿Es obligatorio para este tipo?
                  </label>
                </div>

                <div className="flex justify-end gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewAttrForm(false)
                      setNewAttr({ name: '', code: '', dataType: 'STRING', unit: '', required: false, enumValuesStr: '' })
                    }}
                    className="px-2.5 py-1.5 border border-app-border rounded-lg text-fg-secondary hover:bg-app-bg"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    disabled={createCategoryMut.isPending}
                    className="px-2.5 py-1.5 bg-primary text-primary-fg rounded-lg hover:bg-[var(--primary-hover)] disabled:opacity-50"
                  >
                    {createCategoryMut.isPending ? 'Guardando...' : 'Guardar atributo'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowNewAttrForm(true)}
                className="w-full py-1.5 border border-dashed border-app-border rounded-lg text-[11px] font-semibold text-primary hover:bg-primary/5 transition-colors"
              >
                + Definir nuevo atributo...
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-fg-secondary mb-1">Nº Serie</label>
            <input type="text" value={serialNumber} onChange={e => setSerialNumber(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-fg-secondary mb-1">Fecha instalación</label>
            <input type="date" value={installedAt} onChange={e => setInstalledAt(e.target.value)} className={inputCls} />
          </div>
        </div>
        {error && <p className="text-error text-sm">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-fg-secondary border border-app-border rounded-lg hover:bg-app-bg transition-colors">Cancelar</button>
          <button type="submit" disabled={createMaterial.isPending || createMaterialTypeMut.isPending} className="px-4 py-2 text-sm text-primary-fg bg-primary rounded-lg disabled:opacity-50 transition-colors">
            {createMaterial.isPending || createMaterialTypeMut.isPending ? 'Procesando...' : 'Instalar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
