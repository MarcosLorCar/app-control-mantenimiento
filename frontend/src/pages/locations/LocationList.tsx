import { useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, ChevronRight, Package, ClipboardPen, Clock, X } from 'lucide-react'
import { useLocations } from '../../hooks/useLocations'
import { useInfrastructureTypes } from '../../hooks/useCatalog'
import { RoleGuard } from '../../components/RoleGuard'
import { LocationForm } from '../../components/forms/LocationForm'
import { getCategoryIcon } from '../../utils/categoryIcons'
import { getCategoryColor, withAlpha } from '../../utils/categoryColors'
import { formatRelativeTime } from '../../utils/date'
import { useDensity } from '../../hooks/useDensity'
import { DensityToggle } from '../../components/ui/DensityToggle'
import type { Location } from '../../api/types'

export function LocationList() {
  const navigate = useNavigate()
  const { data: locations = [], isLoading, error } = useLocations(null) // Fetch root locations
  const { data: infraTypes = [] } = useInfrastructureTypes()
  const [search, setSearch] = useState('')
  const [filterTypeId, setFilterTypeId] = useState<number | ''>('')
  const [showForm, setShowForm] = useState(false)
  const { density, setDensity } = useDensity()

  const filtered = locations.filter(loc => {
    const matchText =
      loc.name.toLowerCase().includes(search.toLowerCase()) ||
      (loc.description ?? '').toLowerCase().includes(search.toLowerCase())
    const matchType = filterTypeId === '' || loc.infraTypeId === filterTypeId
    return matchText && matchType
  })

  const sorted = useMemo(
    () =>
      [...filtered].sort((a, b) =>
        a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
      ),
    [filtered]
  )

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
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="text-muted hover:text-fg shrink-0"
              title="Limpiar búsqueda"
            >
              <X className="w-4 h-4" />
            </button>
          )}
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
        <DensityToggle density={density} onChange={setDensity} />
      </div>

      {/* Count Indicator */}
      <p className="text-[13px] text-muted">
        {sorted.length} ubicación{sorted.length !== 1 ? 'es' : ''} principal{sorted.length !== 1 ? 'es' : ''}
      </p>

      {/* Cards list */}
      <div className="relative pr-5">
        {sorted.length === 0 && (
          <div className="bg-card rounded-xl border border-app-border p-10 text-center text-muted text-sm shadow-sm">
            {search ? 'Sin resultados para la búsqueda.' : 'No hay ubicaciones registradas.'}
          </div>
        )}

        <div className={`grid grid-cols-1 ${density === 'compact' ? 'gap-1.5' : 'gap-4'} transition-all`}>
          {sorted.map(loc => {
            const count = loc._count ?? { children: 0, materials: 0, actions: 0 }
            const CatIcon = getCategoryIcon(loc.infraType?.icon)
            const color = getCategoryColor(loc.infraType?.color)

            if (density === 'compact') {
              return (
                <div
                  key={loc.id}
                  onClick={() => navigate(`/locations/${loc.id}`)}
                  role="button"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg border bg-card border-app-border hover:border-primary/40 transition-all cursor-pointer"
                >
                  {loc.image ? (
                    <img src={loc.image} alt={loc.name} className="w-8 h-8 rounded-md object-cover shrink-0" />
                  ) : (
                    <div className="w-8 h-8 flex items-center justify-center shrink-0">
                      <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: color }} />
                    </div>
                  )}
                  <span className="font-medium text-fg text-sm truncate flex-1">{loc.name}</span>
                  <ChevronRight className="w-4 h-4 text-muted shrink-0" />
                </div>
              )
            }

            return (
              <div
                key={loc.id}
                onClick={() => navigate(`/locations/${loc.id}`)}
                role="button"
                className="flex items-start gap-4 p-5 rounded-xl border bg-card border-app-border hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group"
              >
                <div
                  className="w-12 h-12 rounded-[10px] flex items-center justify-center shrink-0 transition-all group-hover:scale-110 overflow-hidden"
                  style={{ backgroundColor: withAlpha(color, 0.1) }}
                >
                  {loc.image ? (
                    <img src={loc.image} alt={loc.name} className="w-full h-full object-cover" />
                  ) : (
                    <CatIcon className="w-5.5 h-5.5" style={{ color }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-fg truncate text-[15px] group-hover:text-primary transition-colors">{loc.name}</p>
                  </div>
                  {loc.infraType && (
                    <p className="flex items-center gap-1 text-[11px] font-medium tracking-wide uppercase mt-0.5 text-muted">
                      <CatIcon className="w-3 h-3 shrink-0" style={{ color }} />
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
                    <div className="flex items-center gap-1 bg-app-bg px-1.5 py-0.5 rounded border border-app-border" title="Materiales Instalados">
                      <Package className="w-3 h-3 text-muted" />
                      <span className="font-medium text-fg">{count.materials}</span>
                      <span className="text-muted text-[9px]">materiales</span>
                    </div>
                    <div className="flex items-center gap-1 bg-app-bg px-1.5 py-0.5 rounded border border-app-border" title="Trabajos Realizados">
                      <ClipboardPen className="w-3 h-3 text-muted" />
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
      </div>

      <RoleGuard require="write">
        <button
          onClick={() => setShowForm(true)}
          className="fixed bottom-8 right-8 w-14 h-14 bg-primary hover:bg-[var(--primary-hover)] text-primary-fg rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all z-10"
          title="Nueva Ubicación"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </RoleGuard>

      {showForm && <LocationForm onClose={() => setShowForm(false)} />}
    </div>
  )
}
