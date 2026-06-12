import { useState } from 'react'
import {
  useInfrastructureTypes, useCreateInfrastructureType,
  useRoles,
  useMaterialTypes, useCreateMaterialType,
  useFixedProperties, useCreateFixedProperty, useDeleteFixedProperty
} from '../../hooks/useCatalog'
import { useAuth } from '../../hooks/useAuth'
import { getCategoryIcon, CATEGORY_ICON_OPTIONS } from '../../utils/categoryIcons'

const inputCls = 'w-full border border-app-border rounded-lg px-3 py-2 text-sm bg-card text-fg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors'

export function Catalog() {
  const { user } = useAuth()
  const canManage = !!user?.can_manage

  const { data: infraTypes = [] } = useInfrastructureTypes()
  const { data: materialTypes = [] } = useMaterialTypes()
  const { data: fixedProperties = [], refetch: refetchProps } = useFixedProperties()
  const { data: roles = [] } = useRoles()

  const addInfraType = useCreateInfrastructureType()
  const addMaterialType = useCreateMaterialType()
  const addFixedProp = useCreateFixedProperty()
  const deleteFixedProp = useDeleteFixedProperty()

  // InfraType form state
  const [itName, setItName] = useState('')
  const [itIcon, setItIcon] = useState('Building2')
  const [itError, setItError] = useState('')

  // MaterialType form state
  const [mtName, setMtName] = useState('')
  const [mtError, setMtError] = useState('')

  // FixedProperty form state
  const [fpName, setFpName] = useState('')
  const [fpType, setFpType] = useState<'STRING' | 'DATE' | 'NUMBER' | 'BOOLEAN'>('STRING')
  const [fpError, setFpError] = useState('')

  function handleAddInfraType(e: React.FormEvent) {
    e.preventDefault()
    if (!itName.trim()) return
    setItError('')
    addInfraType.mutate(
      { name: itName.trim(), icon: itIcon, color: undefined },
      {
        onSuccess: () => { setItName(''); setItIcon('Building2') },
        onError: (err: any) => setItError(err?.error?.message ?? 'Error al añadir'),
      }
    )
  }

  function handleAddMaterialType(e: React.FormEvent) {
    e.preventDefault()
    if (!mtName.trim()) return
    setMtError('')
    const generatedCode = mtName.trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9_]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 50)
    addMaterialType.mutate(
      { code: generatedCode, name: mtName.trim() },
      {
        onSuccess: () => { setMtName('') },
        onError: (err: any) => setMtError(err?.error?.message ?? 'Error al añadir'),
      }
    )
  }

  function handleAddFixedProp(e: React.FormEvent) {
    e.preventDefault()
    if (!fpName.trim()) return
    setFpError('')
    const generatedCode = fpName.trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9_]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 50)
    addFixedProp.mutate(
      {
        code: generatedCode,
        name: fpName.trim(),
        type: fpType
      },
      {
        onSuccess: () => {
          setFpName('')
          setFpType('STRING')
          refetchProps()
        },
        onError: (err: any) => setFpError(err?.error?.message ?? 'Error al añadir propiedad'),
      }
    )
  }

  function handleDeleteFixedProp(id: number) {
    if (!confirm('¿Eliminar esta propiedad fija? Los datos de los materiales asociados a esta clave seguirán existiendo en sus fichas técnicas, pero la propiedad ya no aparecerá como predefinida.')) return
    deleteFixedProp.mutate(id, {
      onSuccess: () => refetchProps()
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

        {/* Tipos de infraestructura */}
        <div className="bg-card rounded-xl border border-app-border p-5 h-fit">
          <h2 className="text-[15px] font-semibold text-fg mb-4">Tipos de infraestructura</h2>
          <ul className="divide-y divide-app-border mb-4 max-h-[260px] overflow-y-auto pr-1">
            {infraTypes.length === 0 && (
              <li className="py-2 text-sm text-muted">Sin tipos definidos</li>
            )}
            {infraTypes.map(it => {
              const CatIcon = getCategoryIcon(it.icon)
              return (
                <li key={it.id} className="py-2.5 flex items-center gap-2">
                  <CatIcon className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm text-fg truncate">{it.name}</span>
                </li>
              )
            })}
          </ul>
          {canManage && (
            <form onSubmit={handleAddInfraType} className="border-t border-app-border pt-4 space-y-3">
              <input
                type="text"
                value={itName}
                onChange={e => setItName(e.target.value)}
                placeholder="Nombre del tipo"
                className={inputCls}
                required
              />
              <div>
                <label className="block text-[10px] font-semibold text-fg-secondary mb-1">Seleccionar Icono</label>
                <div className="grid grid-cols-3 gap-1.5 border border-app-border rounded-lg p-2 bg-card/50 max-h-[120px] overflow-y-auto">
                  {CATEGORY_ICON_OPTIONS.map(opt => {
                    const OptIcon = getCategoryIcon(opt.name)
                    const isSelected = itIcon === opt.name
                    return (
                      <button
                        key={opt.name}
                        type="button"
                        onClick={() => setItIcon(opt.name)}
                        className={`flex items-center gap-1 p-1 rounded border text-[9px] transition-all hover:bg-primary/5 ${
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary font-bold'
                            : 'border-app-border text-muted hover:text-fg'
                        }`}
                        title={opt.label}
                      >
                        <OptIcon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{opt.label.split(' ')[0]}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!itName.trim() || addInfraType.isPending}
                  className="px-3 py-1.5 text-sm text-primary-fg bg-primary rounded-lg hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors"
                >
                  {itName.trim() ? 'Añadir' : 'Escribe nombre'}
                </button>
              </div>
              {itError && <p className="text-error text-xs">{itError}</p>}
            </form>
          )}
        </div>

        {/* Tipos de material */}
        <div className="bg-card rounded-xl border border-app-border p-5 h-fit">
          <h2 className="text-[15px] font-semibold text-fg mb-4">Tipos de material</h2>
          <ul className="divide-y divide-app-border mb-4 max-h-[300px] overflow-y-auto pr-1">
            {materialTypes.length === 0 && (
              <li className="py-2 text-sm text-muted">Sin tipos definidos</li>
            )}
            {materialTypes.map(mt => (
              <li key={mt.id} className="py-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-sm font-semibold text-fg truncate">{mt.name}</span>
                  <span className="text-[10px] font-mono text-muted shrink-0">({mt.code})</span>
                </div>
              </li>
            ))}
          </ul>
          {canManage && (
            <form onSubmit={handleAddMaterialType} className="border-t border-app-border pt-4 space-y-2">
              <input
                type="text"
                value={mtName}
                onChange={e => setMtName(e.target.value)}
                placeholder="Nombre (ej: Bombilla LED)"
                className={inputCls}
                required
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!mtName.trim() || addMaterialType.isPending}
                  className="px-3 py-1.5 text-sm text-primary-fg bg-primary rounded-lg hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors"
                >
                  Añadir
                </button>
              </div>
              {mtError && <p className="text-error text-xs">{mtError}</p>}
            </form>
          )}
        </div>

        {/* Propiedades Fijas Globales */}
        <div className="bg-card rounded-xl border border-app-border p-5 h-fit">
          <h2 className="text-[15px] font-semibold text-fg mb-4">Propiedades Fijas de Materiales</h2>
          <ul className="divide-y divide-app-border mb-4 max-h-[300px] overflow-y-auto pr-1">
            {fixedProperties.length === 0 && (
              <li className="py-2 text-sm text-muted">Sin propiedades registradas</li>
            )}
            {fixedProperties.map(fp => (
              <li key={fp.id} className="py-2.5 flex items-center justify-between gap-2">
                <div className="flex flex-col min-w-0">
                  <span className="text-sm text-fg font-medium truncate">{fp.name}</span>
                  <span className="text-[10px] font-mono text-muted">Clave: {fp.code} · Tipo: {fp.type}</span>
                </div>
                {canManage && (
                  <button
                    onClick={() => handleDeleteFixedProp(fp.id)}
                    className="text-[10px] text-error hover:underline shrink-0"
                  >
                    Borrar
                  </button>
                )}
              </li>
            ))}
          </ul>
          {canManage && (
            <form onSubmit={handleAddFixedProp} className="border-t border-app-border pt-4 space-y-2">
              <input
                type="text"
                value={fpName}
                onChange={e => setFpName(e.target.value)}
                placeholder="Nombre (ej: Fecha de Compra)"
                className={inputCls}
                required
              />
              <select
                value={fpType}
                onChange={e => setFpType(e.target.value as any)}
                className={inputCls}
              >
                <option value="STRING">Texto (STRING)</option>
                <option value="DATE">Fecha (DATE)</option>
                <option value="NUMBER">Número (NUMBER)</option>
                <option value="BOOLEAN">Booleano (BOOLEAN)</option>
              </select>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!fpName.trim() || addFixedProp.isPending}
                  className="px-3 py-1.5 text-sm text-primary-fg bg-primary rounded-lg hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors"
                >
                  Añadir
                </button>
              </div>
              {fpError && <p className="text-error text-xs">{fpError}</p>}
            </form>
          )}
        </div>

        {/* Roles */}
        <div className="bg-card rounded-xl border border-app-border p-5 h-fit">
          <h2 className="text-[15px] font-semibold text-fg mb-4">Roles de Usuario</h2>
          <ul className="divide-y divide-app-border">
            {roles.length === 0 && (
              <li className="py-2 text-sm text-muted">Sin roles definidos</li>
            )}
            {roles.map(r => (
              <li key={r.id} className="py-2 flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-fg">{r.name}</span>
                <div className="flex gap-1 shrink-0">
                  {r.canWrite && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/15">
                      escritura
                    </span>
                  )}
                  {r.canManage && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-500 border border-amber-500/15">
                      gestión
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  )
}
