import { useState, useRef } from 'react'
import { Upload } from 'lucide-react'
import {
  useActionTypes, useRoles, useCreateActionType, useUpdateActionType,
  useInfrastructureTypes, useCreateInfrastructureType, useUploadInfraTypeIcon,
} from '../../hooks/useCatalog'
import { useAuth } from '../../hooks/useAuth'
import { ICON_MAP, ICON_OPTIONS } from '../../utils/actionTypeIcons'

const inputCls = 'w-full border border-app-border rounded-lg px-3 py-2 text-sm bg-card text-fg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors'

function ActionTypeRow({ at, canManage }: {
  at: { id: number; name: string; consumesMaterials: boolean; icon: string | null; color: string | null }
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
          {at.consumesMaterials && (
            <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-info-bg text-primary">
              materiales
            </span>
          )}
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
          {/* Icon picker */}
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

          {/* Color picker */}
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

function InfraTypeRow({ it, canManage }: {
  it: { id: number; name: string; iconUrl: string | null }
  canManage: boolean
}) {
  const uploadMut = useUploadInfraTypeIcon()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadError, setUploadError] = useState('')

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError('')
    uploadMut.mutate(
      { id: it.id, file },
      { onError: (err: any) => setUploadError(err?.error?.message ?? 'Error al subir icono') }
    )
    e.target.value = ''
  }

  return (
    <li className="py-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {it.iconUrl ? (
            <img
              src={it.iconUrl}
              alt={it.name}
              className="w-6 h-6 object-contain rounded-sm shrink-0"
            />
          ) : (
            <span className="w-6 h-6 rounded-sm bg-gray-100 shrink-0" />
          )}
          <span className="text-sm text-fg truncate">{it.name}</span>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMut.isPending}
            className="flex items-center gap-1 text-[11px] text-muted hover:text-fg-secondary shrink-0 transition-colors disabled:opacity-50"
          >
            <Upload className="w-3 h-3" />
            {uploadMut.isPending ? 'Subiendo...' : 'Subir'}
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/svg+xml,image/jpeg"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      {uploadError && <p className="text-[11px] text-error mt-1">{uploadError}</p>}
    </li>
  )
}

export function Catalog() {
  const [typeName, setTypeName] = useState('')
  const [consumesMaterials, setConsumesMaterials] = useState(false)
  const [typeError, setTypeError] = useState('')

  const [infraTypeName, setInfraTypeName] = useState('')
  const [infraTypeError, setInfraTypeError] = useState('')

  const { user } = useAuth()
  const { data: actionTypes = [] } = useActionTypes()
  const { data: roles = [] } = useRoles()
  const { data: infraTypes = [] } = useInfrastructureTypes()
  const addType = useCreateActionType()
  const addInfraType = useCreateInfrastructureType()

  const canManage = !!user?.can_manage

  function handleAddType(e: React.FormEvent) {
    e.preventDefault()
    if (!typeName.trim()) return
    setTypeError('')
    addType.mutate(
      { name: typeName.trim(), consumesMaterials },
      {
        onSuccess: () => { setTypeName(''); setConsumesMaterials(false) },
        onError: (err: any) => setTypeError(err?.error?.message ?? 'Error al añadir tipo'),
      }
    )
  }

  function handleAddInfraType(e: React.FormEvent) {
    e.preventDefault()
    if (!infraTypeName.trim()) return
    setInfraTypeError('')
    addInfraType.mutate(
      { name: infraTypeName.trim() },
      {
        onSuccess: () => setInfraTypeName(''),
        onError: (err: any) => setInfraTypeError(err?.error?.message ?? 'Error al añadir tipo'),
      }
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

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
            <form onSubmit={handleAddType} className="border-t border-app-border pt-4 space-y-2">
              <input
                type="text"
                value={typeName}
                onChange={e => setTypeName(e.target.value)}
                placeholder="Nombre del tipo"
                className={inputCls}
              />
              <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-sm text-fg-secondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consumesMaterials}
                    onChange={e => setConsumesMaterials(e.target.checked)}
                    className="rounded"
                  />
                  Consume materiales
                </label>
                <button
                  type="submit"
                  disabled={!typeName.trim() || addType.isPending}
                  className="px-3 py-1.5 text-sm text-primary-fg bg-primary rounded-lg hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors shrink-0"
                >
                  {addType.isPending ? 'Añadiendo...' : 'Añadir'}
                </button>
              </div>
              {typeError && <p className="text-error text-xs">{typeError}</p>}
            </form>
          )}
        </div>

        {/* Tipos de infraestructura */}
        <div className="bg-card rounded-xl border border-app-border p-5">
          <h2 className="text-[15px] font-semibold text-fg mb-4">Tipos de infraestructura</h2>
          <ul className="divide-y divide-app-border mb-4">
            {infraTypes.length === 0 && (
              <li className="py-2 text-sm text-muted">Sin tipos definidos</li>
            )}
            {infraTypes.map(it => (
              <InfraTypeRow key={it.id} it={it} canManage={canManage} />
            ))}
          </ul>
          {canManage && (
            <form onSubmit={handleAddInfraType} className="border-t border-app-border pt-4 space-y-2">
              <input
                type="text"
                value={infraTypeName}
                onChange={e => setInfraTypeName(e.target.value)}
                placeholder="Nombre del tipo"
                className={inputCls}
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!infraTypeName.trim() || addInfraType.isPending}
                  className="px-3 py-1.5 text-sm text-primary-fg bg-primary rounded-lg hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors"
                >
                  {addInfraType.isPending ? 'Añadiendo...' : 'Añadir'}
                </button>
              </div>
              {infraTypeError && <p className="text-error text-xs">{infraTypeError}</p>}
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
