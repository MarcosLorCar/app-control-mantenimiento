import { useState, useEffect, useRef } from 'react'
import { Modal } from '../../components/ui/Modal'
import { useCreateAction, useUpdateAction } from '../../hooks/useActions'
import { useLocations, locationKeys } from '../../hooks/useLocations'
import { useMaterialTypes, useCreateMaterialType, useFixedProperties } from '../../hooks/useCatalog'
import { useMaterialsByLocation } from '../../hooks/useMaterials'
import { LocationMap } from '../../components/ui/LocationMap'
import { useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash, ClipboardList, AlertCircle, Eye, Package, RotateCcw, MapPin, UploadCloud, Camera } from 'lucide-react'
import { uploadActionPhoto } from '../../api/actions'
import type { Action, Material } from '../../api/types'

interface Props {
  action?: Action
  locationId?: number
  onClose: () => void
}

interface ActiveMaterial {
  tempId: string
  id?: number
  name: string
  description: string | null
  attributes: Record<string, any>
  typeId: number
  type: {
    id: number
    code: string
    name: string
    icon?: string | null
  }
  isNew?: boolean
}

export function ActionForm({ action, locationId, onClose }: Props) {
  const isEdit = !!action
  const [selectedLocationId, setSelectedLocationId] = useState<number>(locationId ?? action?.locationId ?? 0)
  const [title, setTitle] = useState(action?.title ?? '')
  const [description, setDescription] = useState(action?.description ?? '')
  const [performedAt, setPerformedAt] = useState(() => {
    if (action?.performedAt) {
      return new Date(action.performedAt).toISOString().slice(0, 10)
    }
    return new Date().toISOString().slice(0, 10)
  })
  const [latitude, setLatitude] = useState<number | null>(action?.latitude ?? null)
  const [longitude, setLongitude] = useState<number | null>(action?.longitude ?? null)
  const [showMapModal, setShowMapModal] = useState(false)
  const [tempLat, setTempLat] = useState<number | null>(null)
  const [tempLng, setTempLng] = useState<number | null>(null)
  const [error, setError] = useState('')

  // Materials state (target state and tracking removals)
  const [activeMaterials, setActiveMaterials] = useState<ActiveMaterial[]>([])
  const [removedMaterialIds, setRemovedMaterialIds] = useState<number[]>([])

  // Sub-modal states for adding/editing a new material
  const [showSubModal, setShowSubModal] = useState(false)
  const [editingChangeId, setEditingChangeId] = useState<string | null>(null)
  
  // New Material fields
  const [subMatName, setSubMatName] = useState('')
  const [subMatTypeId, setSubMatTypeId] = useState<number>(0)
  const [subMatDescription, setSubMatDescription] = useState('')
  const [subMatAttributes, setSubMatAttributes] = useState<Record<string, any>>({})

  // Inline "nuevo tipo de material" fields
  const [showNewMaterialTypeInput, setShowNewMaterialTypeInput] = useState(false)
  const [newMaterialTypeName, setNewMaterialTypeName] = useState('')

  const qc = useQueryClient()

  // Queries
  const { data: locations = [] } = useLocations(undefined) // Fetch all for dropdown
  const { data: materialTypes = [] } = useMaterialTypes()
  const { data: fixedProperties = [] } = useFixedProperties()
  const { data: currentInstalledMaterials = [], isSuccess: isMaterialsSuccess } = useMaterialsByLocation(selectedLocationId) // Fetch materials currently at location for active materials list

  const [localCreatedTypes, setLocalCreatedTypes] = useState<any[]>([])
  const allMaterialTypes = [...materialTypes, ...localCreatedTypes]

  const createMut = useCreateAction()
  const updateMut = useUpdateAction()
  const createMaterialTypeMut = useCreateMaterialType()
  
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const isPending = createMut.isPending || updateMut.isPending || isUploadingPhoto

  const cameraInputRef = useRef<HTMLInputElement>(null)
  const archiveInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
    const isMobileOS = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
    const isIPad = navigator.maxTouchPoints > 0 && /Macintosh/.test(userAgent)
    setIsMobile(isMobileOS || isIPad)
  }, [])

  useEffect(() => {
    return () => {
      if (photoPreviewUrl) {
        URL.revokeObjectURL(photoPreviewUrl)
      }
    }
  }, [photoPreviewUrl])

  // Drag and drop handlers for photo upload
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
    const selected = e.dataTransfer.files?.[0] || null
    if (selected) {
      if (selected.type.startsWith('image/')) {
        setSelectedPhoto(selected)
        if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl)
        setPhotoPreviewUrl(URL.createObjectURL(selected))
      }
    }
  }

  // Load currently installed materials as active when selectedLocationId updates
  useEffect(() => {
    if (!isEdit && selectedLocationId > 0 && isMaterialsSuccess && currentInstalledMaterials) {
      setActiveMaterials(
        currentInstalledMaterials.map(m => ({
          tempId: `existing-${m.id}`,
          id: m.id,
          name: m.name,
          description: m.description,
          attributes: m.attributes || {},
          typeId: m.typeId,
          type: m.type,
        }))
      )
      setRemovedMaterialIds([])
    }
  }, [currentInstalledMaterials, isMaterialsSuccess, selectedLocationId, isEdit])

  function handleTypeDropdownChange(val: string) {
    if (val === '__new__') {
      setShowNewMaterialTypeInput(true)
    } else {
      setShowNewMaterialTypeInput(false)
      setSubMatTypeId(Number(val))
    }
  }

  function handleCreateMaterialType() {
    if (!newMaterialTypeName.trim()) return
    const code = newMaterialTypeName.trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_')
    createMaterialTypeMut.mutate(
      { code, name: newMaterialTypeName.trim() },
      {
        onSuccess: (created) => {
          setLocalCreatedTypes(prev => [...prev, created])
          setSubMatTypeId(created.id)
          setNewMaterialTypeName('')
          setShowNewMaterialTypeInput(false)
        },
      }
    )
  }

  const handleAttrChange = (code: string, val: any) => {
    setSubMatAttributes(prev => ({ ...prev, [code]: val }))
  }

  // Open sub-modal to register a new material
  function openAddChange() {
    setEditingChangeId(null)
    setSubMatName('')
    setSubMatTypeId(0)
    setSubMatDescription('')
    setSubMatAttributes({})
    setShowNewMaterialTypeInput(false)
    setShowSubModal(true)
  }

  // Open sub-modal to edit an existing material
  function openEditChange(mat: ActiveMaterial) {
    setEditingChangeId(mat.tempId)
    setSubMatName(mat.name)
    setSubMatTypeId(mat.typeId)
    setSubMatDescription(mat.description ?? '')
    setSubMatAttributes(mat.attributes ?? {})
    setShowNewMaterialTypeInput(false)
    setShowSubModal(true)
  }

  // Remove/Uninstall or restore material from the active list
  function handleToggleRemoveMaterial(tempId: string) {
    const mat = activeMaterials.find(m => m.tempId === tempId)
    if (!mat) return

    if (mat.isNew) {
      // If it's a newly added material, we can just delete it immediately
      setActiveMaterials(prev => prev.filter(m => m.tempId !== tempId))
    } else if (mat.id) {
      // If it's an existing material, toggle its removal state
      const isCurrentlyRemoved = removedMaterialIds.includes(mat.id)
      if (isCurrentlyRemoved) {
        // Restore it
        setRemovedMaterialIds(prev => prev.filter(id => id !== mat.id))
      } else {
        // Mark for removal
        setRemovedMaterialIds(prev => [...prev, mat.id!])
      }
    }
  }

  // Save changes from sub-modal
  async function saveSubModalChange() {
    if (!subMatName.trim()) return

    let finalTypeId = subMatTypeId
    let mType = allMaterialTypes.find(t => t.id === subMatTypeId)

    if (showNewMaterialTypeInput) {
      if (!newMaterialTypeName.trim()) return
      const code = newMaterialTypeName.trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_')
      try {
        const created = await createMaterialTypeMut.mutateAsync({ code, name: newMaterialTypeName.trim() })
        setLocalCreatedTypes(prev => [...prev, created])
        finalTypeId = created.id
        mType = created
        setNewMaterialTypeName('')
        setShowNewMaterialTypeInput(false)
      } catch (err) {
        console.error(err)
        return // stop execution if api call fails
      }
    }

    if (!finalTypeId || !mType) return

    if (editingChangeId) {
      setActiveMaterials(prev => prev.map(m => {
        if (m.tempId === editingChangeId) {
          return {
            ...m,
            name: subMatName.trim(),
            typeId: finalTypeId,
            description: subMatDescription.trim() || null,
            attributes: subMatAttributes,
            type: mType!,
          }
        }
        return m
      }))
    } else {
      const newMat: ActiveMaterial = {
        tempId: `new-${Date.now()}`,
        name: subMatName.trim(),
        typeId: finalTypeId,
        description: subMatDescription.trim() || null,
        attributes: subMatAttributes,
        type: mType,
        isNew: true,
      }
      setActiveMaterials(prev => [...prev, newMat])
    }
    setShowSubModal(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!selectedLocationId) {
      setError('Debes especificar una ubicación.')
      return
    }

    if (!title.trim()) {
      setError('El título del trabajo es obligatorio.')
      return
    }

    // Compute backend materials operations payload from differences
    const formattedMaterials: any[] = []

    // 1. Uninstalls: any material that was originally installed but is no longer in activeMaterials
    removedMaterialIds.forEach(id => {
      formattedMaterials.push({
        materialId: id,
        operation: 'UNINSTALL' as const
      })
    })

    // 2. Installs: any material in activeMaterials that is newly added (has isNew: true)
    activeMaterials.forEach(m => {
      if (m.isNew) {
        formattedMaterials.push({
          name: m.name,
          typeId: m.typeId,
          description: m.description,
          attributes: m.attributes,
          operation: 'INSTALL' as const
        })
      }
    })

    const body = {
      title: title.trim(),
      description: description.trim() || null,
      performedAt: new Date(performedAt).toISOString(),
      locationId: selectedLocationId,
      latitude: latitude ?? undefined,
      longitude: longitude ?? undefined,
      materials: formattedMaterials
    }

    if (isEdit) {
      updateMut.mutate(
        {
          id: action!.id,
          body: {
            title: body.title,
            description: body.description,
            performedAt: body.performedAt
          }
        },
        {
          onSuccess: onClose,
          onError: (err: any) => setError(err?.error?.message ?? 'Error al guardar los cambios'),
        }
      )
    } else {
      createMut.mutate(body, {
        onSuccess: async (data) => {
          qc.invalidateQueries({ queryKey: locationKeys.all })
          if (selectedPhoto) {
            setIsUploadingPhoto(true)
            try {
              await uploadActionPhoto(data.id, selectedPhoto)
            } catch (err) {
              console.error('Error uploading action image:', err)
            } finally {
              setIsUploadingPhoto(false)
            }
          }
          onClose()
        },
        onError: (err: any) => setError(err?.error?.message ?? 'Error al registrar el trabajo'),
      })
    }
  }

  const inputCls = 'w-full border border-app-border rounded-lg px-3 py-2 text-sm bg-card text-fg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors'

  return (
    <Modal title={isEdit ? 'Editar Información del Trabajo' : 'Registrar Trabajo / Mantenimiento'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col max-h-[75vh]">
        <div className="flex-1 overflow-y-auto pr-3 pb-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-fg-secondary mb-1">
              Título / Nombre de Tarea <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              placeholder="Ej: Revisión general, Cambio anual de motor..."
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-fg-secondary mb-1">Descripción del Trabajo</label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className={inputCls}
              placeholder="Especifica los detalles de la intervención realizada..."
            />
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

          {/* Materials list section directly under date and description */}
          {!isEdit && selectedLocationId > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-fg uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-primary" /> Materiales Instalados
                </h3>
              </div>

              <div className="border border-app-border rounded-xl bg-card overflow-hidden">
                {/* Add Material button as top entry */}
                <button
                  type="button"
                  onClick={openAddChange}
                  className="w-full flex items-center gap-2 px-4 py-3 text-xs font-semibold text-primary hover:bg-app-bg transition-colors border-b border-app-border text-left"
                >
                  <Plus className="w-4 h-4" />
                  + Registrar / Instalar nuevo equipo...
                </button>

                {activeMaterials.length === 0 ? (
                  <div className="p-6 text-center text-muted text-xs italic bg-app-bg/10">
                    No hay materiales instalados en esta ubicación. Pulsa el botón superior para añadir uno.
                  </div>
                ) : (
                  <div className="divide-y divide-app-border">
                    {activeMaterials.map(mat => {
                      const isRemoved = mat.id ? removedMaterialIds.includes(mat.id) : false
                      return (
                        <div
                          key={mat.tempId}
                          className={`flex items-center justify-between p-3.5 transition-colors ${
                            isRemoved
                              ? 'bg-red-500/5 hover:bg-red-500/10 border-l-4 border-l-red-500 opacity-80'
                              : mat.isNew
                              ? 'bg-emerald-500/5 hover:bg-emerald-500/10 border-l-4 border-l-emerald-500'
                              : 'hover:bg-app-bg/40'
                          }`}
                        >
                          <div className="flex-1 min-w-0 pr-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-bold text-xs break-words whitespace-normal ${isRemoved ? 'line-through text-muted' : 'text-fg'}`}>
                                {mat.name}
                              </span>
                              <span className="text-[9px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-app-bg border border-app-border text-muted shrink-0">
                                {mat.type.name}
                              </span>
                              {mat.isNew && (
                                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded shrink-0">
                                  INSTALAR
                                </span>
                              )}
                              {isRemoved && (
                                <span className="text-[9px] font-bold text-red-600 bg-red-500/10 px-1.5 py-0.5 rounded shrink-0">
                                  RETIRAR
                                </span>
                              )}
                            </div>
                            {mat.description && (
                              <p className="text-[11px] text-muted truncate mt-0.5">{mat.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {!isRemoved && (
                              <button
                                type="button"
                                onClick={() => openEditChange(mat)}
                                className="p-1 text-muted hover:text-fg hover:bg-app-bg rounded transition-colors"
                                title="Editar detalles"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleToggleRemoveMaterial(mat.tempId)}
                              className="p-1 text-muted hover:bg-app-bg rounded transition-colors"
                              title={isRemoved ? 'Restaurar material' : 'Retirar material'}
                            >
                              {isRemoved ? (
                                <RotateCcw className="w-3.5 h-3.5 text-primary hover:text-primary-hover" />
                              ) : (
                                <Trash className="w-3.5 h-3.5 hover:text-error" />
                              )}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {!isEdit && (
            <div>
              <label className="block text-xs font-semibold text-fg-secondary mb-1">
                Ubicación <span className="text-error">*</span>
              </label>
              <select
                value={selectedLocationId}
                onChange={e => setSelectedLocationId(Number(e.target.value))}
                className={inputCls}
                required
                disabled={!!locationId} // Lock location if we are on a specific location page
              >
                <option value={0}>Seleccionar ubicación...</option>
                {locations.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Adjuntar Foto */}
          {!isEdit && (
            <div>
              {/* Hidden Inputs */}
              <input
                type="file"
                ref={cameraInputRef}
                accept="image/*"
                capture="environment"
                onChange={e => {
                  const selected = e.target.files?.[0] || null
                  setSelectedPhoto(selected)
                  if (selected) {
                    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl)
                    setPhotoPreviewUrl(URL.createObjectURL(selected))
                  }
                }}
                className="hidden"
              />
              <input
                type="file"
                ref={archiveInputRef}
                accept="image/*"
                onChange={e => {
                  const selected = e.target.files?.[0] || null
                  setSelectedPhoto(selected)
                  if (selected) {
                    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl)
                    setPhotoPreviewUrl(URL.createObjectURL(selected))
                  }
                }}
                className="hidden"
              />

              <label className="block text-xs font-semibold text-fg-secondary mb-1.5">
                Adjuntar Foto del Trabajo (Opcional)
              </label>
              
              {!selectedPhoto ? (
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
                    <p className="text-xs font-semibold text-fg mb-0.5">Haz clic para seleccionar o arrastra una foto</p>
                    <p className="text-[10px] text-muted">Formatos aceptados: PNG, JPG, WEBP</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-app-border rounded-xl p-6 bg-app-bg/10 text-center gap-3">
                    <div className="text-center space-y-0.5">
                      <UploadCloud className="w-8 h-8 text-muted mx-auto mb-1.5" />
                      <p className="text-xs font-semibold text-fg">Foto del Trabajo (Opcional)</p>
                      <p className="text-[10px] text-muted">Sube una foto del mantenimiento realizado</p>
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
                        <UploadCloud className="w-3.5 h-3.5" /> Seleccionar Archivo
                      </button>
                    </div>
                  </div>
                )
              ) : (
                <div className="border border-app-border bg-app-bg/15 rounded-xl p-3 flex items-center gap-3 relative animate-fade-in">
                  {photoPreviewUrl && (
                    <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-app-border bg-black/5 flex items-center justify-center">
                      <img
                        src={photoPreviewUrl}
                        alt="Vista previa"
                        className="w-full h-full object-cover shadow-sm"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-fg truncate pr-1" title={selectedPhoto.name}>
                      {selectedPhoto.name}
                    </p>
                    <p className="text-[10px] text-muted font-mono mt-0.5">
                      {(selectedPhoto.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => archiveInputRef.current?.click()}
                      className="px-2.5 py-1.5 border border-app-border bg-card hover:bg-app-bg text-fg-secondary hover:text-fg rounded-lg text-[10px] font-semibold cursor-pointer transition-all active:scale-95 shadow-sm"
                    >
                      Cambiar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPhoto(null)
                        if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl)
                        setPhotoPreviewUrl(null)
                      }}
                      className="px-2.5 py-1.5 border border-error/25 bg-error/10 hover:bg-error/20 text-error rounded-lg text-[10px] font-semibold transition-all active:scale-95 shadow-sm"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* GPS Coordinates Map */}
          {!isEdit && (
            <div className="flex flex-col gap-2 p-3 bg-app-bg/50 border border-app-border rounded-lg">
              <div className="flex justify-between items-center text-xs">
                <span className="text-fg-secondary font-medium">Ubicación GPS de la Tarea:</span>
                <span className="font-mono text-muted text-[11px]">
                  {latitude !== null && longitude !== null
                    ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
                    : 'Sin asignar'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTempLat(latitude ?? 38.9863)
                  setTempLng(longitude ?? -3.9291)
                  setShowMapModal(true)
                }}
                className="w-full py-2 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <MapPin className="w-3.5 h-3.5" />
                {latitude !== null && longitude !== null ? 'Modificar en el mapa' : 'Asignar en el mapa'}
              </button>
            </div>
          )}

          {error && <p className="text-error text-sm">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-app-border/40 bg-card shrink-0">
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
            {isPending ? (isUploadingPhoto ? 'Subiendo foto...' : 'Guardando...') : isEdit ? 'Guardar Cambios' : 'Registrar Trabajo'}
          </button>
        </div>
      </form>

      {showMapModal && (
        <Modal title="Seleccionar Ubicación" onClose={() => setShowMapModal(false)} size="full">
          <div className="space-y-4 flex flex-col h-full flex-1">
            <div className="flex-1 flex flex-col min-h-0">
              <LocationMap
                latitude={tempLat}
                longitude={tempLng}
                onChange={(lat, lng) => {
                  setTempLat(lat)
                  setTempLng(lng)
                }}
                className="min-h-0"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowMapModal(false)}
                className="px-4 py-2 text-sm text-fg-secondary border border-app-border rounded-lg hover:bg-app-bg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setLatitude(tempLat)
                  setLongitude(tempLng)
                  setShowMapModal(false)
                }}
                className="px-4 py-2 text-sm text-primary-fg bg-primary rounded-lg hover:bg-[var(--primary-hover)] transition-colors font-semibold"
              >
                Aceptar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Sub-Modal for adding/editing material details */}
      {showSubModal && (
        <Modal
          title={editingChangeId ? 'Editar Detalles de Material' : 'Registrar Material'}
          onClose={() => setShowSubModal(false)}
        >
          <div className="flex flex-col max-h-[70vh]">
            <div className="flex-1 overflow-y-auto pr-3 pb-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-fg-secondary mb-1">
                  Nombre del Material <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={subMatName}
                  onChange={e => setSubMatName(e.target.value)}
                  placeholder="Ej: Bombilla Inteligente Retiro 4"
                  className={inputCls}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-fg-secondary mb-1">
                  Tipo de Material <span className="text-error">*</span>
                </label>
                <select
                  value={showNewMaterialTypeInput ? '__new__' : String(subMatTypeId || 0)}
                  onChange={e => handleTypeDropdownChange(e.target.value)}
                  className={inputCls}
                  required
                >
                  <option value="0" disabled hidden>Seleccionar tipo...</option>
                  {allMaterialTypes.map(t => (
                    <option key={t.id} value={String(t.id)}>{t.name}</option>
                  ))}
                  <option value="__new__">+ Crear nuevo tipo...</option>
                </select>
                {showNewMaterialTypeInput && (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={newMaterialTypeName}
                      onChange={e => setNewMaterialTypeName(e.target.value)}
                      placeholder="Nombre del nuevo tipo (ej: Sensor)"
                      className={inputCls}
                      autoFocus
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-fg-secondary mb-1">Ficha Técnica / Descripción</label>
                <textarea
                  rows={2}
                  value={subMatDescription}
                  onChange={e => setSubMatDescription(e.target.value)}
                  placeholder="Detalla las especificaciones técnicas..."
                  className={inputCls}
                />
              </div>

              {/* Fixed properties section (always visible by default) */}
              {fixedProperties.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-fg-secondary uppercase tracking-wider">
                    Propiedades Fijas (Garantía, compra, etc.)
                  </h4>
                  
                  <div className="p-3 bg-app-bg border border-app-border rounded-lg space-y-3">
                    {fixedProperties.map(prop => {
                      const value = subMatAttributes[prop.code] ?? ''
                      const label = (
                        <label className="block text-[10px] font-semibold text-fg-secondary mb-1">
                          {prop.name}
                        </label>
                      )

                      if (prop.type === 'DATE') {
                        return (
                          <div key={prop.id}>
                            {label}
                            <input
                              type="date"
                              value={value}
                              onChange={e => handleAttrChange(prop.code, e.target.value)}
                              className={inputCls}
                            />
                          </div>
                        )
                      }

                      if (prop.type === 'NUMBER') {
                        return (
                          <div key={prop.id}>
                            {label}
                            <input
                              type="number"
                              value={value}
                              onChange={e => handleAttrChange(prop.code, e.target.value === '' ? undefined : Number(e.target.value))}
                              className={inputCls}
                            />
                          </div>
                        )
                      }

                      if (prop.type === 'BOOLEAN') {
                        return (
                          <div key={prop.id} className="flex items-center gap-2 py-1">
                            <input
                              type="checkbox"
                              id={`sub-prop-${prop.code}`}
                              checked={!!value}
                              onChange={e => handleAttrChange(prop.code, e.target.checked)}
                              className="rounded border-app-border text-primary focus:ring-primary/40"
                            />
                            <label htmlFor={`sub-prop-${prop.code}`} className="text-xs font-semibold text-fg-secondary">
                              {prop.name}
                            </label>
                          </div>
                        )
                      }

                      return (
                        <div key={prop.id}>
                          {label}
                          <input
                            type="text"
                            value={value}
                            onChange={e => handleAttrChange(prop.code, e.target.value)}
                            className={inputCls}
                            placeholder={`Valor para ${prop.name}`}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-app-border bg-card shrink-0">
              <button
                type="button"
                onClick={() => setShowSubModal(false)}
                className="px-3 py-1.5 text-xs text-fg-secondary border border-app-border rounded-lg hover:bg-app-bg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveSubModalChange}
                disabled={!subMatName.trim() || (showNewMaterialTypeInput ? !newMaterialTypeName.trim() : !subMatTypeId) || createMaterialTypeMut.isPending}
                className="px-3 py-1.5 text-xs text-primary-fg bg-primary rounded-lg hover:bg-[var(--primary-hover)] disabled:opacity-50"
              >
                {createMaterialTypeMut.isPending ? 'Guardando...' : 'Aceptar'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  )
}
