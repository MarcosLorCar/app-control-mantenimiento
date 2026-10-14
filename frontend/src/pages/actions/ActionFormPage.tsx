import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom'
import { useCreateAction, useUpdateAction, useAction, actionKeys } from '../../hooks/useActions'
import { useLocations, locationKeys } from '../../hooks/useLocations'
import { deleteLocationPhoto } from '../../api/locations'
import { useQueryClient } from '@tanstack/react-query'
import { RecursiveMaterialModal, MaterialChange } from '../../components/forms/RecursiveMaterialModal'
import { ClipboardList, AlertCircle, Pencil, ChevronLeft, Check, Camera, UploadCloud, RotateCcw, Trash2 } from 'lucide-react'
import { uploadActionPhoto } from '../../api/actions'
import { compressImage } from '../../utils/imageCompression'
import type { LocationPhoto } from '../../api/types'

export function ActionFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const qc = useQueryClient()

  const isEdit = !!id
  const actionId = id ? Number(id) : undefined

  // Action query for edit mode
  const { data: existingAction, isLoading: loadingAction } = useAction(actionId ?? 0)

  // Form states
  const [title, setTitle] = useState('')
  const [selectedLocationId, setSelectedLocationId] = useState<number>(0)
  const [performedAt, setPerformedAt] = useState(() => new Date().toISOString().slice(0, 10))
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')

  // Staged material changes state
  const [stagedChanges, setStagedChanges] = useState<MaterialChange[]>([])
  const [showMaterialModal, setShowMaterialModal] = useState(false)

  // Existing photos state (in edit mode)
  const [existingPhotos, setExistingPhotos] = useState<LocationPhoto[]>([])
  const [removedPhotoIds, setRemovedPhotoIds] = useState<number[]>([])

  // New photo states & refs
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
  }, [selectedPhotos])

  // Populate data when editing existing action
  useEffect(() => {
    if (isEdit && existingAction) {
      setTitle(existingAction.title)
      setDescription(existingAction.description ?? '')
      if (existingAction.performedAt) {
        setPerformedAt(new Date(existingAction.performedAt).toISOString().slice(0, 10))
      }
      if (existingAction.locationId) {
        setSelectedLocationId(existingAction.locationId)
      }
      setExistingPhotos(existingAction.photos || [])
      setRemovedPhotoIds([])

      if (existingAction.materials && existingAction.materials.length > 0) {
        const initialStaged: MaterialChange[] = existingAction.materials.map(am => ({
          tempId: `existing-${am.materialId}`,
          materialId: am.materialId,
          name: am.material.name,
          typeId: am.material.typeId,
          description: am.material.description,
          attributes: (am.material.attributes || {}) as Record<string, any>,
          locationId: am.material.locationId ?? existingAction.locationId,
          operation: am.operation,
          type: am.material.type,
        }))
        setStagedChanges(initialStaged)
      } else {
        setStagedChanges([])
      }
    }
  }, [isEdit, existingAction])

  // Add photos utility with client-side compression
  const addPhotos = async (files: File[]) => {
    const imageFiles = files.filter(f => f.type.startsWith('image/'))
    const compressedFiles = await Promise.all(imageFiles.map(f => compressImage(f)))

    const newItems = compressedFiles.map(f => ({
      file: f,
      previewUrl: URL.createObjectURL(f),
    }))
    setSelectedPhotos(prev => [...prev, ...newItems])
  }

  // Remove newly attached photo utility
  const removePhoto = (index: number) => {
    setSelectedPhotos(prev => {
      const next = [...prev]
      URL.revokeObjectURL(next[index].previewUrl)
      next.splice(index, 1)
      return next
    })
  }

  // Toggle removal of existing photo
  const toggleRemoveExistingPhoto = (photoId: number) => {
    setRemovedPhotoIds(prev =>
      prev.includes(photoId) ? prev.filter(id => id !== photoId) : [...prev, photoId]
    )
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

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const selected = Array.from(e.dataTransfer.files || [])
    await addPhotos(selected)
  }

  // Queries
  const { data: locations = [], isLoading: loadingLocations } = useLocations(undefined)
  const createActionMut = useCreateAction()
  const updateActionMut = useUpdateAction()

  // Filter root locations (parentId === null)
  const rootLocations = locations.filter(loc => loc.parentId === null)

  // Pre-populate location from search params in create mode
  useEffect(() => {
    if (!isEdit) {
      const locIdParam = searchParams.get('locationId')
      if (locIdParam) {
        const parsedId = Number(locIdParam)
        if (parsedId > 0) {
          setSelectedLocationId(parsedId)
        }
      }
    }
  }, [searchParams, isEdit])

  const isPending = createActionMut.isPending || updateActionMut.isPending || isUploadingPhoto
  const inputCls =
    'w-full border border-app-border rounded-lg px-3 py-2 text-sm bg-card text-fg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors'

  async function handleSubmit(e: React.FormEvent) {
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

    // Format changes to match action payload
    const formattedMaterials = stagedChanges.map(c => ({
      materialId: c.materialId,
      name: c.name,
      typeId: c.typeId,
      description: c.description,
      attributes: c.attributes,
      locationId: c.locationId,
      operation: c.operation,
    }))

    if (isEdit && actionId) {
      updateActionMut.mutate(
        {
          id: actionId,
          body: {
            title: title.trim(),
            description: description.trim() || null,
            performedAt: new Date(performedAt).toISOString(),
            materials: formattedMaterials,
          },
        },
        {
          onSuccess: async () => {
            qc.invalidateQueries({ queryKey: locationKeys.all })
            qc.invalidateQueries({ queryKey: actionKeys.all })
            qc.invalidateQueries({ queryKey: actionKeys.detail(actionId) })

            // 1. Upload newly selected photos
            if (selectedPhotos.length > 0) {
              setIsUploadingPhoto(true)
              try {
                await Promise.all(
                  selectedPhotos.map(p => uploadActionPhoto(actionId, p.file))
                )
              } catch (err) {
                console.error('Error uploading action images:', err)
              } finally {
                setIsUploadingPhoto(false)
              }
            }

            // 2. Delete marked existing photos
            if (removedPhotoIds.length > 0) {
              try {
                await Promise.all(
                  removedPhotoIds.map(photoId => deleteLocationPhoto(photoId))
                )
              } catch (err) {
                console.error('Error deleting action images:', err)
              }
            }

            navigate(`/actions/${actionId}`)
          },
          onError: (err: any) => {
            setError(err?.error?.message ?? 'Error al guardar los cambios del trabajo')
          },
        }
      )
    } else {
      createActionMut.mutate(
        {
          title: title.trim(),
          description: description.trim() || null,
          performedAt: new Date(performedAt).toISOString(),
          locationId: selectedLocationId,
          materials: formattedMaterials,
        },
        {
          onSuccess: async data => {
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
            navigate(`/locations/${selectedLocationId}`)
          },
          onError: (err: any) => {
            setError(err?.error?.message ?? 'Error al registrar el trabajo')
          },
        }
      )
    }
  }

  // Count staged operations
  const installs = stagedChanges.filter(c => c.operation === 'INSTALL').length
  const uninstalls = stagedChanges.filter(c => c.operation === 'UNINSTALL').length
  const updates = stagedChanges.filter(c => c.operation === 'UPDATE').length

  const selectedLocName =
    locations.find(l => l.id === selectedLocationId)?.name ??
    existingAction?.location?.name ??
    ''

  const activeExistingPhotos = existingPhotos.filter(p => !removedPhotoIds.includes(p.id))

  if (isEdit && loadingAction) {
    return (
      <div className="text-center py-24 text-muted text-sm italic">
        Cargando detalles del trabajo...
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-10">
      {/* Breadcrumbs */}
      <nav className="text-xs text-muted flex items-center gap-1.5 mb-2">
        <Link to="/actions" className="hover:text-fg font-medium flex items-center gap-1">
          <ChevronLeft className="w-3.5 h-3.5" /> Trabajos
        </Link>
        <span className="text-muted/60">/</span>
        {isEdit ? (
          <>
            <Link to={`/actions/${actionId}`} className="hover:text-fg font-medium">
              Detalle #{actionId}
            </Link>
            <span className="text-muted/60">/</span>
            <span className="text-fg font-semibold">Editar Trabajo</span>
          </>
        ) : (
          <span className="text-fg font-semibold">Registrar Trabajo</span>
        )}
      </nav>

      {/* Header */}
      <div className="flex items-center gap-3 border-b border-app-border/40 pb-5">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
          <ClipboardList className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-fg leading-tight">
            {isEdit ? `Editar Trabajo #${actionId}` : 'Registrar Trabajo / Mantenimiento'}
          </h2>
          <p className="text-xs text-muted mt-1">
            {isEdit
              ? 'Modifica los detalles de la intervención, añade o quita fotos y actualiza el inventario de materiales.'
              : 'Completa los detalles de la intervención y edita el inventario de materiales asociado.'}
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
          ) : isEdit || searchParams.get('locationId') ? (
            <div className="flex items-center gap-2 px-3.5 py-2.5 bg-app-bg border border-app-border rounded-lg text-sm text-fg font-semibold">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              {selectedLocName || 'Ubicación asignada'}
            </div>
          ) : (
            <select
              value={selectedLocationId || ''}
              onChange={e => {
                setSelectedLocationId(Number(e.target.value))
                setStagedChanges([])
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

        {/* Photos Section */}
        <div className="space-y-3">
          {/* Hidden Inputs */}
          <input
            type="file"
            ref={cameraInputRef}
            accept="image/*"
            capture="environment"
            onChange={async e => {
              const selected = Array.from(e.target.files || [])
              await addPhotos(selected)
            }}
            className="hidden"
          />
          <input
            type="file"
            ref={archiveInputRef}
            accept="image/*"
            multiple
            onChange={async e => {
              const selected = Array.from(e.target.files || [])
              await addPhotos(selected)
            }}
            className="hidden"
          />

          <label className="block text-xs font-bold uppercase tracking-wider text-fg-secondary">
            Fotos del Trabajo
          </label>

          {/* Existing Photos Grid in Edit Mode */}
          {isEdit && existingPhotos.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-fg-secondary">Fotos Actuales:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-app-bg/10 border border-app-border rounded-xl">
                {existingPhotos.map(photo => {
                  const isRemoved = removedPhotoIds.includes(photo.id)
                  return (
                    <div
                      key={photo.id}
                      className={`relative group aspect-square rounded-lg overflow-hidden border transition-all ${
                        isRemoved
                          ? 'border-rose-500/50 opacity-40 bg-rose-500/10'
                          : 'border-app-border bg-card'
                      }`}
                    >
                      <img
                        src={photo.url}
                        alt="Foto existente"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                        <button
                          type="button"
                          onClick={() => toggleRemoveExistingPhoto(photo.id)}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all active:scale-95 shadow-sm flex items-center gap-1 ${
                            isRemoved
                              ? 'bg-primary text-white hover:bg-primary-hover'
                              : 'bg-error text-white hover:bg-red-600'
                          }`}
                        >
                          {isRemoved ? (
                            <>
                              <RotateCcw className="w-3 h-3" /> Restaurar
                            </>
                          ) : (
                            <>
                              <Trash2 className="w-3 h-3" /> Eliminar
                            </>
                          )}
                        </button>
                      </div>
                      {isRemoved && (
                        <div className="absolute top-1 left-1 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                          A eliminar
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* New Photos Staging */}
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
                <p className="text-xs font-semibold text-fg mb-0.5">
                  Haz clic para seleccionar o arrastra fotos nuevas
                </p>
                <p className="text-[10px] text-muted">Formatos aceptados: PNG, JPG, WEBP (se comprimen automáticamente)</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-app-border rounded-xl p-6 bg-app-bg/10 text-center gap-3">
                <div className="text-center space-y-0.5">
                  <UploadCloud className="w-8 h-8 text-muted mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-fg">Añadir Fotos (Opcional)</p>
                  <p className="text-[10px] text-muted">Sube una o varias fotos del mantenimiento</p>
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
              <p className="text-[11px] font-semibold text-fg-secondary">Nuevas Fotos a Subir:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-app-bg/10 border border-app-border rounded-xl">
                {selectedPhotos.map((item, index) => (
                  <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-emerald-500/30 bg-card">
                    <img
                      src={item.previewUrl}
                      alt="Vista previa"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1 left-1 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                      Nueva
                    </div>
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
                  <UploadCloud className="w-3.5 h-3.5" /> Añadir Más Fotos
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Recursive Materials Editor Button */}
        {selectedLocationId > 0 && (
          <div className="space-y-3 pt-2">
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
                  <Check className="w-3.5 h-3.5 text-emerald-500" /> Cambios configurados
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
            {isPending
              ? isUploadingPhoto
                ? 'Subiendo fotos...'
                : 'Guardando...'
              : isEdit
              ? 'Guardar Cambios'
              : 'Registrar Trabajo'}
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
          onConfirm={updatedChanges => {
            setStagedChanges(updatedChanges)
            setShowMaterialModal(false)
          }}
        />
      )}
    </div>
  )
}
