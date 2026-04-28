import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Warehouse, Search, Plus, ChevronRight } from 'lucide-react'
import { useInfrastructures } from '../../hooks/useInfrastructures'
import { useInfrastructureTypes } from '../../hooks/useCatalog'
import { RoleGuard } from '../../components/RoleGuard'
import { InfrastructureForm } from './InfrastructureForm'

export function InfrastructureList() {
  const navigate = useNavigate()
  const { data: infrastructures = [], isLoading, error } = useInfrastructures()
  const { data: infraTypes = [] } = useInfrastructureTypes()
  const [search, setSearch] = useState('')
  const [filterTypeId, setFilterTypeId] = useState<number | ''>('')
  const [showForm, setShowForm] = useState(false)

  const filtered = infrastructures.filter(i => {
    const matchText =
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      (i.code ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (i.description ?? '').toLowerCase().includes(search.toLowerCase())
    const matchType = filterTypeId === '' || i.infraTypeId === filterTypeId
    return matchText && matchType
  })

  if (isLoading) return (
    <div className="flex items-center justify-center py-20 text-muted text-sm">
      Cargando infraestructuras...
    </div>
  )

  if (error) return (
    <div className="flex items-center justify-center py-20 text-error text-sm">
      Error al cargar infraestructuras.
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Fila búsqueda + acción */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-card border border-app-border rounded-lg px-3 h-9 flex-1 min-w-40">
          <Search className="w-4 h-4 text-muted shrink-0" />
          <input
            type="text"
            placeholder="Buscar por código o nombre..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-[13px] text-fg placeholder-muted outline-none"
          />
        </div>
        {infraTypes.length > 0 && (
          <select
            value={filterTypeId}
            onChange={e => setFilterTypeId(e.target.value ? Number(e.target.value) : '')}
            className="bg-card border border-app-border rounded-lg px-3 h-9 text-[13px] text-fg outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="">Todos los tipos</option>
            {infraTypes.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        )}
        <RoleGuard require="write">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 bg-primary text-primary-fg text-[13px] font-medium px-4 h-9 rounded-lg hover:bg-[var(--primary-hover)] transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            Nueva
          </button>
        </RoleGuard>
      </div>

      {/* Contador */}
      <p className="text-[13px] text-muted">
        {filtered.length} infraestructura{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Cards */}
      <div className="flex flex-col gap-3">
        {filtered.length === 0 && (
          <div className="bg-card rounded-xl border border-app-border p-10 text-center text-muted text-sm">
            {search ? 'Sin resultados para la búsqueda.' : 'No hay infraestructuras registradas.'}
          </div>
        )}
        {filtered.map(infra => (
          <div
            key={infra.id}
            onClick={() => navigate(`/infrastructures/${infra.id}`)}
            role="button"
            className="flex items-center gap-4 p-5 rounded-xl border bg-card border-app-border hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer"
          >
            <div
              className="w-11 h-11 rounded-[10px] flex items-center justify-center shrink-0"
              style={{ backgroundColor: infra.infraType?.color ? `${infra.infraType.color}20` : 'var(--info-bg)' }}
            >
              {infra.infraType?.icon ? (
                <span className="text-xl">{infra.infraType.icon}</span>
              ) : (
                <Warehouse className="w-5 h-5 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-fg truncate">{infra.name}</p>
                {infra.code && <span className="text-[11px] font-mono text-muted shrink-0">{infra.code}</span>}
              </div>
              {infra.infraType && (
                <p className="text-[11px] font-medium truncate" style={{ color: infra.infraType.color ?? 'var(--primary)' }}>
                  {infra.infraType.name}
                </p>
              )}
              {infra.description && (
                <p className="text-[13px] text-fg-secondary truncate mt-0.5">{infra.description}</p>
              )}
            </div>
            <ChevronRight className="w-4 h-4 shrink-0 text-muted" />
          </div>
        ))}
      </div>

      {showForm && <InfrastructureForm onClose={() => setShowForm(false)} />}
    </div>
  )
}
