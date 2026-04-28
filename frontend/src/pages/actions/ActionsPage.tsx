import { useState } from 'react'
import { Search, Plus, X, Pencil, Trash2 } from 'lucide-react'
import { getActionTypeIcon } from '../../utils/actionTypeIcons'
import { useActions, useDeleteAction } from '../../hooks/useActions'
import { RoleGuard } from '../../components/RoleGuard'
import { ActionForm } from './ActionForm'
import type { Action } from '../../api/types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export function ActionsPage() {
  const { data: actions = [], isLoading } = useActions()
  const deleteMut = useDeleteAction()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Action | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)

  const filtered = actions.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.type.name.toLowerCase().includes(search.toLowerCase()) ||
    a.material.name.toLowerCase().includes(search.toLowerCase()) ||
    (a.performer?.fullName ?? '').toLowerCase().includes(search.toLowerCase())
  )

  function handleDelete(id: number) {
    if (!confirm('¿Eliminar esta acción?')) return
    deleteMut.mutate(id, { onSuccess: () => setSelected(null) })
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
            placeholder="Buscar título, tipo, material..."
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
        <div className="flex-1 min-w-0 flex flex-col">
          <p className="text-[13px] text-muted mb-3">
            {filtered.length} acción{filtered.length !== 1 ? 'es' : ''}
          </p>

          {isLoading ? (
            <div className="flex-1 flex items-center justify-center text-muted text-sm">Cargando...</div>
          ) : (
            <div className="bg-card rounded-xl border border-app-border overflow-hidden flex flex-col">
              <div
                className="flex items-center h-10 bg-app-bg text-[11px] font-semibold text-muted uppercase tracking-wider shrink-0"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <div className="w-14 px-4">ID</div>
                <div className="w-32 px-3">Tipo</div>
                <div className="flex-1 px-3">Título</div>
                <div className="w-40 px-3">Material</div>
                <div className="w-24 px-3">Fecha</div>
              </div>

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
                    <div className="w-32 px-3 flex items-center gap-1.5 min-w-0">
                      {(() => {
                        const Icon = getActionTypeIcon(action.type.icon)
                        const color = action.type.color ?? '#6B7280'
                        return Icon ? <Icon className="w-3.5 h-3.5 shrink-0" style={{ color }} /> : null
                      })()}
                      <span className="text-fg font-medium truncate">{action.type.name}</span>
                    </div>
                    <div className="flex-1 px-3 text-fg truncate">{action.title}</div>
                    <div className="w-40 px-3 text-fg-secondary truncate">
                      {action.material.code && <span className="font-mono text-[11px] text-muted mr-1">{action.material.code}</span>}
                      {action.material.name}
                    </div>
                    <div className="w-24 px-3 text-muted">{formatDate(action.performedAt)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Panel lateral */}
        {selected && (
          <div className="w-[360px] shrink-0 bg-card rounded-xl border border-app-border flex flex-col overflow-hidden">
            <div
              className="flex items-center justify-between h-14 px-5 shrink-0"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[14px] font-bold text-fg shrink-0">#{selected.id}</span>
                {(() => {
                  const Icon = getActionTypeIcon(selected.type.icon)
                  const color = selected.type.color ?? '#6B7280'
                  return (
                    <span
                      className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full shrink-0"
                      style={{ background: color + '20', color }}
                    >
                      {Icon && <Icon className="w-3 h-3" />}
                      {selected.type.name}
                    </span>
                  )
                })()}
              </div>
              <button
                onClick={() => setSelected(null)}
                className="w-7 h-7 rounded-md flex items-center justify-center text-muted hover:bg-app-bg transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 text-[13px]">
              <div>
                <p className="text-[10px] font-semibold tracking-[1px] text-muted uppercase mb-1">Título</p>
                <p className="text-fg font-medium">{selected.title}</p>
              </div>

              <div>
                <p className="text-[10px] font-semibold tracking-[1px] text-muted uppercase mb-1">Material</p>
                <p className="text-fg">
                  <span className="font-mono text-[11px] text-muted mr-1">{selected.material.code}</span>
                  {selected.material.name}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold tracking-[1px] text-muted uppercase mb-1">Descripción</p>
                <p className="text-fg leading-relaxed">{selected.description || '—'}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-semibold tracking-[1px] text-muted uppercase mb-1">Responsable</p>
                  <p className="text-fg truncate">{selected.performer?.fullName ?? selected.performer?.email ?? '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold tracking-[1px] text-muted uppercase mb-1">Fecha</p>
                  <p className="text-fg">{formatDate(selected.performedAt)}</p>
                </div>
              </div>
            </div>

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

      {showNewForm && <ActionForm onClose={() => setShowNewForm(false)} />}
      {showEditForm && selected && (
        <ActionForm
          action={selected}
          onClose={() => { setShowEditForm(false) }}
        />
      )}
    </div>
  )
}
