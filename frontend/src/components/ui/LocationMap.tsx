import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

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
}

const MADRID_COORDS: [number, number] = [40.416775, -3.703790]

export function LocationMap({ latitude, longitude, onChange, defaultCenter }: Props) {
  const fallbackCenter = defaultCenter || MADRID_COORDS
  const [position, setPosition] = useState<[number, number]>(
    latitude && longitude ? [latitude, longitude] : fallbackCenter
  )
  const [loadingGps, setLoadingGps] = useState(false)
  const isFirstLoad = useRef(true)

  useEffect(() => {
    if (!latitude || !longitude) {
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
  }, [latitude, longitude, onChange, fallbackCenter])

  function MapEvents() {
    const map = useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng
        setPosition([lat, lng])
        onChange(lat, lng)
      },
    })

    useEffect(() => {
      if (isFirstLoad.current && (latitude || longitude)) {
        map.setView([latitude!, longitude!], 15)
        isFirstLoad.current = false
      } else if (isFirstLoad.current && position !== fallbackCenter) {
        map.setView(position, 15)
        isFirstLoad.current = false
      }
    }, [position, map])

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
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <label className="block text-xs font-semibold text-fg-secondary">
          Ubicación GPS <span className="text-muted">(Arrastra el marcador o haz clic en el mapa)</span>
        </label>
        {loadingGps && (
          <span className="text-[10px] text-primary font-medium animate-pulse">
            Obteniendo GPS...
          </span>
        )}
      </div>
      <div className="h-[200px] w-full rounded-lg border border-app-border overflow-hidden relative z-10">
        <MapContainer
          center={position}
          zoom={15}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker
            draggable={true}
            eventHandlers={markerHandlers}
            position={position}
          />
          <MapEvents />
        </MapContainer>
      </div>
      <div className="flex gap-3 text-[11px] text-muted font-mono">
        <span>Lat: {position[0].toFixed(6)}</span>
        <span>Lon: {position[1].toFixed(6)}</span>
      </div>
    </div>
  )
}
