import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useCreateAction } from '../../hooks/useActions'
import { useLocations, locationKeys } from '../../hooks/useLocations'
import { useQueryClient } from '@tanstack/react-query'
import { RecursiveMaterialModal, MaterialChange } from '../../components/forms/RecursiveMaterialModal'
import { ClipboardList, AlertCircle, Pencil, ChevronLeft, Package, Check } from 'lucide-react'

export function ActionFormPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const qc = useQueryClient()

  // Form states
  const [title, setTitle] = useState('')
  const [selectedLocationId, setSelectedLocationId] = useState<number>(0)
  const [performedAt, setPerformedAt] = useState(() => new Date().toISOString().slice(0, 10))
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')

  // Staged material changes state
  const [stagedChanges, setStagedChanges] = useState<MaterialChange[]>([])
  const [showMaterialModal, setShowMaterialModal] = useState(false)

  // Queries
  const { data: locations = [], isLoading: loadingLocations } = useLocations(undefined)
  const createActionMut = useCreateAction()

  // Filter root locations (parentId === null)
  const rootLocations = locations.filter(loc => loc.parentId === null)

  // Pre-populate location from search params
  useEffect(() => {
    const locIdParam = searchParams.get('locationId')
    if (locIdParam) {
      const parsedId = Number(locIdParam)
      if (parsedId > 0) {
        setSelectedLocationId(parsedId)
      }
    }
  }, [searchParams])

  const isPending = createActionMut.isPending
  const inputCls = 'w-full border border-app-border rounded-lg px-3 py-2 text-sm bg-card text-fg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors'

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('El título del trabajo es obligatorio.')
      return
    }

    if (!selectedLocationId) {
      setError('Debes seleccionar una infraestructura de la lista.')
      return
    }

    // Format changes to match create action payload
    const formattedMaterials = stagedChanges.map(c => ({
      materialId: c.materialId,
      name: c.name,
      typeId: c.typeId,
      description: c.description,
      attributes: c.attributes,
      locationId: c.locationId,
      operation: c.operation
    }))

    createActionMut.mutate(
      {
        title: title.trim(),
        description: description.trim() || null,
        performedAt: new Date(performedAt).toISOString(),
        locationId: selectedLocationId,
        materials: formattedMaterials
      },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: locationKeys.all })
          // Redirect to location detail or actions list
          navigate(`/locations/${selectedLocationId}`)
        },
        onError: (err: any) => {
          setError(err?.error?.message ?? 'Error al registrar el trabajo')
        }
      }
    )
  }

  // Count staged operations
  const installs = stagedChanges.filter(c => c.operation === 'INSTALL').length
  const uninstalls = stagedChanges.filter(c => c.operation === 'UNINSTALL').length
  const updates = stagedChanges.filter(c => c.operation === 'UPDATE').length

  const selectedLocName = rootLocations.find(l => l.id === selectedLocationId)?.name ?? ''

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Breadcrumbs */}
      <nav className="text-xs text-muted flex items-center gap-1.5 mb-2">
        <Link to="/actions" className="hover:text-fg font-medium flex items-center gap-1">
          <ChevronLeft className="w-3.5 h-3.5" /> Trabajos
        </Link>
        <span className="text-muted/60">/</span>
        <span className="text-fg font-semibold">Registrar Trabajo</span>
      </nav>

      {/* Header */}
      <div className="flex items-center gap-3 border-b border-app-border/40 pb-5">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
          <ClipboardList className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-fg leading-tight">Registrar Trabajo / Mantenimiento</h2>
          <p className="text-xs text-muted mt-1">
            Completa los detalles de la intervención y edita el inventario de materiales asociado.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 bg-card border border-app-border p-6 rounded-xl shadow-sm">
        {/* Title */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-fg-secondary mb-1.5">
            Título / Tarea <span className="text-error">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Ej: Mantenimiento Preventivo Bimestral, Cambio de bombas..."
            className={inputCls}
            required
            autoFocus
          />
        </div>

        {/* Location Selection */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-fg-secondary mb-1.5">
            Infraestructura Principal <span className="text-error">*</span>
          </label>
          {loadingLocations ? (
            <div className="text-xs text-muted py-2">Cargando ubicaciones...</div>
          ) : searchParams.get('locationId') ? (
            <div className="flex items-center gap-2 px-3.5 py-2.5 bg-app-bg border border-app-border rounded-lg text-sm text-fg font-semibold">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              {selectedLocName}
            </div>
          ) : (
            <select
              value={selectedLocationId || ''}
              onChange={e => {
                setSelectedLocationId(Number(e.target.value))
                setStagedChanges([]) // Reset staged changes if location changes
              }}
              className={inputCls}
              required
            >
              <option value="">Selecciona la infraestructura raíz...</option>
              {rootLocations.map(l => (
                <option key={l.id} value={l.id}>
                  {l.name} {l.infraType ? `(${l.infraType.name})` : ''}
                </option>
              ))}
            </select>
          )}
          <p className="text-[10px] text-muted mt-1">
            Los trabajos se asocian a nivel de infraestructura principal (ej: Parque, Hospital).
          </p>
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-fg-secondary mb-1.5">
            Fecha de Realización <span className="text-error">*</span>
          </label>
          <input
            type="date"
            value={performedAt}
            onChange={e => setPerformedAt(e.target.value)}
            className={inputCls}
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-fg-secondary mb-1.5">
            Descripción de la Intervención
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Detalla las inspecciones, ajustes o incidentes resueltos durante el mantenimiento..."
            className={inputCls}
          />
        </div>

        {/* Recursive Materials Editor Button replacing card */}
        {selectedLocationId > 0 && (
          <div className="space-y-3">
            <button
              type="button"
              disabled={loadingLocations}
              onClick={() => setShowMaterialModal(true)}
              className="w-full flex items-center justify-center gap-2 bg-blue-50/70 hover:bg-blue-100 text-blue-600 border border-blue-200/60 py-3 px-4 rounded-xl text-sm font-bold shadow-sm transition-all disabled:opacity-50"
            >
              {loadingLocations ? (
                <span>Cargando ubicaciones...</span>
              ) : (
                <>
                  <Pencil className="w-4 h-4" /> Editar Materiales / Equipos de {selectedLocName}
                </>
              )}
            </button>

            {/* Staged Changes Summary */}
            {stagedChanges.length > 0 ? (
              <div className="flex flex-wrap gap-3 p-3 bg-card rounded-lg border border-app-border text-[10px] font-semibold text-fg-secondary">
                {installs > 0 && (
                  <span className="bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded border border-emerald-500/15">
                    +{installs} instalados
                  </span>
                )}
                {uninstalls > 0 && (
                  <span className="bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded border border-rose-500/15">
                    -{uninstalls} retirados
                  </span>
                )}
                {updates > 0 && (
                  <span className="bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded border border-blue-500/15">
                    ~{updates} modificados
                  </span>
                )}
                <span className="text-muted font-normal self-center ml-auto flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-500" /> Cambios guardados localmente
                </span>
              </div>
            ) : (
              <p className="text-[11px] text-muted italic px-1">
                Sin cambios de materiales registrados para este trabajo.
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 bg-rose-500/10 text-error rounded-lg border border-rose-500/15 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-3 border-t border-app-border/40">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2.5 text-sm text-fg-secondary border border-app-border rounded-lg hover:bg-app-bg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-5 py-2.5 text-sm text-primary-fg bg-primary rounded-lg hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors font-bold shadow-sm"
          >
            {isPending ? 'Registrando...' : 'Registrar Trabajo'}
          </button>
        </div>
      </form>

      {/* Recursive Materials Tree Editor Modal */}
      {showMaterialModal && (
        <RecursiveMaterialModal
          rootLocationId={selectedLocationId}
          allLocations={locations}
          initialChanges={stagedChanges}
          onClose={() => setShowMaterialModal(false)}
          onConfirm={(updatedChanges) => {
            setStagedChanges(updatedChanges)
            setShowMaterialModal(false)}
          }
        />
      )}
    </div>
  )
}
