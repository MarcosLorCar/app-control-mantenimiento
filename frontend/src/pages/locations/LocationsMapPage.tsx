import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Search, ExternalLink } from 'lucide-react'
import { useLocations } from '../../hooks/useLocations'
import { useInfrastructureTypes } from '../../hooks/useCatalog'
import { useSystemSettings } from '../../hooks/useSystemSettings'
import { getCategoryIcon } from '../../utils/categoryIcons'

// Fix Leaflet marker icon asset paths inside Vite
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

const DefaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
})
L.Marker.prototype.options.icon = DefaultIcon

function MapCenterController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom)
  }, [center, zoom, map])
  return null
}

export function LocationsMapPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const { data: locations = [], isLoading: loadingLocs } = useLocations(undefined) // Fetch all locations
  const { data: infraTypes = [] } = useInfrastructureTypes()
  const { data: settings = [] } = useSystemSettings()

  const defaultLat = Number(settings.find(s => s.key === 'default_latitude')?.value ?? '38.9863')
  const defaultLng = Number(settings.find(s => s.key === 'default_longitude')?.value ?? '-3.9291')
  const defaultCenter: [number, number] = [defaultLat, defaultLng]

  const [search, setSearch] = useState('')
  const [filterTypeId, setFilterTypeId] = useState<number | ''>('')

  // Read coordinates from query params
  const paramLat = searchParams.get('lat')
  const paramLng = searchParams.get('lng')

  const centerCoords = useMemo<[number, number]>(() => {
    if (paramLat && paramLng) {
      return [Number(paramLat), Number(paramLng)]
    }
    return defaultCenter
  }, [paramLat, paramLng, defaultLat, defaultLng])

  const zoomLevel = useMemo(() => {
    return paramLat && paramLng ? 16 : 14
  }, [paramLat, paramLng])

  // Filter locations that have coordinates
  const geolocatedLocations = useMemo(() => {
    return locations.filter(loc => loc.latitude !== null && loc.longitude !== null)
  }, [locations])

  // Apply search/filter
  const filteredLocations = useMemo(() => {
    return geolocatedLocations.filter(loc => {
      const matchText =
        loc.name.toLowerCase().includes(search.toLowerCase()) ||
        (loc.description ?? '').toLowerCase().includes(search.toLowerCase())
      const matchType = filterTypeId === '' || loc.infraTypeId === filterTypeId
      return matchText && matchType
    })
  }, [geolocatedLocations, search, filterTypeId])

  if (loadingLocs) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted text-sm">
        Cargando mapa de ubicaciones...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters row */}
      <div className="flex items-center gap-3 flex-wrap bg-card border border-app-border p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-2 bg-app-bg border border-app-border rounded-lg px-3 h-10 flex-1 min-w-40 focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary transition-all">
          <Search className="w-4.5 h-4.5 text-muted shrink-0" />
          <input
            type="text"
            placeholder="Buscar ubicación por nombre o descripción..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-[13px] text-fg placeholder-muted outline-none"
          />
        </div>
        {infraTypes.length > 0 && (
          <select
            value={filterTypeId}
            onChange={e => setFilterTypeId(e.target.value ? Number(e.target.value) : '')}
            className="bg-app-bg border border-app-border rounded-lg px-3 h-10 text-[13px] text-fg outline-none focus:ring-2 focus:ring-primary/40 shadow-sm transition-all"
          >
            <option value="">Todas las categorías</option>
            {infraTypes.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        )}
        <div className="text-[12px] text-muted font-medium ml-auto">
          Mostrando {filteredLocations.length} de {geolocatedLocations.length} ubicaciones geolocalizadas
        </div>
      </div>

      {/* Map Area */}
      <div className="h-[55vh] min-h-[400px] w-full rounded-xl border border-app-border overflow-hidden relative z-10 shadow-md">
        <MapContainer
          center={centerCoords}
          zoom={zoomLevel}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapCenterController center={centerCoords} zoom={zoomLevel} />
          
          {filteredLocations.map(loc => {
            const CatIcon = getCategoryIcon(loc.infraType?.icon)
            return (
              <Marker
                key={loc.id}
                position={[loc.latitude!, loc.longitude!]}
              >
                <Popup className="custom-leaflet-popup">
                  <div className="p-2 space-y-2 min-w-[200px] text-fg">
                    <div className="flex items-center gap-2 border-b border-app-border/40 pb-1.5">
                      <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center shrink-0">
                        <CatIcon className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <span className="text-[11px] font-mono uppercase text-primary font-bold">
                        {loc.infraType?.name || 'Ubicación'}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-fg leading-snug">{loc.name}</h4>
                      {loc.description && (
                        <p className="text-[11px] text-fg-secondary mt-1 line-clamp-2 leading-relaxed">
                          {loc.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => navigate(`/locations/${loc.id}`)}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 mt-1 bg-primary hover:bg-[var(--primary-hover)] text-primary-fg rounded-lg text-xs font-semibold shadow-sm transition-all"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Ir a la página</span>
                    </button>
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>
      </div>
    </div>
  )
}
