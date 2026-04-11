import { useState } from 'react'
import { Search, Plus, X, Pencil, Trash2 } from 'lucide-react'
import { getActionTypeIcon } from '../../utils/actionTypeIcons'
import { useAllActions, useDeleteActionGlobal } from '../../hooks/useActions'
import { RoleGuard } from '../../components/RoleGuard'
import { ActionForm } from './ActionForm'
import { MaterialForm } from './MaterialForm'
import type { ActionWithInfra } from '../../api/types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export function ActionsPage() {
  const { data: actions = [], isLoading } = useAllActions()
  const deleteMut = useDeleteActionGlobal()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<ActionWithInfra | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showMaterialForm, setShowMaterialForm] = useState(false)

  const filtered = actions.filter(a =>
    a.infrastructure.name.toLowerCase().includes(search.toLowerCase()) ||
    a.actionType.name.toLowerCase().includes(search.toLowerCase()) ||
    (a.performer?.fullName ?? '').toLowerCase().includes(search.toLowerCase())
  )

  function handleDelete(id: number) {
    if (!confirm('¿Eliminar esta acción?')) return
    deleteMut.mutate(id, {
      onSuccess: () => setSelected(null),
    })
  }

  return (
    <div className="flex flex-col h-full -m-5 md:-m-8">
      {/* Barra superior */}
      <div
        className="flex items-center justify-between px-7 py-3 bg-card shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2 bg-app-bg border border-app-border rounded-lg px-3 h-9 w-64">
          <Search className="w-4 h-4 text-muted shrink-0" />
          <input
            type="text"
            placeholder="Buscar tipo, infra, responsable..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-[13px] text-fg placeholder-muted outline-none"
          />
        </div>
        <RoleGuard require="write">
          <button
            onClick={() => setShowNewForm(true)}
            className="flex items-center gap-1.5 bg-primary text-primary-fg text-[13px] font-medium px-4 h-9 rounded-lg hover:bg-[var(--primary-hover)] transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            Nueva Acción
          </button>
        </RoleGuard>
      </div>

      {/* Tabla + Panel lateral */}
      <div className="flex flex-1 overflow-hidden p-5 md:p-7 gap-5">
        {/* Tabla */}
        <div className="flex-1 min-w-0 flex flex-col">
          <p className="text-[13px] text-muted mb-3">
            {filtered.length} acción{filtered.length !== 1 ? 'es' : ''}
          </p>

          {isLoading ? (
            <div className="flex-1 flex items-center justify-center text-muted text-sm">Cargando...</div>
          ) : (
            <div className="bg-card rounded-xl border border-app-border overflow-hidden flex flex-col">
              {/* Cabecera */}
              <div
                className="flex items-center h-10 bg-app-bg text-[11px] font-semibold text-muted uppercase tracking-wider shrink-0"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <div className="w-14 px-4">ID</div>
                <div className="w-36 px-3">Tipo</div>
                <div className="flex-1 px-3">Infraestructura</div>
                <div className="w-36 px-3">Responsable</div>
                <div className="w-24 px-3">Fecha</div>
              </div>

              {/* Filas */}
              <div className="overflow-y-auto">
                {filtered.length === 0 && (
                  <div className="flex items-center justify-center h-24 text-muted text-sm">
                    {search ? 'Sin resultados.' : 'No hay acciones registradas.'}
                  </div>
                )}
                {filtered.map(action => (
                  <div
                    key={action.id}
                    onClick={() => setSelected(action)}
                    className={`flex items-center h-[52px] text-[13px] cursor-pointer transition-colors ${
                      selected?.id === action.id ? 'bg-info-bg' : 'hover:bg-app-bg'
                    }`}
                    style={{ borderBottom: '1px solid var(--border)' }}
                  >
                    <div className="w-14 px-4 text-muted font-mono">#{action.id}</div>
                    <div className="w-36 px-3 text-fg font-medium truncate">{action.actionType.name}</div>
                    <div className="flex-1 px-3 text-fg-secondary truncate">{action.infrastructure.name}</div>
                    <div className="w-36 px-3 text-fg-secondary truncate">
                      {action.performer?.fullName ?? action.performer?.email ?? '—'}
                    </div>
                    <div className="w-24 px-3 text-muted">{formatDate(action.performedAt)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Panel lateral de detalle */}
        {selected && (
          <div className="w-[360px] shrink-0 bg-card rounded-xl border border-app-border flex flex-col overflow-hidden">
            {/* Header */}
            <div
              className="flex items-center justify-between h-14 px-5 shrink-0"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-bold text-fg">#{selected.id}</span>
                {(() => {
                  const Icon = getActionTypeIcon(selected.actionType.icon)
                  const color = selected.actionType.color ?? '#6B7280'
                  return (
                    <span
                      className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full"
                      style={{ background: color + '20', color }}
                    >
                      {Icon && <Icon className="w-3 h-3" />}
                      {selected.actionType.name}
                    </span>
                  )
                })()}
              </div>
              <button
                onClick={() => setSelected(null)}
                className="w-7 h-7 rounded-md flex items-center justify-center text-muted hover:bg-app-bg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 text-[13px]">
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-semibold tracking-[1px] text-muted uppercase">Infraestructura</p>
                <p className="text-fg">{selected.infrastructure.name}</p>
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-semibold tracking-[1px] text-muted uppercase">Descripción</p>
                <p className="text-fg leading-relaxed">{selected.description || '—'}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] font-semibold tracking-[1px] text-muted uppercase">Responsable</p>
                  <p className="text-fg truncate">{selected.performer?.fullName ?? selected.performer?.email ?? '—'}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] font-semibold tracking-[1px] text-muted uppercase">Fecha</p>
                  <p className="text-fg">{formatDate(selected.performedAt)}</p>
                </div>
              </div>

              <hr style={{ borderColor: 'var(--border)' }} />

              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-semibold tracking-[1px] text-muted uppercase">
                  Materiales consumidos
                </p>
                {selected.materials.length === 0 ? (
                  <p className="text-muted">Sin materiales registrados.</p>
                ) : (
                  selected.materials.map(m => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between bg-app-bg rounded-lg px-3 py-2"
                    >
                      <span className="text-fg truncate">{m.name}</span>
                      <span className="text-muted text-[12px] shrink-0 ml-2">
                        {String(m.quantity)} {m.unit}
                        {m.totalCost != null && ` · ${Number(m.totalCost).toFixed(2)}€`}
                      </span>
                    </div>
                  ))
                )}
                <RoleGuard require="write">
                  {selected.actionType.consumesMaterials && (
                    <button
                      onClick={() => setShowMaterialForm(true)}
                      className="text-[12px] text-primary font-medium mt-1 text-left hover:underline"
                    >
                      + Añadir material
                    </button>
                  )}
                </RoleGuard>
              </div>
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-end gap-2 px-5 py-3 shrink-0"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              <RoleGuard require="write">
                <button
                  onClick={() => setShowEditForm(true)}
                  className="flex items-center gap-1.5 text-[13px] font-medium text-fg-secondary border border-app-border px-4 py-2 rounded-lg hover:bg-app-bg transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Editar
                </button>
              </RoleGuard>
              <RoleGuard require="manage">
                <button
                  onClick={() => handleDelete(selected.id)}
                  disabled={deleteMut.isPending}
                  className="flex items-center gap-1.5 text-[13px] font-medium text-error border border-error-bg bg-error-bg px-4 py-2 rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Eliminar
                </button>
              </RoleGuard>
            </div>
          </div>
        )}
      </div>

      {/* Modales */}
      {showNewForm && (
        <ActionForm onClose={() => setShowNewForm(false)} />
      )}
      {showEditForm && selected && (
        <ActionForm
          infrastructureId={selected.infrastructureId}
          action={selected}
          onClose={() => { setShowEditForm(false) }}
        />
      )}
      {showMaterialForm && selected && (
        <MaterialForm
          actionId={selected.id}
          onClose={() => setShowMaterialForm(false)}
        />
      )}
    </div>
  )
}
