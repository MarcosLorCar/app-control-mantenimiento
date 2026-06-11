import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus } from 'lucide-react'
import { useActions } from '../../hooks/useActions'
import { RoleGuard } from '../../components/RoleGuard'
import { ActionForm } from './ActionForm'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export function ActionsPage() {
  const navigate = useNavigate()
  const { data: actions = [], isLoading } = useActions()

  const [search, setSearch] = useState('')
  const [showNewForm, setShowNewForm] = useState(false)

  const filtered = actions.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    (a.description ?? '').toLowerCase().includes(search.toLowerCase()) ||
    a.materials.some(am => am.material.name.toLowerCase().includes(search.toLowerCase())) ||
    (a.location?.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (a.performer?.fullName ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full -m-5 md:-m-8">
      {/* Barra superior */}
      <div
        className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between px-5 sm:px-7 py-3 bg-card shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2 bg-app-bg border border-app-border rounded-lg px-3 h-9 w-full sm:w-64">
          <Search className="w-4 h-4 text-muted shrink-0" />
          <input
            type="text"
            placeholder="Buscar título, material, ubicación..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-[13px] text-fg placeholder-muted outline-none"
          />
        </div>
        <RoleGuard require="write">
          <button
            onClick={() => setShowNewForm(true)}
            className="flex items-center justify-center gap-1.5 bg-primary text-primary-fg text-[13px] font-medium px-4 h-9 rounded-lg hover:bg-[var(--primary-hover)] transition-colors shrink-0 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            Nueva Acción
          </button>
        </RoleGuard>
      </div>

      {/* Tabla */}
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
                className="hidden md:flex items-center h-10 bg-app-bg text-[11px] font-semibold text-muted uppercase tracking-wider shrink-0"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <div className="w-14 px-4">ID</div>
                <div className="flex-1 px-3">Título</div>
                <div className="w-44 px-3">Ubicación</div>
                <div className="w-32 px-3">Materiales</div>
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
                    onClick={() => navigate(`/actions/${action.id}`)}
                    className="flex flex-col md:flex-row md:items-center min-h-[52px] py-3 md:py-0 text-[13px] cursor-pointer hover:bg-app-bg transition-colors px-4 md:px-0"
                    style={{ borderBottom: '1px solid var(--border)' }}
                  >
                    <div className="flex items-center justify-between md:justify-start md:w-14 md:px-4 mb-1 md:mb-0">
                      <span className="text-muted font-mono">#{action.id}</span>
                      {/* Mobile date badge */}
                      <span className="text-muted text-[11px] md:hidden">{formatDate(action.performedAt)}</span>
                    </div>
                    <div className="flex-1 md:px-3 text-fg font-medium truncate mb-1 md:mb-0 text-[14px] md:text-[13px]">
                      {action.title}
                    </div>
                    
                    {/* Mobile metadata detail block */}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted md:hidden mb-1 md:mb-0">
                      {action.location?.name && (
                        <span>Ubicación: <span className="text-fg-secondary font-medium">{action.location.name}</span></span>
                      )}
                      {action.materials.length > 0 && (
                        <span>
                          Materiales:{' '}
                          <span className="text-primary font-semibold">
                            {action.materials.length === 1
                              ? action.materials[0].material.name
                              : `${action.materials.length} materiales`}
                          </span>
                        </span>
                      )}
                    </div>

                    <div className="hidden md:block w-44 px-3 text-fg-secondary truncate">
                      {action.location?.name ?? <span className="text-muted">—</span>}
                    </div>
                    <div className="hidden md:block w-32 px-3 text-fg-secondary truncate">
                      {action.materials.length === 0 ? (
                        <span className="text-muted">—</span>
                      ) : action.materials.length === 1 ? (
                        action.materials[0].material.name
                      ) : (
                        <span className="font-semibold text-primary">{action.materials.length} materiales</span>
                      )}
                    </div>
                    <div className="hidden md:block w-24 px-3 text-muted">{formatDate(action.performedAt)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showNewForm && <ActionForm onClose={() => setShowNewForm(false)} />}
    </div>
  )
}
