import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useCreateAction } from '../../hooks/useActions'
import { useLocations, locationKeys } from '../../hooks/useLocations'
import { useQueryClient } from '@tanstack/react-query'
import { RecursiveMaterialModal, MaterialChange } from '../../components/forms/RecursiveMaterialModal'
import { ClipboardList, AlertCircle, Pencil, ChevronLeft, Package, Check, Camera, UploadCloud } from 'lucide-react'
import { uploadActionPhoto } from '../../api/actions'

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

  // Photo states & refs
  interface PhotoItem {
    file: File
    previewUrl: string
  }
  const [selectedPhotos, setSelectedPhotos] = useState<PhotoItem[]>([])
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)

  const cameraInputRef = useRef<HTMLInputElement>(null)
  const archiveInputRef = useRef<HTMLInputElement>(null)

  // Detect mobile OS
  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
    const isMobileOS = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
    const isIPad = navigator.maxTouchPoints > 2 && /Macintosh/.test(navigator.userAgent)
    setIsMobile(isMobileOS || isIPad)
  }, [])

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      selectedPhotos.forEach(p => URL.revokeObjectURL(p.previewUrl))
    }
  }, [])

  // Add photos utility
  const addPhotos = (files: File[]) => {
    const newItems = files
      .filter(f => f.type.startsWith('image/'))
      .map(f => ({
        file: f,
        previewUrl: URL.createObjectURL(f)
      }))
    setSelectedPhotos(prev => [...prev, ...newItems])
  }

  // Remove photo utility
  const removePhoto = (index: number) => {
    setSelectedPhotos(prev => {
      const next = [...prev]
      URL.revokeObjectURL(next[index].previewUrl)
      next.splice(index, 1)
      return next
    })
  }

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const selected = Array.from(e.dataTransfer.files || [])
    addPhotos(selected)
  }

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

  const isPending = createActionMut.isPending || isUploadingPhoto
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
        onSuccess: async (data) => {
          qc.invalidateQueries({ queryKey: locationKeys.all })
          if (selectedPhotos.length > 0) {
            setIsUploadingPhoto(true)
            try {
              await Promise.all(
                selectedPhotos.map(p => uploadActionPhoto(data.id, p.file))
              )
            } catch (err) {
              console.error('Error uploading action images:', err)
            } finally {
              setIsUploadingPhoto(false)
            }
          }
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

        {/* Adjuntar Foto */}
        <div>
          {/* Hidden Inputs */}
          <input
            type="file"
            ref={cameraInputRef}
            accept="image/*"
            capture="environment"
            onChange={e => {
              const selected = Array.from(e.target.files || [])
              addPhotos(selected)
            }}
            className="hidden"
          />
          <input
            type="file"
            ref={archiveInputRef}
            accept="image/*"
            multiple
            onChange={e => {
              const selected = Array.from(e.target.files || [])
              addPhotos(selected)
            }}
            className="hidden"
          />

          <label className="block text-xs font-bold uppercase tracking-wider text-fg-secondary mb-1.5">
            Adjuntar Fotos del Trabajo (Opcional)
          </label>
          
          {selectedPhotos.length === 0 ? (
            !isMobile ? (
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => archiveInputRef.current?.click()}
                className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer group ${
                  isDragOver
                    ? 'border-primary bg-primary/5 scale-[1.01]'
                    : 'border-app-border bg-app-bg/10 hover:bg-app-bg/25 hover:border-primary/50'
                }`}
              >
                <UploadCloud className="w-8 h-8 text-muted mb-2 group-hover:text-primary transition-colors" />
                <p className="text-xs font-semibold text-fg mb-0.5">Haz clic para seleccionar o arrastra fotos</p>
                <p className="text-[10px] text-muted">Formatos aceptados: PNG, JPG, WEBP</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-app-border rounded-xl p-6 bg-app-bg/10 text-center gap-3">
                <div className="text-center space-y-0.5">
                  <UploadCloud className="w-8 h-8 text-muted mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-fg">Fotos del Trabajo (Opcional)</p>
                  <p className="text-[10px] text-muted">Sube una o varias fotos del mantenimiento realizado</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2.5 w-full justify-center">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-primary text-primary-fg hover:bg-[var(--primary-hover)] rounded-lg text-xs font-semibold cursor-pointer transition-all active:scale-95 shadow-sm"
                  >
                    <Camera className="w-3.5 h-3.5" /> Hacer Foto (Cámara)
                  </button>
                  <button
                    type="button"
                    onClick={() => archiveInputRef.current?.click()}
                    className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 border border-app-border bg-card hover:bg-app-bg text-fg-secondary hover:text-fg rounded-lg text-xs font-semibold cursor-pointer transition-all active:scale-95 shadow-sm"
                  >
                    <UploadCloud className="w-3.5 h-3.5" /> Seleccionar Archivo(s)
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-app-bg/10 border border-app-border rounded-xl">
                {selectedPhotos.map((item, index) => (
                  <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-app-border bg-card">
                    <img
                      src={item.previewUrl}
                      alt="Vista previa"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="px-2.5 py-1 rounded-md bg-error hover:bg-red-600 text-white text-[10px] font-bold transition-all active:scale-95 shadow-sm"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex items-center justify-center gap-1 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg text-xs font-bold transition-all active:scale-95 shadow-sm"
                >
                  <Camera className="w-3.5 h-3.5" /> Hacer Otra Foto
                </button>
                <button
                  type="button"
                  onClick={() => archiveInputRef.current?.click()}
                  className="flex items-center justify-center gap-1 px-3 py-1.5 border border-app-border bg-card hover:bg-app-bg text-fg-secondary hover:text-fg rounded-lg text-xs font-bold transition-all active:scale-95 shadow-sm"
                >
                  <UploadCloud className="w-3.5 h-3.5" /> Añadir Archivo(s)
                </button>
              </div>
            </div>
          )}
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
            {isPending ? (isUploadingPhoto ? 'Subiendo foto...' : 'Registrando...') : 'Registrar Trabajo'}
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
