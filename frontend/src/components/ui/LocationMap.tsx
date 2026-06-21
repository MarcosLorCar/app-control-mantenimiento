import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, LayersControl, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'
import { TILE_LAYERS, getStoredTileId, setStoredTileId } from '../../utils/mapTiles'

// Fix Leaflet marker icon asset paths inside Vite
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

interface Props {
  latitude: number | null
  longitude: number | null
  onChange: (lat: number, lng: number) => void
  defaultCenter?: [number, number]
  className?: string
}

const MADRID_COORDS: [number, number] = [40.416775, -3.703790]

export function LocationMap({ latitude, longitude, onChange, defaultCenter, className }: Props) {
  const fallbackCenter = defaultCenter || MADRID_COORDS
  const [position, setPosition] = useState<[number, number]>(
    latitude && longitude ? [latitude, longitude] : fallbackCenter
  )
  const [defaultTileId] = useState(getStoredTileId)
  const [loadingGps, setLoadingGps] = useState(false)
  const isFirstLoad = useRef(true)

  // Synchronize internal marker position when props change
  useEffect(() => {
    if (latitude !== null && longitude !== null) {
      setPosition([latitude, longitude])
    }
  }, [latitude, longitude])

  // Geolocation on mount if no coordinates provided
  useEffect(() => {
    if (latitude === null || longitude === null) {
      if ('geolocation' in navigator) {
        setLoadingGps(true)
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude: lat, longitude: lng } = pos.coords
            setPosition([lat, lng])
            onChange(lat, lng)
            setLoadingGps(false)
          },
          () => {
            setLoadingGps(false)
            onChange(fallbackCenter[0], fallbackCenter[1])
          },
          { enableHighAccuracy: true, timeout: 5000 }
        )
      } else {
        onChange(fallbackCenter[0], fallbackCenter[1])
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function MapController() {
    const map = useMap()
    
    useEffect(() => {
      if (isFirstLoad.current) {
        if (latitude !== null && longitude !== null) {
          map.setView([latitude, longitude], 15)
          isFirstLoad.current = false
        } else if (position !== fallbackCenter) {
          map.setView(position, 15)
          isFirstLoad.current = false
        }
      }
    }, [map])

    // Fix: Invalidate map size to ensure correct rendering in modals and dynamic containers
    useEffect(() => {
      if (!map) return

      // Invalidate size immediately
      map.invalidateSize()

      // Invalidate after a small delay to let transitions and container sizing settle
      const timer = setTimeout(() => {
        map.invalidateSize()
      }, 200)

      // Invalidate dynamically on any container size changes
      const container = map.getContainer()
      const resizeObserver = new ResizeObserver(() => {
        map.invalidateSize()
      })
      resizeObserver.observe(container)

      return () => {
        clearTimeout(timer)
        resizeObserver.disconnect()
      }
    }, [map])

    // Listen for click events on the map to set coordinates
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng
        setPosition([lat, lng])
        onChange(lat, lng)
      },
      baselayerchange(e) {
        const layer = TILE_LAYERS.find(t => t.label === e.name)
        if (layer) setStoredTileId(layer.id)
      },
    })

    // Pan to new coordinate when updated externally
    useEffect(() => {
      if (latitude !== null && longitude !== null) {
        const center = map.getCenter()
        const dist = Math.sqrt(Math.pow(center.lat - latitude, 2) + Math.pow(center.lng - longitude, 2))
        if (dist > 0.0001) {
          map.panTo([latitude, longitude])
        }
      }
    }, [latitude, longitude, map])

    return null
  }

  const markerHandlers = {
    dragend(e: any) {
      const marker = e.target
      if (marker != null) {
        const { lat, lng } = marker.getLatLng()
        setPosition([lat, lng])
        onChange(lat, lng)
      }
    },
  }

  return (
    <div className="space-y-1.5 h-full w-full flex flex-col flex-1">
      <div className="flex justify-between items-center shrink-0">
        <label className="block text-xs font-semibold text-fg-secondary">
          Ubicación GPS <span className="text-muted">(Arrastra el marcador o haz clic en el mapa)</span>
        </label>
        {loadingGps && (
          <span className="text-[10px] text-primary font-medium animate-pulse">
            Obteniendo GPS...
          </span>
        )}
      </div>
      <div className={`w-full rounded-lg border border-app-border overflow-hidden relative z-10 flex-1 ${className || 'h-[300px] sm:h-[380px]'}`}>
        <MapContainer
          center={position}
          zoom={15}
          scrollWheelZoom={true}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <LayersControl position="topright">
            {TILE_LAYERS.map(t => (
              <LayersControl.BaseLayer key={t.id} name={t.label} checked={t.id === defaultTileId}>
                <TileLayer url={t.url} attribution={t.attribution} maxZoom={t.maxZoom} />
              </LayersControl.BaseLayer>
            ))}
          </LayersControl>
          <Marker
            draggable={true}
            eventHandlers={markerHandlers}
            position={position}
          />
          <MapController />
        </MapContainer>
      </div>
      <div className="flex gap-3 text-[11px] text-muted font-mono shrink-0">
        <span>Lat: {position[0].toFixed(6)}</span>
        <span>Lon: {position[1].toFixed(6)}</span>
      </div>
    </div>
  )
}
