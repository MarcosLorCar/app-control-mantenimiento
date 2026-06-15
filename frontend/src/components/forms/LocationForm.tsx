import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { useCreateLocation, useUpdateLocation } from '../../hooks/useLocations'
import { useInfrastructureTypes } from '../../hooks/useCatalog'
import { useSystemSettings } from '../../hooks/useSystemSettings'
import { LocationMap } from '../ui/LocationMap'
import { MapPin, X } from 'lucide-react'
import type { Location } from '../../api/types'

interface InitialGeo {
  lat: number
  lng: number
  placeId?: string | null
  formattedAddress?: string | null
  name?: string | null
  description?: string | null
}

interface Props {
  parentId?: number | null
  infraTypeId?: number | null
  existing?: Location
  initialGeo?: InitialGeo
  onClose: () => void
  onSuccess?: (created: Location) => void
}

export function LocationForm({ parentId, infraTypeId, existing, initialGeo, onClose, onSuccess }: Props) {
  const isEdit = !!existing
  const [name, setName] = useState(existing?.name ?? initialGeo?.name ?? '')
  const [description, setDescription] = useState(existing?.description ?? initialGeo?.description ?? '')
  const [selectedInfraTypeId, setSelectedInfraTypeId] = useState<number | ''>(
    existing?.infraTypeId ?? infraTypeId ?? ''
  )
  const [error, setError] = useState('')

  const { data: settings = [] } = useSystemSettings()
  const defaultLatSetting = settings.find(s => s.key === 'default_latitude')?.value
  const defaultLngSetting = settings.find(s => s.key === 'default_longitude')?.value
  const defaultCenterCoords: [number, number] = defaultLatSetting && defaultLngSetting
    ? [Number(defaultLatSetting), Number(defaultLngSetting)]
    : [38.9863, -3.9291]

  const [latitude, setLatitude] = useState<number | null>(existing?.latitude ?? initialGeo?.lat ?? null)
  const [longitude, setLongitude] = useState<number | null>(existing?.longitude ?? initialGeo?.lng ?? null)
  const [placeId, setPlaceId] = useState<string | null>(existing?.placeId ?? initialGeo?.placeId ?? null)
  const [formattedAddress, setFormattedAddress] = useState<string | null>(existing?.formattedAddress ?? initialGeo?.formattedAddress ?? null)

  // Map selector modal state
  const [showMapSelector, setShowMapSelector] = useState(false)
  const [tempLat, setTempLat] = useState<number | null>(null)
  const [tempLng, setTempLng] = useState<number | null>(null)

  const createLoc = useCreateLocation()
  const updateLoc = useUpdateLocation()
  const { data: infraTypes = [] } = useInfrastructureTypes()
  const isPending = createLoc.isPending || updateLoc.isPending

  const inputCls = 'w-full border border-app-border rounded-lg px-3 py-2 text-sm bg-card text-fg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors'

  function clearGeo() {
    setLatitude(null)
    setLongitude(null)
    setPlaceId(null)
    setFormattedAddress(null)
  }

  function openMapSelector() {
    setTempLat(latitude ?? defaultCenterCoords[0])
    setTempLng(longitude ?? defaultCenterCoords[1])
    setShowMapSelector(true)
  }

  function handleConfirmMap() {
    if (tempLat !== null && tempLng !== null) {
      setLatitude(tempLat)
      setLongitude(tempLng)
      setFormattedAddress(`${tempLat.toFixed(5)}, ${tempLng.toFixed(5)}`)
    }
    setShowMapSelector(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const body = {
      name: name.trim(),
      description: description.trim() || null,
      infraTypeId: selectedInfraTypeId ? Number(selectedInfraTypeId) : null,
      parentId: isEdit ? existing?.parentId : parentId ?? null,
      latitude: latitude,
      longitude: longitude,
      placeId: placeId,
      formattedAddress: formattedAddress,
    }

    if (!body.name) {
      setError('El nombre es obligatorio.')
      return
    }

    if (!body.parentId && !body.infraTypeId) {
      setError('La categoría principal es obligatoria para ubicaciones principales.')
      return
    }

    if (isEdit) {
      updateLoc.mutate(
        { id: existing!.id, body },
        {
          onSuccess: (data) => {
            if (onSuccess) onSuccess(data)
            onClose()
          },
          onError: (e: any) => setError(e?.error?.message ?? 'Error al actualizar ubicación'),
        }
      )
    } else {
      createLoc.mutate(
        body,
        {
          onSuccess: (data) => {
            if (onSuccess) onSuccess(data)
            onClose()
          },
          onError: (e: any) => setError(e?.error?.message ?? 'Error al crear ubicación'),
        }
      )
    }
  }

  return (
    <Modal title={isEdit ? 'Editar ubicación' : 'Nueva ubicación'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-fg-secondary mb-1">Nombre <span className="text-error">*</span></label>
          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nombre de la ubicación"
              className={inputCls + ' flex-1'}
              required
            />
            <button
              type="button"
              onClick={openMapSelector}
              title="Seleccionar ubicación en el mapa"
              className={`shrink-0 w-10 h-10 flex items-center justify-center rounded-lg border transition-colors ${
                latitude !== null
                  ? 'bg-primary text-primary-fg border-primary hover:bg-[var(--primary-hover)]'
                  : 'bg-card text-muted border-app-border hover:bg-app-bg hover:text-primary hover:border-primary'
              }`}
            >
              <MapPin className="w-4 h-4" />
            </button>
          </div>
          {latitude !== null && longitude !== null && (
            <div className="flex items-center gap-1 mt-1.5 text-xs text-muted">
              <MapPin className="w-3 h-3 shrink-0 text-primary" />
              <span className="truncate flex-1">
                {formattedAddress ?? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`}
              </span>
              <button
                type="button"
                onClick={clearGeo}
                className="shrink-0 hover:text-error transition-colors"
                title="Quitar ubicación"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {(!parentId || (isEdit && !existing?.parentId)) && (
          <div>
            <label className="block text-xs font-semibold text-fg-secondary mb-1">Categoría Principal <span className="text-error">*</span></label>
            <select
              value={selectedInfraTypeId}
              onChange={e => setSelectedInfraTypeId(e.target.value ? Number(e.target.value) : '')}
              className={inputCls}
              required
            >
              <option value="">Seleccionar categoría...</option>
              {infraTypes.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-fg-secondary mb-1">Descripción</label>
          <textarea
            rows={2}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Detalles adicionales..."
            className={inputCls}
          />
        </div>

        {error && <p className="text-error text-sm">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-fg-secondary border border-app-border rounded-lg hover:bg-app-bg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 text-sm text-primary-fg bg-primary rounded-lg hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors"
          >
            {isPending ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>

      {showMapSelector && (
        <Modal title="Seleccionar ubicación" onClose={() => setShowMapSelector(false)} size="full">
          <div className="flex-1 flex flex-col min-h-0 space-y-4">
            <div className="text-sm text-fg-secondary">
              Haz clic en el mapa o arrastra el marcador para seleccionar la ubicación exacta.
            </div>
            <div className="flex-1 flex flex-col min-h-0">
              <LocationMap
                latitude={tempLat}
                longitude={tempLng}
                defaultCenter={defaultCenterCoords}
                onChange={(lat, lng) => {
                  setTempLat(lat)
                  setTempLng(lng)
                }}
                className="min-h-0"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2 shrink-0 border-t border-app-border">
              <button
                type="button"
                onClick={() => setShowMapSelector(false)}
                className="px-4 py-2 text-sm text-fg-secondary border border-app-border rounded-lg hover:bg-app-bg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmMap}
                className="px-4 py-2 text-sm text-primary-fg bg-primary rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  )
}
