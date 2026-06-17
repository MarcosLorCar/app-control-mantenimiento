import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { Search, ExternalLink, PlusCircle } from 'lucide-react'
import { useLocations } from '../../hooks/useLocations'
import { useInfrastructureTypes } from '../../hooks/useCatalog'
import { useSystemSettings } from '../../hooks/useSystemSettings'
import { getCategoryIcon } from '../../utils/categoryIcons'
import { LocationForm } from '../../components/forms/LocationForm'
import { reverseGeocode } from '../../utils/geocode'
import type { Location } from '../../api/types'

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
  const prevRef = useRef<{ lat: number; lng: number; zoom: number } | null>(null)
  
  useEffect(() => {
    const prev = prevRef.current
    if (!prev || prev.lat !== center[0] || prev.lng !== center[1] || prev.zoom !== zoom) {
      map.setView(center, zoom)
      prevRef.current = { lat: center[0], lng: center[1], zoom }
    }
  }, [center, zoom, map])
  
  return null
}

function MapEvents({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function MapInfoCard({ loc, onNavigate }: { loc: Location; onNavigate: () => void }) {
  const CatIcon = getCategoryIcon(loc.infraType?.icon)
  return (
    <div className="p-1 space-y-2 min-w-[200px] max-w-[260px] text-fg">
      {loc.image && (
        <img
          src={loc.image}
          alt={loc.name}
          className="w-full h-28 object-cover rounded-md"
        />
      )}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-1.5">
        <div className="w-6 h-6 rounded bg-blue-50 flex items-center justify-center shrink-0">
          <CatIcon className="w-3.5 h-3.5 text-blue-600" />
        </div>
        <span className="text-[11px] font-mono uppercase text-blue-600 font-bold">
          {loc.infraType?.name ?? 'Ubicación'}
        </span>
      </div>
      <div>
        <h4 className="font-bold text-sm leading-snug text-gray-900">{loc.name}</h4>
        {loc.description && (
          <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">
            {loc.description}
          </p>
        )}
      </div>
      <button
        onClick={onNavigate}
        className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-all"
      >
        <ExternalLink className="w-3 h-3" />
        <span>Ir a la página</span>
      </button>
    </div>
  )
}

export function LocationsMapPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const { data: locations = [], isLoading: loadingLocs } = useLocations(undefined)
  const { data: infraTypes = [] } = useInfrastructureTypes()
  const { data: settings = [] } = useSystemSettings()

  const defaultLat = Number(settings.find(s => s.key === 'default_latitude')?.value ?? '38.9863')
  const defaultLng = Number(settings.find(s => s.key === 'default_longitude')?.value ?? '-3.9291')
  const defaultCenter = useMemo<[number, number]>(() => [defaultLat, defaultLng], [defaultLat, defaultLng])

  const [search, setSearch] = useState(() => searchParams.get('search') ?? '')
  const [filterTypeId, setFilterTypeId] = useState<number | ''>('')
  const [registerGeo, setRegisterGeo] = useState<Parameters<typeof LocationForm>[0]['initialGeo'] | null>(null)
  const [isGeocoding, setIsGeocoding] = useState(false)
  
  // Sync search state when query params change
  useEffect(() => {
    setSearch(searchParams.get('search') ?? '')
  }, [searchParams])

  // Clicking coordinates on map (when not on marker) to register location
  const [pendingClickCoords, setPendingClickCoords] = useState<[number, number] | null>(null)

  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (pendingClickCoords !== null) {
      setPendingClickCoords(null)
      return
    }
    setPendingClickCoords([lat, lng])
  }, [pendingClickCoords])

  const paramLat = searchParams.get('lat')
  const paramLng = searchParams.get('lng')

  const centerCoords = useMemo<[number, number]>(() => {
    if (paramLat && paramLng) return [Number(paramLat), Number(paramLng)]
    return defaultCenter
  }, [paramLat, paramLng, defaultCenter])

  const zoomLevel = useMemo(() => {
    return paramLat && paramLng ? 16 : 14
  }, [paramLat, paramLng])

  const geolocatedLocations = useMemo(() => {
    return locations.filter(loc => loc.latitude !== null && loc.longitude !== null)
  }, [locations])

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
    <div className="flex-1 flex flex-col min-h-0 space-y-4">
      {/* Filters row */}
      <div className="flex items-center gap-3 flex-wrap bg-card border border-app-border p-4 rounded-xl shadow-sm shrink-0">
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

      {registerGeo && (
        <LocationForm
          initialGeo={registerGeo}
          onClose={() => setRegisterGeo(null)}
          onSuccess={() => setRegisterGeo(null)}
        />
      )}

      {/* Map Area */}
      <div className="flex-1 min-h-0 w-full rounded-xl border border-app-border overflow-hidden relative z-10 shadow-md">
        <MapContainer
          center={centerCoords}
          zoom={zoomLevel}
          scrollWheelZoom={true}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapCenterController center={centerCoords} zoom={zoomLevel} />
          <MapEvents onMapClick={handleMapClick} />
          
          {filteredLocations.map(loc => (
            <Marker
              key={loc.id}
              position={[loc.latitude!, loc.longitude!]}
              eventHandlers={{
                click: () => setPendingClickCoords(null)
              }}
            >
              <Popup className="custom-leaflet-popup">
                <MapInfoCard
                  loc={loc}
                  onNavigate={() => navigate(`/locations/${loc.id}`)}
                />
              </Popup>
            </Marker>
          ))}

          {pendingClickCoords && (
            <Popup position={pendingClickCoords} eventHandlers={{ remove: () => setPendingClickCoords(null) }}>
              <div className="p-2 space-y-2 min-w-[180px] text-fg">
                <h4 className="font-bold text-sm text-gray-900 leading-snug">Registrar Ubicación</h4>
                <div className="text-[11px] text-gray-500 font-mono">
                  <div>Lat: {pendingClickCoords[0].toFixed(6)}</div>
                  <div>Lon: {pendingClickCoords[1].toFixed(6)}</div>
                </div>
                <button
                  disabled={isGeocoding}
                  onClick={async () => {
                    const coords = pendingClickCoords
                    setIsGeocoding(true)
                    const { formattedAddress, placeId } = await reverseGeocode(coords[0], coords[1])
                    setIsGeocoding(false)
                    setRegisterGeo({ lat: coords[0], lng: coords[1], formattedAddress, placeId })
                    setPendingClickCoords(null)
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>{isGeocoding ? 'Buscando dirección...' : 'Registrar aquí'}</span>
                </button>
              </div>
            </Popup>
          )}
        </MapContainer>
      </div>
    </div>
  )
}
