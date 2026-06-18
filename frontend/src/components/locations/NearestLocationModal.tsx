import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, AlertCircle, Loader2, RefreshCw } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { useGeolocation } from '../../hooks/useGeolocation'
import { haversineDistanceMeters, formatDistance } from '../../utils/geo'
import { getCategoryIcon } from '../../utils/categoryIcons'
import type { Location } from '../../api/types'

interface Props {
  locations: Location[]
  onClose: () => void
}

export function NearestLocationModal({ locations, onClose }: Props) {
  const navigate = useNavigate()
  const { status, coords, error, request, reset } = useGeolocation()

  useEffect(() => {
    if (status === 'idle') request()
  }, [])

  const validLocations = locations.filter(
    (loc) => loc.latitude !== null && loc.longitude !== null
  )

  const getNearestLocations = () => {
    if (!coords) return []
    return validLocations
      .map((loc) => {
        const distance = haversineDistanceMeters(
          coords.latitude,
          coords.longitude,
          loc.latitude!,
          loc.longitude!
        )
        return { loc, distance }
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5)
  }

  const nearest = getNearestLocations()

  return (
    <Modal title="Radar de Ubicaciones Cercanas" onClose={onClose} size="sm">
      <div className="flex flex-col flex-1 justify-center py-2">
        {(status === 'idle' || status === 'checking' || status === 'locating') && (
          <div className="text-center space-y-4 py-6">
            <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto text-primary">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <div>
              <h3 className="font-semibold text-fg text-base">Obteniendo GPS...</h3>
              <p className="text-xs text-muted mt-1 leading-relaxed px-4">
                Estamos localizando tu dispositivo. Por favor, confirma los permisos si el navegador los solicita.
              </p>
            </div>
          </div>
        )}

        {status === 'denied' && (
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto text-error">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-semibold text-fg text-base text-error">Permiso Denegado</h3>
              <p className="text-xs text-muted mt-1 leading-relaxed px-2">
                No podemos obtener tu posición actual porque el acceso al GPS está desactivado o bloqueado. Habilita los permisos de ubicación para este sitio en la barra de direcciones de tu navegador e inténtalo de nuevo.
              </p>
            </div>
            <button
              onClick={() => {
                reset()
                request()
              }}
              className="w-full flex items-center justify-center gap-2 border border-app-border hover:bg-app-bg text-fg text-sm font-medium h-10 px-4 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Reintentar
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto text-error">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-semibold text-fg text-base text-error">Error de Geolocalización</h3>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                {error || 'No fue posible determinar tu ubicación.'}
              </p>
            </div>
            <button
              onClick={() => {
                reset()
                request()
              }}
              className="w-full flex items-center justify-center gap-2 border border-app-border hover:bg-app-bg text-fg text-sm font-medium h-10 px-4 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Reintentar
            </button>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="text-xs font-semibold text-fg-secondary uppercase tracking-wider">
              Ubicaciones más cercanas
            </div>

            {nearest.length === 0 ? (
              <div className="text-center py-6 text-muted text-xs bg-app-bg rounded-lg border border-app-border">
                No hay ubicaciones registradas con coordenadas geográficas en este momento.
              </div>
            ) : (
              <div className="divide-y divide-app-border border border-app-border rounded-lg bg-card overflow-hidden">
                {nearest.map(({ loc, distance }) => {
                  const CatIcon = getCategoryIcon(loc.infraType?.icon)

                  return (
                    <button
                      key={loc.id}
                      onClick={() => {
                        navigate(`/locations/${loc.id}`)
                        onClose()
                      }}
                      className="w-full flex items-center gap-3.5 p-3.5 text-left hover:bg-app-bg transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-primary/10 overflow-hidden">
                        {loc.image ? (
                          <img src={loc.image} alt={loc.name} className="w-full h-full object-cover" />
                        ) : (
                          <MapPin className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-fg text-sm truncate group-hover:text-primary transition-colors">
                          {loc.name}
                        </h4>
                        {loc.infraType && (
                          <p className="flex items-center gap-1 text-[10px] font-semibold tracking-wider uppercase mt-0.5 text-muted">
                            <CatIcon className="w-3 h-3 shrink-0" />
                            {loc.infraType.name}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-md shrink-0 border border-primary/20">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{formatDistance(distance)}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
