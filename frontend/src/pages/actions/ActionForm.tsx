import { useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { useCreateAction, useUpdateAction } from '../../hooks/useActions'
import { useActionTypes, useCreateActionType } from '../../hooks/useCatalog'
import { useLocations, locationKeys } from '../../hooks/useLocations'
import { LocationMap } from '../../components/ui/LocationMap'
import { useQueryClient } from '@tanstack/react-query'
import type { Action, Material } from '../../api/types'

interface Props {
  action?: Action
  locationId?: number
  onClose: () => void
}

export function ActionForm({ action, locationId, onClose }: Props) {
  const isEdit = !!action
  const [title, setTitle] = useState(action?.title ?? '')
  const [typeId, setTypeId] = useState(action?.typeId ?? 0)
  const [description, setDescription] = useState(action?.description ?? '')
  const [performedAt, setPerformedAt] = useState(
    action ? action.performedAt.slice(0, 10) : new Date().toISOString().slice(0, 10)
  )
  const [error, setError] = useState('')

  // Geolocation
  const [latitude, setLatitude] = useState<number | null>(action?.latitude ?? null)
  const [longitude, setLongitude] = useState<number | null>(action?.longitude ?? null)

  // Targets state (only for create)
  const [selectedLocationId, setSelectedLocationId] = useState(
    locationId ?? (action?.locationId ?? 0)
  )
  const [isNewLocation, setIsNewLocation] = useState(false)
  const [newLocationName, setNewLocationName] = useState('')
  const [newLocationType, setNewLocationType] = useState('POST')
  const [newLocationParentId, setNewLocationParentId] = useState(locationId ?? 0)
  const qc = useQueryClient()

  // Inline "nuevo tipo de acción"
  const [newTypeName, setNewTypeName] = useState('')
  const [showNewType, setShowNewType] = useState(false)

  const { data: actionTypes = [] } = useActionTypes()
  const { data: locations = [] } = useLocations(undefined) // Fetch all for target selection

  const createMut = useCreateAction()
  const updateMut = useUpdateAction()
  const createTypeMut = useCreateActionType()
  const isPending = createMut.isPending || updateMut.isPending

  function handleTypeChange(val: string) {
    if (val === '__new__') {
      setShowNewType(true)
    } else {
      setShowNewType(false)
      setTypeId(Number(val))
    }
  }

  function handleCreateType() {
    if (!newTypeName.trim()) return
    const code = newTypeName.trim().toLowerCase().replace(/\s+/g, '_')
    createTypeMut.mutate(
      { code, name: newTypeName.trim() },
      {
        onSuccess: (created) => {
          setTypeId(created.id)
          setNewTypeName('')
          setShowNewType(false)
        },
      }
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (isEdit) {
      updateMut.mutate(
        {
          id: action!.id,
          body: {
            title: title || undefined,
            description: description || undefined,
            performedAt: new Date(performedAt).toISOString(),
          },
        },
        {
          onSuccess: onClose,
          onError: (err: any) => setError(err?.error?.message ?? 'Error al actualizar'),
        }
      )
    } else {
      if (!title || !typeId) {
        setError('Completa título y tipo.')
        return
      }

      const body: any = {
        title,
        typeId,
        description: description || undefined,
        performedAt: new Date(performedAt).toISOString(),
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
      }

      if (locationId) {
        body.locationId = locationId
      } else if (isNewLocation) {
        if (!newLocationName.trim()) {
          setError('Especifica el nombre de la nueva ubicación.')
          return
        }
        body.newLocation = {
          name: newLocationName.trim(),
          type: newLocationType || null,
          parentId: newLocationParentId || null,
          latitude: latitude || null,
          longitude: longitude || null,
        }
      } else {
        if (!selectedLocationId) {
          setError('Selecciona una ubicación.')
          return
        }
        body.locationId = selectedLocationId
      }

      createMut.mutate(body, {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: locationKeys.all })
          onClose()
        },
        onError: (err: any) => setError(err?.error?.message ?? 'Error al registrar'),
      })
    }
  }

  const inputCls = 'w-full border border-app-border rounded-lg px-3 py-2 text-sm bg-card text-fg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors'

  return (
    <Modal title={isEdit ? 'Editar acción' : 'Registrar acción'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
        <div>
          <label className="block text-xs font-semibold text-fg-secondary mb-1">
            Título <span className="text-error">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            placeholder="Ej: Sustitución de bombilla"
            className={inputCls}
          />
        </div>

        {!isEdit && (
          <div className="space-y-4 p-3 bg-app-bg rounded-lg border border-app-border">
            {!locationId && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-fg-secondary">
                    Ubicación <span className="text-error">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsNewLocation(!isNewLocation)}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    {isNewLocation ? 'Seleccionar existente' : '+ Registrar nueva aquí'}
                  </button>
                </div>

                {!isNewLocation ? (
                  <select
                    value={selectedLocationId}
                    onChange={e => setSelectedLocationId(Number(e.target.value))}
                    className={inputCls}
                    required
                  >
                    <option value={0}>Seleccionar ubicación...</option>
                    {locations.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.name} {l.type ? `(${l.type})` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="space-y-3 border-l-2 border-primary/20 pl-3 py-1">
                    <div>
                      <label className="block text-[11px] font-semibold text-fg-secondary mb-1">
                        Nombre de la Nueva Ubicación <span className="text-error">*</span>
                      </label>
                      <input
                        type="text"
                        value={newLocationName}
                        onChange={e => setNewLocationName(e.target.value)}
                        placeholder="Ej: Farola F13"
                        className={inputCls}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-fg-secondary mb-1">
                          Ubicación Padre (Carpeta)
                        </label>
                        <select
                          value={newLocationParentId}
                          onChange={e => setNewLocationParentId(Number(e.target.value))}
                          className={inputCls}
                        >
                          <option value={0}>Ninguna (Raíz)</option>
                          {locations.map(l => (
                            <option key={l.id} value={l.id}>
                              {l.name} {l.type ? `(${l.type})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-fg-secondary mb-1">
                          Tipo de Ubicación
                        </label>
                        <select
                          value={newLocationType}
                          onChange={e => setNewLocationType(e.target.value)}
                          className={inputCls}
                        >
                          <option value="PARK">Parque</option>
                          <option value="FIELD">Pista / Campo</option>
                          <option value="POST">Poste / Farola</option>
                          <option value="BUILDING">Edificio</option>
                          <option value="FLOOR">Planta</option>
                          <option value="ROOM">Sala / Habitación</option>
                          <option value="OTHER">Otro</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-fg-secondary mb-1">
            Tipo <span className="text-error">*</span>
          </label>
          <select
            value={showNewType ? '__new__' : (typeId || 0)}
            onChange={e => handleTypeChange(e.target.value)}
            className={inputCls}
            disabled={isEdit}
          >
            <option value={0}>Seleccionar tipo...</option>
            {actionTypes.map(at => (
              <option key={at.id} value={at.id}>{at.name}</option>
            ))}
            <option value="__new__">+ Nuevo tipo de acción...</option>
          </select>
          {showNewType && (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={newTypeName}
                onChange={e => setNewTypeName(e.target.value)}
                placeholder="Nombre del nuevo tipo"
                className={inputCls}
                autoFocus
              />
              <button
                type="button"
                onClick={handleCreateType}
                disabled={!newTypeName.trim() || createTypeMut.isPending}
                className="px-3 py-2 text-xs text-primary-fg bg-primary rounded-lg disabled:opacity-50 shrink-0"
              >
                Crear
              </button>
              <button
                type="button"
                onClick={() => { setShowNewType(false); setNewTypeName('') }}
                className="px-3 py-2 text-xs border border-app-border rounded-lg shrink-0"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-fg-secondary mb-1">
              Fecha realización <span className="text-error">*</span>
            </label>
            <input
              type="date"
              value={performedAt}
              onChange={e => setPerformedAt(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-fg-secondary mb-1">Descripción</label>
          <textarea
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            className={inputCls}
            placeholder="Detalles del trabajo realizado..."
          />
        </div>

        {/* Leaflet GPS Mapping */}
        <div className="p-3 bg-app-bg rounded-lg border border-app-border">
          <LocationMap
            latitude={latitude}
            longitude={longitude}
            onChange={(lat, lng) => {
              setLatitude(lat)
              setLongitude(lng)
            }}
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
            {isPending ? (isEdit ? 'Guardando...' : 'Registrando...') : (isEdit ? 'Guardar' : 'Registrar')}
          </button>
        </div>
      </form>
    </Modal>
  )
}
