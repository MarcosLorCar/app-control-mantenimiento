import { useState } from 'react'
import {
  useInfrastructureTypes, useCreateInfrastructureType,
  useActionTypes, useRoles, useCreateActionType, useUpdateActionType,
  useMaterialTypes, useCreateMaterialType, useMaterialCategories, useCreateMaterialCategory,
} from '../../hooks/useCatalog'
import { useAuth } from '../../hooks/useAuth'
import { ICON_MAP, ICON_OPTIONS } from '../../utils/actionTypeIcons'

const inputCls = 'w-full border border-app-border rounded-lg px-3 py-2 text-sm bg-card text-fg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors'

function ActionTypeRow({ at, canManage }: {
  at: { id: number; code: string; name: string; icon: string | null; color: string | null }
  canManage: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [icon, setIcon] = useState(at.icon ?? '')
  const [color, setColor] = useState(at.color ?? '#6B7280')
  const updateMut = useUpdateActionType()

  const Icon = icon ? ICON_MAP[icon] : null
  const displayColor = at.color ?? '#6B7280'

  function handleSave() {
    updateMut.mutate(
      { id: at.id, body: { icon: icon || null, color } },
      { onSuccess: () => setEditing(false) }
    )
  }

  return (
    <li className="py-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {Icon ? (
            <span
              className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
              style={{ background: displayColor + '20' }}
            >
              <Icon className="w-3.5 h-3.5" style={{ color: displayColor }} />
            </span>
          ) : (
            <span className="w-6 h-6 rounded-md bg-gray-100 shrink-0" />
          )}
          <span className="text-sm text-fg truncate">{at.name}</span>
          <span className="text-[11px] font-mono text-muted">{at.code}</span>
        </div>
        {canManage && (
          <button
            onClick={() => setEditing(e => !e)}
            className="text-[11px] text-muted hover:text-fg-secondary shrink-0 transition-colors"
          >
            {editing ? 'Cerrar' : 'Icono'}
          </button>
        )}
      </div>

      {editing && (
        <div className="mt-2 p-3 bg-app-bg rounded-lg border border-app-border space-y-3">
          <div>
            <p className="text-[11px] font-semibold text-fg-secondary uppercase tracking-wide mb-1.5">Icono</p>
            <div className="grid grid-cols-10 gap-1">
              {ICON_OPTIONS.map(name => {
                const Ic = ICON_MAP[name]
                return (
                  <button
                    key={name}
                    type="button"
                    title={name}
                    onClick={() => setIcon(icon === name ? '' : name)}
                    className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
                      icon === name
                        ? 'bg-primary text-primary-fg'
                        : 'bg-card text-muted hover:bg-app-bg hover:text-fg'
                    }`}
                  >
                    <Ic className="w-3.5 h-3.5" />
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-[11px] font-semibold text-fg-secondary uppercase tracking-wide">Color</p>
            <input
              type="color"
              value={color}
              onChange={e => setColor(e.target.value)}
              className="w-8 h-8 rounded-md border border-app-border cursor-pointer bg-transparent"
            />
            <span className="text-[11px] text-muted font-mono">{color}</span>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="px-3 py-1 text-xs text-fg-secondary border border-app-border rounded-lg hover:bg-app-bg"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={updateMut.isPending}
              className="px-3 py-1 text-xs text-primary-fg bg-primary rounded-lg hover:bg-[var(--primary-hover)] disabled:opacity-50"
            >
              {updateMut.isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}
    </li>
  )
}

function MaterialTypeRow({ mt, canManage }: {
  mt: { id: number; code: string; name: string }
  canManage: boolean
}) {
  const [editing, setEditing] = useState(false)
  const { data: categories = [] } = useMaterialCategories(mt.id)
  const addCategoryMut = useCreateMaterialCategory(mt.id)

  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [dataType, setDataType] = useState<'STRING' | 'NUMBER' | 'BOOLEAN' | 'DATE' | 'ENUM'>('STRING')
  const [unit, setUnit] = useState('')
  const [required, setRequired] = useState(false)
  const [enumValuesRaw, setEnumValuesRaw] = useState('')
  const [error, setError] = useState('')

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim() || !name.trim()) return
    setError('')

    const enumValues = dataType === 'ENUM'
      ? enumValuesRaw.split(',').map(s => s.trim()).filter(Boolean)
      : []

    addCategoryMut.mutate(
      {
        code: code.trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_'),
        name: name.trim(),
        dataType,
        unit: unit.trim() || undefined,
        required,
        enumValues,
      },
      {
        onSuccess: () => {
          setCode('')
          setName('')
          setDataType('STRING')
          setUnit('')
          setRequired(false)
          setEnumValuesRaw('')
          setEditing(false)
        },
        onError: (err: any) => setError(err?.error?.message ?? 'Error al añadir atributo'),
      }
    )
  }

  return (
    <li className="py-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-fg">{mt.name}</span>
            <span className="text-[10px] font-mono text-muted">({mt.code})</span>
          </div>
          
          {categories.length > 0 ? (
            <div className="flex flex-wrap gap-1 mt-1">
              {categories.map(cat => (
                <span
                  key={cat.id}
                  className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded bg-app-bg text-fg-secondary border border-app-border"
                  title={`${cat.dataType} ${cat.required ? '(Requerido)' : ''}`}
                >
                  {cat.name}{cat.unit ? ` (${cat.unit})` : ''}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[10px] text-muted italic mt-0.5">Sin atributos de catálogo.</p>
          )}
        </div>
        
        {canManage && (
          <button
            onClick={() => setEditing(e => !e)}
            className="text-[11px] font-medium text-primary hover:underline shrink-0"
          >
            {editing ? 'Cerrar' : '+ Atributo'}
          </button>
        )}
      </div>

      {editing && (
        <form onSubmit={handleSave} className="mt-2.5 p-3 bg-app-bg/60 rounded-lg border border-app-border space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-semibold text-fg-secondary mb-1">Nombre</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ej: Voltaje"
                className="w-full border border-app-border rounded px-2 py-1 bg-card text-fg focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-fg-secondary mb-1">Código</label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="Ej: voltage_v"
                className="w-full border border-app-border rounded px-2 py-1 bg-card text-fg focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-semibold text-fg-secondary mb-1">Tipo de dato</label>
              <select
                value={dataType}
                onChange={e => setDataType(e.target.value as any)}
                className="w-full border border-app-border rounded px-2 py-1 bg-card text-fg focus:outline-none"
              >
                <option value="STRING">Texto</option>
                <option value="NUMBER">Número</option>
                <option value="BOOLEAN">Booleano (Sí/No)</option>
                <option value="DATE">Fecha</option>
                <option value="ENUM">Lista de opciones (Enum)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-fg-secondary mb-1">Unidad (Opcional)</label>
              <input
                type="text"
                value={unit}
                onChange={e => setUnit(e.target.value)}
                placeholder="Ej: V, W, kg"
                className="w-full border border-app-border rounded px-2 py-1 bg-card text-fg focus:outline-none"
              />
            </div>
          </div>

          {dataType === 'ENUM' && (
            <div>
              <label className="block text-[10px] font-semibold text-fg-secondary mb-1">Valores permitidos (Separados por comas)</label>
              <input
                type="text"
                value={enumValuesRaw}
                onChange={e => setEnumValuesRaw(e.target.value)}
                placeholder="Ej: Cálida, Neutra, Fría"
                className="w-full border border-app-border rounded px-2 py-1 bg-card text-fg focus:outline-none"
                required
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`req-${mt.id}`}
              checked={required}
              onChange={e => setRequired(e.target.checked)}
              className="rounded border-app-border text-primary focus:ring-primary/40"
            />
            <label htmlFor={`req-${mt.id}`} className="text-[10px] font-semibold text-fg-secondary">
              Es obligatorio al registrar
            </label>
          </div>

          {error && <p className="text-error text-[10px]">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="px-2.5 py-1 border border-app-border rounded text-[11px] text-fg-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={addCategoryMut.isPending}
              className="px-2.5 py-1 bg-primary text-primary-fg rounded text-[11px] font-medium"
            >
              {addCategoryMut.isPending ? 'Añadir' : 'Añadir'}
            </button>
          </div>
        </form>
      )}
    </li>
  )
}

export function Catalog() {
  const { user } = useAuth()
  const canManage = !!user?.can_manage

  const { data: infraTypes = [] } = useInfrastructureTypes()
  const { data: actionTypes = [] } = useActionTypes()
  const { data: materialTypes = [] } = useMaterialTypes()
  const { data: roles = [] } = useRoles()

  const addInfraType = useCreateInfrastructureType()
  const addActionType = useCreateActionType()
  const addMaterialType = useCreateMaterialType()

  // InfraType form state
  const [itName, setItName] = useState('')
  const [itColor, setItColor] = useState('#6B7280')
  const [itError, setItError] = useState('')

  // ActionType form state
  const [atCode, setAtCode] = useState('')
  const [atName, setAtName] = useState('')
  const [atError, setAtError] = useState('')

  // MaterialType form state
  const [mtCode, setMtCode] = useState('')
  const [mtName, setMtName] = useState('')
  const [mtError, setMtError] = useState('')

  function handleAddInfraType(e: React.FormEvent) {
    e.preventDefault()
    if (!itName.trim()) return
    setItError('')
    addInfraType.mutate(
      { name: itName.trim(), color: itColor },
      {
        onSuccess: () => { setItName(''); setItColor('#6B7280') },
        onError: (err: any) => setItError(err?.error?.message ?? 'Error al añadir'),
      }
    )
  }

  function handleAddActionType(e: React.FormEvent) {
    e.preventDefault()
    if (!atCode.trim() || !atName.trim()) return
    setAtError('')
    addActionType.mutate(
      { code: atCode.trim(), name: atName.trim() },
      {
        onSuccess: () => { setAtCode(''); setAtName('') },
        onError: (err: any) => setAtError(err?.error?.message ?? 'Error al añadir'),
      }
    )
  }

  function handleAddMaterialType(e: React.FormEvent) {
    e.preventDefault()
    if (!mtCode.trim() || !mtName.trim()) return
    setMtError('')
    addMaterialType.mutate(
      { code: mtCode.trim(), name: mtName.trim() },
      {
        onSuccess: () => { setMtCode(''); setMtName('') },
        onError: (err: any) => setMtError(err?.error?.message ?? 'Error al añadir'),
      }
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

        {/* Tipos de infraestructura */}
        <div className="bg-card rounded-xl border border-app-border p-5">
          <h2 className="text-[15px] font-semibold text-fg mb-4">Tipos de infraestructura</h2>
          <ul className="divide-y divide-app-border mb-4">
            {infraTypes.length === 0 && (
              <li className="py-2 text-sm text-muted">Sin tipos definidos</li>
            )}
            {infraTypes.map(it => (
              <li key={it.id} className="py-2.5 flex items-center gap-2">
                {it.color && (
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: it.color }} />
                )}
                <span className="text-sm text-fg truncate">{it.name}</span>
              </li>
            ))}
          </ul>
          {canManage && (
            <form onSubmit={handleAddInfraType} className="border-t border-app-border pt-4 space-y-2">
              <input
                type="text"
                value={itName}
                onChange={e => setItName(e.target.value)}
                placeholder="Nombre del tipo"
                className={inputCls}
              />
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={itColor}
                  onChange={e => setItColor(e.target.value)}
                  className="w-10 h-9 rounded-lg border border-app-border cursor-pointer bg-transparent shrink-0"
                />
                <span className="text-[11px] text-muted font-mono">{itColor}</span>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!itName.trim() || addInfraType.isPending}
                  className="px-3 py-1.5 text-sm text-primary-fg bg-primary rounded-lg hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors"
                >
                  {addInfraType.isPending ? 'Añadiendo...' : 'Añadir'}
                </button>
              </div>
              {itError && <p className="text-error text-xs">{itError}</p>}
            </form>
          )}
        </div>

        {/* Tipos de acción */}
        <div className="bg-card rounded-xl border border-app-border p-5">
          <h2 className="text-[15px] font-semibold text-fg mb-4">Tipos de acción</h2>
          <ul className="divide-y divide-app-border mb-4">
            {actionTypes.length === 0 && (
              <li className="py-2 text-sm text-muted">Sin tipos definidos</li>
            )}
            {actionTypes.map(at => (
              <ActionTypeRow key={at.id} at={at} canManage={canManage} />
            ))}
          </ul>
          {canManage && (
            <form onSubmit={handleAddActionType} className="border-t border-app-border pt-4 space-y-2">
              <input
                type="text"
                value={atCode}
                onChange={e => setAtCode(e.target.value)}
                placeholder="Código (ej: inspection)"
                className={inputCls}
              />
              <input
                type="text"
                value={atName}
                onChange={e => setAtName(e.target.value)}
                placeholder="Nombre"
                className={inputCls}
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!atCode.trim() || !atName.trim() || addActionType.isPending}
                  className="px-3 py-1.5 text-sm text-primary-fg bg-primary rounded-lg hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors"
                >
                  {addActionType.isPending ? 'Añadiendo...' : 'Añadir'}
                </button>
              </div>
              {atError && <p className="text-error text-xs">{atError}</p>}
            </form>
          )}
        </div>

        {/* Tipos de material */}
        <div className="bg-card rounded-xl border border-app-border p-5">
          <h2 className="text-[15px] font-semibold text-fg mb-4">Tipos de material</h2>
          <ul className="divide-y divide-app-border mb-4">
            {materialTypes.length === 0 && (
              <li className="py-2 text-sm text-muted">Sin tipos definidos</li>
            )}
            {materialTypes.map(mt => (
              <MaterialTypeRow key={mt.id} mt={mt} canManage={canManage} />
            ))}
          </ul>
          {canManage && (
            <form onSubmit={handleAddMaterialType} className="border-t border-app-border pt-4 space-y-2">
              <input
                type="text"
                value={mtCode}
                onChange={e => setMtCode(e.target.value)}
                placeholder="Código (ej: led_bulb)"
                className={inputCls}
              />
              <input
                type="text"
                value={mtName}
                onChange={e => setMtName(e.target.value)}
                placeholder="Nombre"
                className={inputCls}
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!mtCode.trim() || !mtName.trim() || addMaterialType.isPending}
                  className="px-3 py-1.5 text-sm text-primary-fg bg-primary rounded-lg hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors"
                >
                  {addMaterialType.isPending ? 'Añadiendo...' : 'Añadir'}
                </button>
              </div>
              {mtError && <p className="text-error text-xs">{mtError}</p>}
            </form>
          )}
        </div>

        {/* Roles */}
        <div className="bg-card rounded-xl border border-app-border p-5">
          <h2 className="text-[15px] font-semibold text-fg mb-4">Roles</h2>
          <ul className="divide-y divide-app-border">
            {roles.length === 0 && (
              <li className="py-2 text-sm text-muted">Sin roles definidos</li>
            )}
            {roles.map(r => (
              <li key={r.id} className="py-2 flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-fg">{r.name}</span>
                <div className="flex gap-1 shrink-0">
                  {r.canWrite && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-success-bg text-success">
                      escritura
                    </span>
                  )}
                  {r.canManage && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-warning-bg text-warning">
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
