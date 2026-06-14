import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { useUpdateMaterialType, useFixedProperties, useInfrastructureTypes, useDeleteMaterialType } from '../../hooks/useCatalog'
import { Plus, Trash2, HelpCircle } from 'lucide-react'
import type { MaterialType } from '../../api/types'

interface Props {
  materialType: MaterialType
  onClose: () => void
}

export function MaterialTypeEditModal({ materialType, onClose }: Props) {
  const updateMtMut = useUpdateMaterialType()
  const deleteMtMut = useDeleteMaterialType()
  const { data: fixedProperties = [] } = useFixedProperties()
  const { data: infraTypes = [] } = useInfrastructureTypes()

  const [name, setName] = useState(materialType.name)
  const [customAttrs, setCustomAttrs] = useState<{ code: string; name: string; type: string }[]>(() => {
    if (materialType.customAttributes) {
      try {
        const attrs = typeof materialType.customAttributes === 'string'
          ? JSON.parse(materialType.customAttributes)
          : materialType.customAttributes
        return Array.isArray(attrs) ? attrs : []
      } catch {
        return []
      }
    }
    return []
  })

  // Selected categories state
  const [selectedCats, setSelectedCats] = useState<number[]>(() => 
    materialType.categories.map(c => c.id)
  )

  // Property inline edit state
  const [editingAttrCode, setEditingAttrCode] = useState<string | null>(null)
  const [editingAttrName, setEditingAttrName] = useState('')
  const [editingAttrType, setEditingAttrType] = useState<string>('STRING')

  // Form states for new attribute
  const [newAttrName, setNewAttrName] = useState('')
  const [newAttrType, setNewAttrType] = useState<'STRING' | 'NUMBER' | 'DATE' | 'BOOLEAN'>('STRING')

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const inputCls = 'w-full border border-app-border rounded-lg px-3 py-2 text-sm bg-card text-fg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors'

  const startEditingAttr = (attr: { code: string; name: string; type: string }) => {
    setEditingAttrCode(attr.code)
    setEditingAttrName(attr.name)
    setEditingAttrType(attr.type)
    setError('')
  }

  const handleSaveAttr = (code: string) => {
    if (!editingAttrName.trim()) return
    
    if (customAttrs.some(a => a.code !== code && a.name.toLowerCase() === editingAttrName.trim().toLowerCase())) {
      setError('Ya existe otra propiedad con ese nombre.')
      return
    }

    setCustomAttrs(prev => prev.map(a => a.code === code ? { ...a, name: editingAttrName.trim(), type: editingAttrType } : a))
    setEditingAttrCode(null)
  }

  const handleAddCustomAttr = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!newAttrName.trim()) return

    const code = newAttrName.trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9_]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 50)

    if (!code) {
      setError('Nombre de propiedad no válido.')
      return
    }

    if (customAttrs.some(a => a.code === code) || fixedProperties.some(p => p.code === code)) {
      setError('Ya existe una propiedad con ese nombre o código.')
      return
    }

    setCustomAttrs(prev => [...prev, { code, name: newAttrName.trim(), type: newAttrType }])
    setNewAttrName('')
    setNewAttrType('STRING')
  }

  const handleDeleteAttr = (code: string, attrName: string) => {
    if (!confirm(`¿Eliminar la propiedad "${attrName}"? Los materiales existentes mantendrán los valores guardados, pero esta propiedad ya no se mostrará como plantilla para rellenar en los formularios.`)) return
    setCustomAttrs(prev => prev.filter(attr => attr.code !== code))
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!name.trim()) return

    updateMtMut.mutate(
      {
        id: materialType.id,
        body: {
          name: name.trim(),
          customAttributes: customAttrs,
          categoryIds: selectedCats,
        },
      },
      {
        onSuccess: () => {
          setSuccess('Tipo de material actualizado con éxito')
          setTimeout(() => {
            onClose()
          }, 1000)
        },
        onError: (err: any) => {
          setError(err?.error?.message ?? 'Error al actualizar el tipo de material')
        },
      }
    )
  }

  const handleDeleteType = () => {
    setError('')
    if (!confirm(`¿Eliminar el tipo de material "${materialType.name}"? Las fichas técnicas de los materiales existentes de este tipo no se verán afectadas, pero ya no se podrá seleccionar este tipo para nuevos materiales.`)) return

    deleteMtMut.mutate(materialType.id, {
      onSuccess: () => {
        onClose()
      },
      onError: (err: any) => {
        setError(err?.error?.message ?? 'No se pudo eliminar el tipo de material')
      }
    })
  }

  return (
    <Modal title={`Editar Tipo de Material - ${materialType.name}`} onClose={onClose}>
      <div className="max-h-[75vh] overflow-y-auto pr-2 space-y-5">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-fg-secondary mb-1">
              Nombre del Tipo de Material <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className={inputCls}
              required
            />
          </div>

          {/* Categories Selector */}
          <div className="border-t border-app-border pt-4">
            <label className="block text-xs font-bold text-fg-secondary uppercase tracking-wider mb-2">
              Mostrar en Categorías
            </label>
            <p className="text-[11px] text-muted mb-3 leading-normal">
              Selecciona en qué categorías de infraestructura estará disponible este tipo de material. Si no marcas ninguna, estará disponible en todas (Global).
            </p>
            <div className="grid grid-cols-2 gap-2 border border-app-border rounded-lg p-3 bg-card max-h-[140px] overflow-y-auto">
              {infraTypes.map(it => {
                const isChecked = selectedCats.includes(it.id)
                return (
                  <label key={it.id} className="flex items-center gap-2 text-xs text-fg cursor-pointer select-none hover:text-primary transition-colors">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        if (isChecked) {
                          setSelectedCats(selectedCats.filter(id => id !== it.id))
                        } else {
                          setSelectedCats([...selectedCats, it.id])
                        }
                      }}
                      className="rounded border-app-border text-primary focus:ring-primary/40 focus:ring-1 bg-card"
                    />
                    <span className="truncate">{it.name}</span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Properties editor */}
          <div className="border-t border-app-border pt-4">
            <h4 className="text-xs font-bold text-fg-secondary uppercase tracking-wider mb-3 flex items-center gap-1">
              Propiedades Específicas
              <span className="group relative cursor-help text-muted hover:text-fg">
                <HelpCircle className="w-3.5 h-3.5" />
                <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden w-48 rounded bg-gray-900 p-2 text-[10px] text-white shadow-lg group-hover:block z-10 leading-normal">
                  Estas propiedades se rellenarán individualmente para cada material de este tipo.
                </span>
              </span>
            </h4>

            {/* List of existing custom attributes */}
            <div className="space-y-2 mb-4">
              {customAttrs.length === 0 ? (
                <p className="text-xs text-muted py-2 bg-muted/10 rounded-lg text-center border border-dashed border-app-border/40">
                  Sin propiedades específicas definidas
                </p>
              ) : (
                <ul className="divide-y divide-app-border/40 border border-app-border rounded-lg overflow-hidden bg-card/50">
                  {customAttrs.map(attr => {
                    const isEditingThis = editingAttrCode === attr.code
                    if (isEditingThis) {
                      return (
                        <li key={attr.code} className="p-2.5 space-y-2 bg-primary/5 border-l-2 border-primary">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[9px] font-semibold text-muted mb-0.5">Nombre</label>
                              <input
                                type="text"
                                value={editingAttrName}
                                onChange={e => setEditingAttrName(e.target.value)}
                                className="w-full border border-app-border rounded px-2.5 py-1 text-xs bg-card text-fg focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-semibold text-muted mb-0.5">Tipo</label>
                              <select
                                value={editingAttrType}
                                onChange={e => setEditingAttrType(e.target.value)}
                                className="w-full border border-app-border rounded px-2.5 py-1 text-xs bg-card text-fg focus:outline-none"
                              >
                                <option value="STRING">Texto (STRING)</option>
                                <option value="NUMBER">Número (NUMBER)</option>
                                <option value="DATE">Fecha (DATE)</option>
                                <option value="BOOLEAN">Booleano (BOOLEAN)</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 text-[10px]">
                            <button
                              type="button"
                              onClick={() => setEditingAttrCode(null)}
                              className="px-2 py-0.5 border border-app-border rounded text-fg hover:bg-muted/10"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveAttr(attr.code)}
                              className="px-2 py-0.5 bg-primary text-primary-fg rounded hover:bg-[var(--primary-hover)] font-semibold"
                            >
                              Aplicar
                            </button>
                          </div>
                        </li>
                      )
                    }

                    return (
                      <li key={attr.code} className="flex items-center justify-between p-2.5 gap-2 hover:bg-muted/10 transition-colors">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-fg truncate">{attr.name}</p>
                          <p className="text-[9px] font-mono text-muted">
                            Clave: {attr.code} · Tipo: {attr.type === 'STRING' ? 'Texto' : attr.type === 'NUMBER' ? 'Número' : attr.type === 'DATE' ? 'Fecha' : 'Booleano'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => startEditingAttr(attr)}
                            className="text-[10px] text-primary hover:underline px-1 py-0.5 rounded hover:bg-primary/5 transition-colors font-medium"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAttr(attr.code, attr.name)}
                            className="p-1 text-muted hover:text-error rounded-md hover:bg-error/10 transition-colors"
                            title="Eliminar propiedad"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            {/* Inline form to add new property */}
            <div className="bg-app-bg/50 p-3 rounded-lg border border-app-border space-y-3">
              <p className="text-[10px] font-semibold text-fg-secondary uppercase tracking-wider">Añadir Nueva Propiedad</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-muted mb-1">Nombre (ej: Voltaje)</label>
                  <input
                    type="text"
                    value={newAttrName}
                    onChange={e => setNewAttrName(e.target.value)}
                    placeholder="Ej: Voltaje, Marca, Modelo"
                    className="w-full border border-app-border rounded-lg px-2.5 py-1.5 text-xs bg-card text-fg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-muted mb-1">Tipo de Dato</label>
                  <select
                    value={newAttrType}
                    onChange={e => setNewAttrType(e.target.value as any)}
                    className="w-full border border-app-border rounded-lg px-2 py-1.5 text-xs bg-card text-fg focus:outline-none"
                  >
                    <option value="STRING">Texto (STRING)</option>
                    <option value="NUMBER">Número (NUMBER)</option>
                    <option value="DATE">Fecha (DATE)</option>
                    <option value="BOOLEAN">Booleano (BOOLEAN)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleAddCustomAttr}
                  disabled={!newAttrName.trim()}
                  className="px-2.5 py-1 bg-primary text-primary-fg hover:bg-[var(--primary-hover)] disabled:opacity-50 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Añadir a la lista
                </button>
              </div>
            </div>
          </div>

          {error && <p className="text-error text-xs">{error}</p>}
          {success && <p className="text-emerald-500 text-xs font-semibold">{success}</p>}

          <div className="flex justify-between items-center gap-3 pt-3 border-t border-app-border/40">
            <button
              type="button"
              onClick={handleDeleteType}
              disabled={deleteMtMut.isPending}
              className="px-3.5 py-2 text-xs text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 dark:border-red-950/20 dark:bg-red-500/5 dark:hover:bg-red-500/10 rounded-lg transition-colors font-semibold"
            >
              {deleteMtMut.isPending ? 'Eliminando...' : 'Eliminar Tipo'}
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
                disabled={updateMtMut.isPending}
                className="px-4 py-2 text-sm text-primary-fg bg-primary rounded-lg hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors"
              >
                {updateMtMut.isPending ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  )
}
