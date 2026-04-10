import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Warehouse, Search, Plus, ChevronRight,
  GraduationCap, Droplets, Trophy, Users, Landmark,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useInfrastructures } from '../../hooks/useInfrastructures'
import { useInfrastructureTypes } from '../../hooks/useCatalog'
import { RoleGuard } from '../../components/RoleGuard'
import { InfrastructureForm } from './InfrastructureForm'

const TYPE_ICONS: Record<string, LucideIcon> = {
  'Colegios': GraduationCap,
  'Fuentes': Droplets,
  'Pistas deportivas': Trophy,
  'Centros Sociales': Users,
  'Dependencias municipales': Landmark,
}

function getInfraIcon(typeName?: string | null): LucideIcon {
  return typeName ? (TYPE_ICONS[typeName] ?? Warehouse) : Warehouse
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function InfrastructureList() {
  const navigate = useNavigate()
  const { data: infrastructures = [], isLoading, error } = useInfrastructures()
  const { data: infraTypes = [] } = useInfrastructureTypes()
  const [search, setSearch] = useState('')
  const [filterTypeId, setFilterTypeId] = useState<number | ''>('')
  const [showForm, setShowForm] = useState(false)
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      pos => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}, // silent failure — user denied or unavailable
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }, [])

  const filtered = infrastructures.filter(i => {
    const matchText =
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      (i.location ?? '').toLowerCase().includes(search.toLowerCase())
    const matchType = filterTypeId === '' || i.infraTypeId === filterTypeId
    return matchText && matchType
  })

  const nearbyId: number | null = (() => {
    if (!userCoords) return null
    let closest: { id: number; dist: number } | null = null
    for (const infra of filtered) {
      if (infra.latitude == null || infra.longitude == null) continue
      const dist = haversineMeters(userCoords.lat, userCoords.lng, infra.latitude, infra.longitude)
      if (dist <= 50 && (closest === null || dist < closest.dist)) {
        closest = { id: infra.id, dist }
      }
    }
    return closest?.id ?? null
  })()

  const sorted = nearbyId
    ? [
        ...filtered.filter(i => i.id === nearbyId),
        ...filtered.filter(i => i.id !== nearbyId),
      ]
    : filtered

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
      {/* Fila búsqueda + filtro + acción */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-card border border-app-border rounded-lg px-3 h-9 flex-1 min-w-40">
          <Search className="w-4 h-4 text-muted shrink-0" />
          <input
            type="text"
            placeholder="Buscar por nombre o ubicación..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-[13px] text-fg placeholder-muted outline-none"
          />
        </div>
        {infraTypes.length > 0 && (
          <select
            value={filterTypeId}
            onChange={e => setFilterTypeId(e.target.value ? Number(e.target.value) : '')}
            className="bg-card border border-app-border rounded-lg px-3 h-9 text-[13px] text-fg outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
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
        {sorted.length} infraestructura{sorted.length !== 1 ? 's' : ''}
      </p>

      {/* Cards */}
      <div className="flex flex-col gap-3">
        {sorted.length === 0 && (
          <div className="bg-card rounded-xl border border-app-border p-10 text-center text-muted text-sm">
            {search || filterTypeId ? 'Sin resultados para los filtros aplicados.' : 'No hay infraestructuras registradas.'}
          </div>
        )}
        {sorted.map(infra => {
          const Icon = getInfraIcon(infra.infraType?.name)
          const isNearby = infra.id === nearbyId
          return (
            <div
              key={infra.id}
              onClick={() => navigate(`/infrastructures/${infra.id}`)}
              role="button"
              className={`flex items-center gap-4 p-5 rounded-xl border transition-all cursor-pointer hover:shadow-sm ${
                isNearby
                  ? 'bg-[var(--success-bg)] border-[var(--success)]'
                  : 'bg-card border-app-border hover:border-primary/30'
              }`}
            >
              <div className={`w-11 h-11 rounded-[10px] flex items-center justify-center shrink-0 ${
                isNearby ? 'bg-white/60' : 'bg-info-bg'
              }`}>
                <Icon className={`w-5 h-5 ${isNearby ? 'text-[var(--success)]' : 'text-primary'}`} />
              </div>
              <div className="flex-1 min-w-0">
                {isNearby && (
                  <span
                    className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mb-1"
                    style={{ background: 'white', color: 'var(--success)', border: '1px solid var(--success)' }}
                  >
                    📍 Cerca de ti
                  </span>
                )}
                <p className="font-semibold text-fg truncate">{infra.name}</p>
                {infra.infraType && (
                  <p className={`text-[11px] font-medium truncate ${isNearby ? 'text-[var(--success)]/80' : 'text-primary/70'}`}>
                    {infra.infraType.name}
                  </p>
                )}
                {infra.location && (
                  <p className="text-[13px] text-muted truncate">{infra.location}</p>
                )}
                {infra.description && (
                  <p className="text-[13px] text-fg-secondary truncate mt-0.5">{infra.description}</p>
                )}
              </div>
              <ChevronRight className={`w-4 h-4 shrink-0 ${isNearby ? 'text-[var(--success)]' : 'text-muted'}`} />
            </div>
          )
        })}
      </div>

      {showForm && <InfrastructureForm onClose={() => setShowForm(false)} />}
    </div>
  )
}
