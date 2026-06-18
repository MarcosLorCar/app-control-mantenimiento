import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Folder, Search, Plus, ChevronRight, GitBranch, Package, Zap, Clock } from 'lucide-react'
import { useLocations } from '../../hooks/useLocations'
import { useInfrastructureTypes } from '../../hooks/useCatalog'
import { RoleGuard } from '../../components/RoleGuard'
import { LocationForm } from '../../components/forms/LocationForm'
import { formatRelativeTime } from '../../utils/date'

export function LocationList() {
  const navigate = useNavigate()
  const { data: locations = [], isLoading, error } = useLocations(null) // Fetch root locations
  const { data: infraTypes = [] } = useInfrastructureTypes()
  const [search, setSearch] = useState('')
  const [filterTypeId, setFilterTypeId] = useState<number | ''>('')
  const [showForm, setShowForm] = useState(false)

  const filtered = locations.filter(loc => {
    const matchText =
      loc.name.toLowerCase().includes(search.toLowerCase()) ||
      (loc.description ?? '').toLowerCase().includes(search.toLowerCase())
    const matchType = filterTypeId === '' || loc.infraTypeId === filterTypeId
    return matchText && matchType
  })

  if (isLoading) return (
    <div className="flex items-center justify-center py-20 text-muted text-sm">
      Cargando ubicaciones...
    </div>
  )

  if (error) return (
    <div className="flex items-center justify-center py-20 text-error text-sm">
      Error al cargar ubicaciones.
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Search and Filters row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-card border border-app-border rounded-lg px-3 h-10 flex-1 min-w-40 shadow-sm focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary transition-all">
          <Search className="w-4.5 h-4.5 text-muted shrink-0" />
          <input
            type="text"
            placeholder="Buscar por nombre o descripción..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-[13px] text-fg placeholder-muted outline-none"
          />
        </div>
        {infraTypes.length > 0 && (
          <select
            value={filterTypeId}
            onChange={e => setFilterTypeId(e.target.value ? Number(e.target.value) : '')}
            className="bg-card border border-app-border rounded-lg px-3 h-10 text-[13px] text-fg outline-none focus:ring-2 focus:ring-primary/40 shadow-sm transition-all"
          >
            <option value="">Todas las categorías</option>
            {infraTypes.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        )}
        <RoleGuard require="write">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 bg-primary text-primary-fg text-[13px] font-medium px-4 h-10 rounded-lg hover:bg-[var(--primary-hover)] shadow-sm transition-all shrink-0 hover:shadow"
          >
            <Plus className="w-4 h-4" />
            Nueva Ubicación
          </button>
        </RoleGuard>
      </div>

      {/* Count Indicator */}
      <p className="text-[13px] text-muted">
        {filtered.length} ubicación{filtered.length !== 1 ? 'es' : ''} principal{filtered.length !== 1 ? 'es' : ''}
      </p>

      {/* Cards list */}
      <div className="grid grid-cols-1 gap-4">
        {filtered.length === 0 && (
          <div className="col-span-full bg-card rounded-xl border border-app-border p-10 text-center text-muted text-sm shadow-sm">
            {search ? 'Sin resultados para la búsqueda.' : 'No hay ubicaciones registradas.'}
          </div>
        )}
        {filtered.map(loc => {
          const count = loc._count ?? { children: 0, materials: 0, actions: 0 }
          const hasType = !!loc.infraType
          const iconColor = loc.infraType?.color ?? 'var(--primary)'
          const iconBg = loc.infraType?.color ? `${loc.infraType.color}15` : 'var(--info-bg)'

          return (
            <div
              key={loc.id}
              onClick={() => navigate(`/locations/${loc.id}`)}
              role="button"
              className="flex items-start gap-4 p-5 rounded-xl border bg-card border-app-border hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group"
            >
              <div
                className="w-12 h-12 rounded-[10px] flex items-center justify-center shrink-0 transition-all group-hover:scale-110 overflow-hidden"
                style={{ backgroundColor: iconBg }}
              >
                {loc.image ? (
                  <img src={loc.image} alt={loc.name} className="w-full h-full object-cover" />
                ) : loc.infraType?.icon ? (
                  <span className="text-2xl">{loc.infraType.icon}</span>
                ) : (
                  <Folder className="w-5.5 h-5.5 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-fg truncate text-[15px] group-hover:text-primary transition-colors">{loc.name}</p>
                </div>
                {loc.infraType && (
                  <p className="text-[11px] font-medium tracking-wide uppercase mt-0.5" style={{ color: iconColor }}>
                    {loc.infraType.name}
                  </p>
                )}
                {loc.description ? (
                  <p className="text-[13px] text-fg-secondary mt-1.5 line-clamp-2">{loc.description}</p>
                ) : (
                  <p className="text-[13px] text-fg-secondary mt-1.5 line-clamp-2">{loc.formattedAddress ?? ''}</p>
                )}

                {/* Foreshadowing previews */}
                <div className="flex flex-wrap items-center gap-2 mt-4 text-[11px] text-fg-secondary">
                  {count.children > 0 && (
                    <div className="flex items-center gap-1 bg-app-bg px-1.5 py-0.5 rounded border border-app-border" title="Sub-ubicaciones">
                      <GitBranch className="w-3 h-3 text-muted" />
                      <span className="font-medium text-fg">{count.children}</span>
                      <span className="text-muted text-[9px]">subs</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 bg-app-bg px-1.5 py-0.5 rounded border border-app-border" title="Materiales Instalados">
                    <Package className="w-3 h-3 text-muted" />
                    <span className="font-medium text-fg">{count.materials}</span>
                    <span className="text-muted text-[9px]">materiales</span>
                  </div>
                  <div className="flex items-center gap-1 bg-app-bg px-1.5 py-0.5 rounded border border-app-border" title="Trabajos Realizados">
                    <Zap className="w-3 h-3 text-muted" />
                    <span className="font-medium text-fg">{count.actions}</span>
                    <span className="text-muted text-[9px]">trabajos</span>
                  </div>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-1.5 self-center text-[12px] text-fg-secondary shrink-0">
                <Clock className="w-3.5 h-3.5 text-muted" />
                {loc.lastActionAt ? (
                  <span>Última actividad: <span className="font-medium text-fg">{formatRelativeTime(loc.lastActionAt)}</span></span>
                ) : (
                  <span className="italic text-muted">Sin actividad</span>
                )}
              </div>
              <ChevronRight className="w-5 h-5 text-muted shrink-0 self-center group-hover:translate-x-1 transition-transform" />
            </div>
          )
        })}
      </div>

      {showForm && <LocationForm onClose={() => setShowForm(false)} />}
    </div>
  )
}
