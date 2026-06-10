import { useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { useCreateAction, useUpdateAction } from '../../hooks/useActions'
import { useActionTypes, useCreateActionType } from '../../hooks/useCatalog'
import { useMaterials } from '../../hooks/useMaterials'
import { useInfrastructures } from '../../hooks/useInfrastructures'
import { useTopLevelDependencies } from '../../hooks/useDependencies'
import { useStructuresByInfra } from '../../hooks/useStructures'
import { LocationMap } from '../../components/ui/LocationMap'
import type { Action, Material } from '../../api/types'

interface Props {
  action?: Action
  materials?: Material[]
  onClose: () => void
}

export function ActionForm({ action, materials: propMaterials, onClose }: Props) {
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
  const [targetType, setTargetType] = useState<'material' | 'infrastructure' | 'dependency' | 'structure'>('material')
  const [materialId, setMaterialId] = useState(0)
  const [infrastructureId, setInfrastructureId] = useState(0)
  const [dependencyId, setDependencyId] = useState(0)
  const [structureId, setStructureId] = useState(0)

  // Inline "nuevo tipo de acción"
  const [newTypeName, setNewTypeName] = useState('')
  const [showNewType, setShowNewType] = useState(false)

  const { data: actionTypes = [] } = useActionTypes()
  const { data: allMaterials = [] } = useMaterials()
  const materials = propMaterials ?? allMaterials

  const { data: infrastructures = [] } = useInfrastructures()
  const { data: dependencies = [] } = useTopLevelDependencies(infrastructureId)
  const { data: structures = [] } = useStructuresByInfra(infrastructureId)

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

      if (targetType === 'material') {
        if (!materialId) {
          setError('Selecciona un material.')
          return
        }
        body.materialId = materialId
      } else if (targetType === 'infrastructure') {
        if (!infrastructureId) {
          setError('Selecciona una infraestructura.')
          return
        }
        body.infrastructureId = infrastructureId
      } else if (targetType === 'dependency') {
        if (!dependencyId) {
          setError('Selecciona una dependencia.')
          return
        }
        body.dependencyId = dependencyId
      } else if (targetType === 'structure') {
        if (!structureId) {
          setError('Selecciona una estructura.')
          return
        }
        body.structureId = structureId
      }

      createMut.mutate(body, {
        onSuccess: onClose,
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
          <div className="space-y-3 p-3 bg-app-bg rounded-lg border border-app-border">
            <div>
              <label className="block text-xs font-semibold text-fg-secondary mb-1">
                Objetivo de la acción
              </label>
              <div className="flex gap-2 text-xs">
                {(['material', 'infrastructure', 'dependency', 'structure'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTargetType(t)}
                    className={`flex-1 py-1.5 rounded-lg border font-medium transition-colors ${
                      targetType === t
                        ? 'bg-primary text-primary-fg border-primary'
                        : 'bg-card text-fg-secondary border-app-border hover:bg-app-bg'
                    }`}
                  >
                    {t === 'material' ? 'Material' : t === 'infrastructure' ? 'Infraestructura' : t === 'dependency' ? 'Dependencia' : 'Estructura'}
                  </button>
                ))}
              </div>
            </div>

            {targetType === 'material' && (
              <div>
                <label className="block text-xs font-semibold text-fg-secondary mb-1">
                  Material <span className="text-error">*</span>
                </label>
                <select
                  value={materialId}
                  onChange={e => setMaterialId(Number(e.target.value))}
                  className={inputCls}
                  required
                >
                  <option value={0}>Seleccionar material...</option>
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.code ? `${m.code} — ` : ''}{m.name} ({m.type.name})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {targetType !== 'material' && (
              <div>
                <label className="block text-xs font-semibold text-fg-secondary mb-1">
                  Infraestructura <span className="text-error">*</span>
                </label>
                <select
                  value={infrastructureId}
                  onChange={e => {
                    setInfrastructureId(Number(e.target.value))
                    setDependencyId(0)
                    setStructureId(0)
                  }}
                  className={inputCls}
                  required
                >
                  <option value={0}>Seleccionar infraestructura...</option>
                  {infrastructures.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.code ? `${i.code} — ` : ''}{i.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {targetType === 'dependency' && infrastructureId > 0 && (
              <div>
                <label className="block text-xs font-semibold text-fg-secondary mb-1">
                  Dependencia <span className="text-error">*</span>
                </label>
                <select
                  value={dependencyId}
                  onChange={e => setDependencyId(Number(e.target.value))}
                  className={inputCls}
                  required
                >
                  <option value={0}>Seleccionar dependencia...</option>
                  {dependencies.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.code ? `${d.code} — ` : ''}{d.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {targetType === 'structure' && infrastructureId > 0 && (
              <div>
                <label className="block text-xs font-semibold text-fg-secondary mb-1">
                  Estructura <span className="text-error">*</span>
                </label>
                <select
                  value={structureId}
                  onChange={e => setStructureId(Number(e.target.value))}
                  className={inputCls}
                  required
                >
                  <option value={0}>Seleccionar estructura...</option>
                  {structures.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.code ? `${s.code} — ` : ''}{s.name}
                    </option>
                  ))}
                </select>
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
