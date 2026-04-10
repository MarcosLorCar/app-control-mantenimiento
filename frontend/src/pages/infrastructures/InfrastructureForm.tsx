import { useState, FormEvent } from 'react'
import { Modal } from '../../components/ui/Modal'
import { useCreateInfrastructure, useUpdateInfrastructure } from '../../hooks/useInfrastructures'
import { useInfrastructureTypes } from '../../hooks/useCatalog'
import type { Infrastructure } from '../../api/types'

interface Props {
  onClose: () => void
  existing?: Infrastructure
}

export function InfrastructureForm({ onClose, existing }: Props) {
  const [name, setName] = useState(existing?.name ?? '')
  const [description, setDescription] = useState(existing?.description ?? '')
  const [location, setLocation] = useState(existing?.location ?? '')
  const [infraTypeId, setInfraTypeId] = useState<number | ''>(existing?.infraTypeId ?? '')
  const [lat, setLat] = useState<number | undefined>(existing?.latitude ?? undefined)
  const [lng, setLng] = useState<number | undefined>(existing?.longitude ?? undefined)
  const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>(
    existing?.latitude != null ? 'ok' : 'idle'
  )
  const [error, setError] = useState('')

  const { data: infraTypes = [] } = useInfrastructureTypes()
  const createMutation = useCreateInfrastructure()
  const updateMutation = useUpdateInfrastructure()
  const isPending = createMutation.isPending || updateMutation.isPending

  function handleGeolocate() {
    if (!navigator.geolocation) {
      setGeoStatus('error')
      return
    }
    setGeoStatus('loading')
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLat(pos.coords.latitude)
        setLng(pos.coords.longitude)
        setGeoStatus('ok')
      },
      () => setGeoStatus('error'),
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    const body = {
      name,
      description: description || undefined,
      location: location || undefined,
      infraTypeId: infraTypeId === '' ? undefined : Number(infraTypeId),
      latitude: lat,
      longitude: lng,
    }
    try {
      if (existing) {
        await updateMutation.mutateAsync({ id: existing.id, body })
      } else {
        await createMutation.mutateAsync(body)
      }
      onClose()
    } catch (err: any) {
      setError(err?.error?.message ?? 'Error al guardar')
    }
  }

  const inputCls = 'w-full border border-app-border rounded-lg px-3 py-2 text-sm bg-card text-fg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors'

  return (
    <Modal title={existing ? 'Editar infraestructura' : 'Nueva infraestructura'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-fg-secondary mb-1">
            Nombre <span className="text-error">*</span>
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-fg-secondary mb-1">Tipo</label>
          <select
            value={infraTypeId}
            onChange={e => setInfraTypeId(e.target.value ? Number(e.target.value) : '')}
            className={inputCls}
          >
            <option value="">Sin tipo</option>
            {infraTypes.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-fg-secondary mb-1">Descripción</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-fg-secondary mb-1">Ubicación</label>
          <div className="flex gap-2">
            <input
              value={location}
              onChange={e => setLocation(e.target.value)}
              className={inputCls + ' flex-1'}
              placeholder="Dirección o descripción..."
            />
            <button
              type="button"
              onClick={handleGeolocate}
              disabled={geoStatus === 'loading'}
              className="shrink-0 px-3 py-2 text-xs font-medium border border-app-border rounded-lg text-fg-secondary hover:bg-app-bg transition-colors disabled:opacity-50"
              title="Usar mi ubicación actual"
            >
              {geoStatus === 'loading' ? '...' : '📍'}
            </button>
          </div>
          {geoStatus === 'ok' && (
            <p className="text-[11px] mt-1" style={{ color: 'var(--success)' }}>
              Coordenadas guardadas ({lat?.toFixed(5)}, {lng?.toFixed(5)})
            </p>
          )}
          {geoStatus === 'error' && (
            <p className="text-[11px] mt-1 text-error">No se pudo obtener la ubicación</p>
          )}
        </div>
        {error && <p className="text-error text-sm">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
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
    </Modal>
  )
}
