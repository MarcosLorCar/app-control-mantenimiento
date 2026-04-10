import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Warehouse, Search, Plus, ChevronRight } from 'lucide-react'
import { useInfrastructures } from '../../hooks/useInfrastructures'
import { RoleGuard } from '../../components/RoleGuard'
import { InfrastructureForm } from './InfrastructureForm'

export function InfrastructureList() {
  const navigate = useNavigate()
  const { data: infrastructures = [], isLoading, error } = useInfrastructures()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)

  const filtered = infrastructures.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    (i.location ?? '').toLowerCase().includes(search.toLowerCase())
  )

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
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-card border border-app-border rounded-lg px-3 h-9 flex-1 max-w-sm">
          <Search className="w-4 h-4 text-muted shrink-0" />
          <input
            type="text"
            placeholder="Buscar por nombre o ubicación..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-[13px] text-fg placeholder-muted outline-none"
          />
        </div>
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
            className="flex items-center gap-4 p-5 bg-card rounded-xl border border-app-border hover:border-primary/30 hover:shadow-sm transition-all"
          >
            <div className="w-11 h-11 rounded-[10px] bg-info-bg flex items-center justify-center shrink-0">
              <Warehouse className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-fg truncate">{infra.name}</p>
              {infra.location && (
                <p className="text-[13px] text-muted truncate">{infra.location}</p>
              )}
              {infra.description && (
                <p className="text-[13px] text-fg-secondary truncate mt-0.5">{infra.description}</p>
              )}
            </div>
            <button
              onClick={() => navigate(`/infrastructures/${infra.id}`)}
              className="flex items-center gap-1 text-[13px] text-primary font-medium hover:opacity-75 transition-opacity shrink-0"
            >
              Ver detalles
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {showForm && <InfrastructureForm onClose={() => setShowForm(false)} />}
    </div>
  )
}
