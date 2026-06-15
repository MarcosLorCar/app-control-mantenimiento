import { useState, useEffect, Fragment } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Folder, GitBranch, Package, Zap, Plus, Pencil, Trash, ChevronRight, ChevronDown, Camera, Calendar, MapPin, Image } from 'lucide-react'
import { useLocation, useDeleteLocation, useLocations, useUploadLocationImage, useDeleteLocationImage, useLocationGallery, useDeleteLocationPhoto } from '../../hooks/useLocations'
import { RoleGuard } from '../../components/RoleGuard'
import { LocationForm } from '../../components/forms/LocationForm'
import { MaterialForm } from '../../components/forms/MaterialForm'
import { LocationPhotoUploadModal } from '../../components/forms/LocationPhotoUploadModal'
import { ImagePreviewModal } from '../../components/ui/ImagePreviewModal'
import { Modal } from '../../components/ui/Modal'
import type { Location, Material, LocationPhoto } from '../../api/types'
import { MaterialAttributePills } from '../../components/MaterialAttributePills'
import { MaterialEditAttributesModal } from '../../components/forms/MaterialEditAttributesModal'
import { getCategoryIcon } from '../../utils/categoryIcons'
import { PhotoUploadModal } from '../../components/forms/PhotoUploadModal'



function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function LocationDetail() {
  const { id } = useParams<{ id: string }>()
  const locationId = Number(id)
  const navigate = useNavigate()

  const { data: loc, isLoading, error } = useLocation(locationId)
  const { data: allLocs = [] } = useLocations(undefined) // Fetch all for breadcrumbs name resolution
  const deleteLoc = useDeleteLocation()
  const uploadImageMutation = useUploadLocationImage()
  const deleteImageMutation = useDeleteLocationImage()

  // Calculate root ID safely at hook level
  const pathIds = loc?.path ? loc.path.split('/').filter(Boolean).map(Number) : []
  const rootId = pathIds[0] || locationId
  const rootLocation = allLocs.find(l => l.id === rootId) || loc

  const [showEdit, setShowEdit] = useState(false)
  const [showAddChild, setShowAddChild] = useState(false)
  const [showAddMaterial, setShowAddMaterial] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
  const [expandedChildIds, setExpandedChildIds] = useState<Set<number>>(new Set())
  const [previewImage, setPreviewImage] = useState<{ src: string; alt: string } | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showGalleryModal, setShowGalleryModal] = useState(false)
  const [showGalleryUploadModal, setShowGalleryUploadModal] = useState(false)
  const [previewGalleryPhoto, setPreviewGalleryPhoto] = useState<LocationPhoto | null>(null)
  
  const { data: galleryPhotos = [] } = useLocationGallery(rootId)
  const deleteGalleryPhotoMut = useDeleteLocationPhoto()

  const handleDeleteGalleryPhoto = async (photoId: number) => {
    deleteGalleryPhotoMut.mutate({ locationId: rootId, photoId })
  }

  const handleDeleteImage = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('¿Eliminar la foto de esta ubicación?')) return
    try {
      await deleteImageMutation.mutateAsync(locationId)
    } catch (err) {
      alert('Error al eliminar la imagen')
      console.error(err)
    }
  }

  const toggleExpanded = (childId: number) => {
    setExpandedChildIds(prev => {
      const next = new Set(prev)
      if (next.has(childId)) {
        next.delete(childId)
      } else {
        next.add(childId)
      }
      return next
    })
  }

  const handleUploadImage = async (file: File) => {
    await uploadImageMutation.mutateAsync({ id: locationId, file })
  }

  async function handleDelete() {
    if (!confirm('¿Eliminar esta ubicación? Sus sub-ubicaciones subirán un nivel en la jerarquía. Esta acción no se puede deshacer.')) return
    // Capture navigation target NOW, before the mutation clears the cache
    const redirectTo = loc?.parentId
      ? `/locations/${loc.parentId}`
      : loc?.infraTypeId
        ? `/categories/${loc.infraTypeId}`
        : '/'
    try {
      await deleteLoc.mutateAsync(locationId)
      navigate(redirectTo)
    } catch (err) {
      console.error('Error al eliminar la ubicación:', err)
      alert('No se pudo eliminar la ubicación. Por favor, inténtalo de nuevo.')
    }
  }

  if (isLoading) return <p className="text-muted text-sm py-20 text-center">Cargando detalles de ubicación...</p>
  if (error || !loc) return <p className="text-error text-sm py-20 text-center">Ubicación no encontrada.</p>

  // Build breadcrumbs
  const breadcrumbs = pathIds.map(pid => {
    const found = allLocs.find(l => l.id === pid)
    return found || { id: pid, name: pid === locationId ? loc.name : `Cargando...`, infraTypeId: loc.infraTypeId }
  })

  return (
    <div className="space-y-6">
      {/* Header and Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-start gap-4 justify-between">
        <div>
          {/* Breadcrumb row */}
          <nav className="text-xs text-muted flex items-center gap-1.5 mb-3 flex-wrap">
            <Link to="/" className="hover:text-fg font-medium">Categorías</Link>
            {loc.infraType && (
              <>
                <span className="text-muted/60">/</span>
                <Link to={`/categories/${loc.infraTypeId}`} className="hover:text-fg font-medium">{loc.infraType.name}</Link>
              </>
            )}
            {breadcrumbs.map((b, idx) => (
              <span key={b.id} className="flex items-center gap-1.5">
                <span className="text-muted/60">/</span>
                {idx === breadcrumbs.length - 1 ? (
                  <span className="text-fg font-semibold truncate max-w-40">{b.name}</span>
                ) : (
                  <Link to={`/locations/${b.id}`} className="hover:text-fg truncate max-w-40">{b.name}</Link>
                )}
              </span>
            ))}
          </nav>

          {/* Category Icon / Custom Image Header Display */}
          {(() => {
            return (
              <div className="flex items-center gap-3.5">
                <div className="relative shrink-0">
                  <div className="w-20 h-20 bg-primary/10 rounded-xl flex items-center justify-center text-primary overflow-hidden border border-app-border/45 shadow-sm">
                    {loc.image ? (
                      <button
                        type="button"
                        onClick={() => setPreviewImage({ src: loc.image!, alt: loc.name })}
                        className="w-full h-full"
                        title="Ver foto en grande"
                      >
                        <img src={loc.image} alt={loc.name} className="w-full h-full object-cover animate-fade-in" />
                      </button>
                    ) : (
                      <MapPin className="w-7 h-7" />
                    )}
                  </div>
                  <RoleGuard require="write">
                    <div className="absolute -inset-1 pointer-events-none">
                      {/* Camera upload badge */}
                      <button
                        type="button"
                        onClick={() => setShowUploadModal(true)}
                        className="absolute bottom-0 right-0 w-6 h-6 bg-primary text-primary-fg rounded-full flex items-center justify-center shadow-md border border-card pointer-events-auto cursor-pointer hover:bg-[var(--primary-hover)] active:scale-95 transition-all"
                        title="Cambiar foto / Tomar foto"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>
                      
                      {/* Trash removal badge */}
                      {loc.image && (
                        <button
                          type="button"
                          onClick={handleDeleteImage}
                          disabled={deleteImageMutation.isPending}
                          className="absolute -top-1 -right-1 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-md border border-card pointer-events-auto cursor-pointer hover:bg-rose-600 active:scale-95 transition-all"
                          title="Eliminar foto"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </RoleGuard>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-fg leading-tight">{loc.name}</h1>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap mt-0.5">
                    {loc.infraType && (
                      <p className="text-[11px] font-mono uppercase text-primary tracking-wider">{loc.infraType.name}</p>
                    )}
                    {loc.latitude !== null && loc.longitude !== null && (
                      <button
                        onClick={() => navigate(`/map?lat=${loc.latitude}&lng=${loc.longitude}&selectId=${loc.id}`)}
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded transition-all active:scale-95 shadow-sm"
                        title="Ver esta ubicación en el mapa"
                      >
                        <MapPin className="w-3 h-3" />
                        <span>Ver en mapa</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })()}
          {loc.description && <p className="text-sm text-fg-secondary mt-2 pl-19.5">{loc.description}</p>}
        </div>

        {/* Header Action Buttons */}
        <div className="flex gap-2 shrink-0 flex-wrap">
          <RoleGuard require="write">
            <button
              onClick={() => navigate(`/actions/new?locationId=${rootId}`)}
              className="flex items-center gap-1.5 bg-primary text-primary-fg px-3.5 py-2 rounded-lg text-xs font-semibold hover:bg-[var(--primary-hover)] shadow-sm transition-all"
            >
              <Zap className="w-3.5 h-3.5" /> Registrar Trabajo
            </button>
          </RoleGuard>
          <button
            onClick={() => setShowGalleryModal(true)}
            className="flex items-center gap-1.5 border border-app-border px-3.5 py-2 rounded-lg text-xs font-semibold text-fg-secondary bg-card hover:bg-app-bg hover:text-fg shadow-sm transition-all"
          >
            <Image className="w-3.5 h-3.5 text-primary" /> Galería
          </button>
          <RoleGuard require="write">
            <button
              onClick={() => setShowAddMaterial(true)}
              className="flex items-center gap-1.5 border border-app-border px-3.5 py-2 rounded-lg text-xs font-semibold text-fg-secondary bg-card hover:bg-app-bg hover:text-fg shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Añadir Material
            </button>
          </RoleGuard>
          <RoleGuard require="write">
            <button
              onClick={() => setShowAddChild(true)}
              className="flex items-center gap-1.5 border border-app-border px-3.5 py-2 rounded-lg text-xs font-semibold text-fg-secondary bg-card hover:bg-app-bg hover:text-fg shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Nueva Sub-ubicación
            </button>
          </RoleGuard>
          <RoleGuard require="write">
            <button
              onClick={() => setShowEdit(true)}
              className="flex items-center gap-1.5 border border-app-border px-3.5 py-2 rounded-lg text-xs font-semibold text-fg-secondary bg-card hover:bg-app-bg hover:text-fg shadow-sm transition-all"
            >
              <Pencil className="w-3.5 h-3.5" /> Editar
            </button>
          </RoleGuard>
          <RoleGuard require="manage">
            <button
              onClick={handleDelete}
              disabled={deleteLoc.isPending}
              className="flex items-center gap-1.5 border border-red-200 bg-red-50 text-red-600 px-3.5 py-2 rounded-lg text-xs font-semibold hover:bg-red-100 disabled:opacity-50 transition-all shadow-sm"
            >
              <Trash className="w-3.5 h-3.5" /> Eliminar
            </button>
          </RoleGuard>
        </div>
      </div>

      {/* Helper render block to avoid duplicating code between stacked and column layouts */}
      {(() => {
        const isRootLocation = loc.parentId === null
        const hasItems = loc.children.length > 0 || loc.materials.length > 0 || (loc.descendantMaterials?.length ?? 0) > 0

        const materialsSection = (
          <section className="bg-card rounded-xl border border-app-border p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-fg flex items-center gap-2">
                {isRootLocation ? (
                  <>
                    <Folder className="w-4 h-4 text-primary" /> Sub-Ubicaciones
                  </>
                ) : (
                  <>
                    <Package className="w-4 h-4 text-primary" /> Inventario de Materiales y Sub-ubicaciones
                  </>
                )}
              </h2>
              {!isRootLocation && (
                <RoleGuard require="write">
                  <button
                    onClick={() => setShowAddMaterial(true)}
                    className="flex items-center gap-1.5 border border-app-border px-3 py-1.5 rounded-lg text-xs font-semibold text-fg-secondary bg-card hover:bg-app-bg hover:text-fg shadow-sm transition-all"
                  >
                    <Plus className="w-3 h-3" /> Añadir Material
                  </button>
                </RoleGuard>
              )}
            </div>

            {!hasItems ? (
              <div className="p-8 text-center text-muted text-xs italic bg-app-bg/40 rounded-lg border border-dashed border-app-border">
                {isRootLocation
                  ? 'Sin sub-ubicaciones registradas en esta ubicación.'
                  : 'Sin materiales o sub-ubicaciones registradas en esta ubicación.'}
              </div>
            ) : (
              <>
                {/* Desktop view table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-app-border text-muted font-bold">
                        <th className="pb-2.5 font-semibold">Nombre</th>
                        <th className="pb-2.5 font-semibold">Tipo</th>
                        <th className="pb-2.5 font-semibold">Instalación / Ubicación Actual</th>
                        <th className="pb-2.5" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-app-border/40">
                      {/* 1. Direct Materials (Instalados aquí) */}
                      {!isRootLocation && loc.materials.map(mat => (
                        <tr
                          key={`mat-${mat.id}`}
                          onClick={() => setEditingMaterial(mat)}
                          className="hover:bg-app-bg/30 transition-colors cursor-pointer"
                        >
                          <td className="py-3 text-fg pl-2">
                            <span className="font-semibold block">📦 {mat.name}</span>
                            <span className="text-[11px] text-fg-secondary block line-clamp-1 mt-0.5">{mat.description || 'Sin descripción'}</span>
                            <MaterialAttributePills material={mat} />
                          </td>
                          <td className="py-3 text-fg-secondary">{mat.type?.name}</td>
                          <td className="py-3 text-muted">{mat.installedAt ? formatDate(mat.installedAt) : '—'}</td>
                          <td className="py-3 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingMaterial(mat)
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                            >
                              Ver / Editar Ficha
                            </button>
                          </td>
                        </tr>
                      ))}

                      {/* 2. Subfolders and their respective descendant materials */}
                      {loc.children.map(child => {
                        const branchMaterials = loc.descendantMaterials?.filter(
                          mat => mat.location?.path.startsWith(child.path)
                        ) || []
                        const isExpanded = expandedChildIds.has(child.id)

                        return (
                          <Fragment key={`child-group-${child.id}`}>
                            {/* Subfolder (child location) */}
                            <tr key={`child-${child.id}`} className="hover:bg-app-bg/30 transition-colors bg-app-bg/5">
                              <td className="py-3 text-fg font-semibold pl-6">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => toggleExpanded(child.id)}
                                    className="p-1 hover:bg-app-bg/50 rounded text-muted hover:text-fg transition-colors"
                                  >
                                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                  </button>
                                  {child.image ? (
                                    <button
                                      type="button"
                                      onClick={e => { e.stopPropagation(); setPreviewImage({ src: child.image!, alt: child.name }) }}
                                      className="w-9 h-9 rounded-lg overflow-hidden shrink-0 border border-app-border/40 hover:ring-2 hover:ring-primary/50 transition-all"
                                      title="Ver foto"
                                    >
                                      <img src={child.image} alt={child.name} className="w-full h-full object-cover" />
                                    </button>
                                  ) : (
                                    <Folder className="w-4 h-4 text-primary shrink-0" />
                                  )}
                                  <button
                                    onClick={() => navigate(`/locations/${child.id}`)}
                                    className="hover:underline text-left text-primary font-bold"
                                  >
                                    {child.name}
                                  </button>
                                </div>
                                {child.description && (
                                  <span className="text-[11px] text-fg-secondary block line-clamp-1 mt-0.5 ml-14">
                                    {child.description}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 text-muted">Sub-ubicación ({child.infraType?.name || 'Rama'})</td>
                              <td className="py-3 text-muted">
                                {child._count?.children || 0} sub-ubics · {child._count?.materials || 0} mat.
                              </td>
                              <td className="py-3 text-right">
                                <button
                                  onClick={() => navigate(`/locations/${child.id}`)}
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                                >
                                  Abrir
                                </button>
                              </td>
                            </tr>

                            {/* Descendant materials in this child's subtree */}
                            {isExpanded && branchMaterials.map(mat => (
                              <tr
                                key={`desc-mat-${mat.id}`}
                                onClick={() => setEditingMaterial(mat)}
                                className="hover:bg-app-bg/30 transition-colors opacity-80 bg-app-bg/5 cursor-pointer"
                              >
                                <td className="py-3 text-fg pl-10 border-l-2 border-app-border">
                                  <span className="font-medium block text-fg-secondary">📦 {mat.name}</span>
                                  <span className="text-[11px] text-muted block line-clamp-1 mt-0.5">{mat.description || 'Sin descripción'}</span>
                                  <MaterialAttributePills material={mat} />
                                </td>
                                <td className="py-3 text-muted">{mat.type?.name}</td>
                                <td className="py-3 text-muted">
                                  <span>Instalado en: </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      navigate(`/locations/${mat.locationId}`)
                                    }}
                                    className="hover:underline text-primary font-semibold text-left"
                                  >
                                    {mat.location?.name}
                                  </button>
                                </td>
                                <td className="py-3 text-right">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setEditingMaterial(mat)
                                    }}
                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                                  >
                                    Ver / Editar Ficha
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </Fragment>
                        )
                      })}

                      {/* 3. Fallback: Unmatched Descendant Materials */}
                      {(() => {
                        const matchedIds = new Set(loc.children.flatMap(child => {
                          const branchMaterials = loc.descendantMaterials?.filter(
                            mat => mat.location?.path.startsWith(child.path)
                          ) || []
                          return branchMaterials.map(m => m.id)
                        }))
                        const unmatchedMaterials = loc.descendantMaterials?.filter(mat => !matchedIds.has(mat.id)) || []
                        if (unmatchedMaterials.length === 0) return null

                        return unmatchedMaterials.map(mat => (
                          <tr
                            key={`unmatched-desc-mat-${mat.id}`}
                            onClick={() => setEditingMaterial(mat)}
                            className="hover:bg-app-bg/30 transition-colors opacity-80 bg-app-bg/5 cursor-pointer"
                          >
                            <td className="py-3 text-fg pl-10 border-l-2 border-app-border">
                              <span className="font-medium block text-fg-secondary">📦 {mat.name}</span>
                              <span className="text-[11px] text-muted block line-clamp-1 mt-0.5">{mat.description || 'Sin descripción'}</span>
                              <MaterialAttributePills material={mat} />
                            </td>
                            <td className="py-3 text-muted">{mat.type?.name}</td>
                            <td className="py-3 text-muted">
                              <span>Instalado en: </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  navigate(`/locations/${mat.locationId}`)
                                }}
                                className="hover:underline text-primary font-semibold text-left"
                              >
                                {mat.location?.name}
                              </button>
                            </td>
                            <td className="py-3 text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditingMaterial(mat)
                                }}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                              >
                                Ver / Editar Ficha
                              </button>
                            </td>
                          </tr>
                        ))
                      })()}
                    </tbody>
                  </table>
                </div>

                {/* Mobile view stacked cards list */}
                <div className="md:hidden space-y-3.5">
                  {/* 1. Direct Materials (Instalados aquí) */}
                  {!isRootLocation && loc.materials.map(mat => (
                    <div
                      key={`mat-mob-${mat.id}`}
                      onClick={() => setEditingMaterial(mat)}
                      className="p-4 bg-app-bg/15 rounded-xl border border-app-border space-y-2 cursor-pointer hover:bg-app-bg/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-fg text-sm">📦 {mat.name}</span>
                        <span className="text-[10px] font-medium uppercase px-1.5 py-0.5 rounded bg-app-bg border border-app-border text-muted">
                          {mat.type?.name}
                        </span>
                      </div>
                      {mat.description && (
                        <p className="text-xs text-fg-secondary">{mat.description}</p>
                      )}
                      <MaterialAttributePills material={mat} />
                      <div className="flex items-center justify-between text-[11px] pt-2 border-t border-app-border/40 mt-1">
                        <span className="text-muted">
                          Instalado: {mat.installedAt ? formatDate(mat.installedAt) : '—'}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingMaterial(mat)
                          }}
                          className="text-primary font-bold hover:underline"
                        >
                          Ver / Editar Ficha
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* 2. Subfolders and their respective descendant materials */}
                  {loc.children.map(child => {
                    const branchMaterials = loc.descendantMaterials?.filter(
                      mat => mat.location?.path.startsWith(child.path)
                    ) || []
                    const isExpanded = expandedChildIds.has(child.id)

                    return (
                      <Fragment key={`child-mob-group-${child.id}`}>
                        <div className="bg-primary/5 rounded-xl border border-primary/20 overflow-hidden shadow-sm">
                          {/* Subfolder (child location) header - fully interactable */}
                          <div
                            onClick={() => toggleExpanded(child.id)}
                            className="p-4 flex items-center justify-between gap-2 cursor-pointer hover:bg-primary/10 transition-colors bg-primary/10 border-b border-primary/20"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {child.image ? (
                                <button
                                  type="button"
                                  onClick={e => { e.stopPropagation(); setPreviewImage({ src: child.image!, alt: child.name }) }}
                                  className="w-9 h-9 rounded-lg overflow-hidden shrink-0 border border-app-border/40 hover:ring-2 hover:ring-primary/50 transition-all"
                                  title="Ver foto"
                                >
                                  <img src={child.image} alt={child.name} className="w-full h-full object-cover" />
                                </button>
                              ) : (
                                <Folder className="w-4.5 h-4.5 text-primary shrink-0" />
                              )}
                              <span className="font-bold text-fg text-sm truncate">{child.name}</span>
                            </div>
                            {isExpanded ? <ChevronDown className="w-4.5 h-4.5 text-primary shrink-0" /> : <ChevronRight className="w-4.5 h-4.5 text-primary shrink-0" />}
                          </div>

                          {/* Expanded content */}
                          {isExpanded && (
                            <>
                              {/* Description and counts */}
                              {(child.description || child._count) && (
                                <div className="p-4 pt-3 pb-3 space-y-1.5 bg-card/20 border-b border-app-border/40">
                                  {child.description && (
                                    <p className="text-xs text-fg-secondary leading-relaxed">{child.description}</p>
                                  )}
                                  <p className="text-[11px] text-muted font-medium">
                                    {child._count?.children || 0} sub-ubicaciones · {child._count?.materials || 0} materiales
                                  </p>
                                  {/* Abrir link for navigation */}
                                  <button
                                    onClick={() => navigate(`/locations/${child.id}`)}
                                    className="text-primary font-bold text-xs flex items-center gap-0.5 mt-2 hover:underline animate-fade-in"
                                  >
                                    Abrir ubicación <ChevronRight className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}

                              {/* Descendant materials list section inside the folder card */}
                              {branchMaterials.length > 0 && (
                                <div className="p-3 bg-card/40 space-y-2.5">
                                  <h4 className="text-[9px] font-bold text-fg-secondary uppercase tracking-wider px-1 mb-1">
                                    Equipos en {child.name}
                                  </h4>
                                  {branchMaterials.map(mat => (
                                    <div
                                      key={`desc-mat-mob-${mat.id}`}
                                      onClick={() => setEditingMaterial(mat)}
                                      className="p-3.5 bg-app-bg/20 rounded-lg border border-app-border space-y-2 cursor-pointer hover:bg-app-bg/40 transition-colors"
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <span className="font-bold text-fg-secondary text-xs">📦 {mat.name}</span>
                                        <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded bg-app-bg border border-app-border text-muted shrink-0">
                                          {mat.type?.name}
                                        </span>
                                      </div>
                                      {mat.description && (
                                        <p className="text-[11px] text-muted line-clamp-2">{mat.description}</p>
                                      )}
                                      <MaterialAttributePills material={mat} />
                                      <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-app-border/40 mt-1">
                                        <span className="text-muted truncate max-w-[170px]">
                                          En:{' '}
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              navigate(`/locations/${mat.locationId}`)
                                            }}
                                            className="text-primary hover:underline font-semibold"
                                          >
                                            {mat.location?.name}
                                          </button>
                                        </span>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setEditingMaterial(mat)
                                          }}
                                          className="text-primary font-bold hover:underline"
                                        >
                                          Ver / Editar
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </Fragment>
                    )
                  })}

                  {/* 3. Fallback: Unmatched Descendant Materials */}
                  {(() => {
                    const matchedIds = new Set(loc.children.flatMap(child => {
                      const branchMaterials = loc.descendantMaterials?.filter(
                        mat => mat.location?.path.startsWith(child.path)
                      ) || []
                      return branchMaterials.map(m => m.id)
                    }))
                    const unmatchedMaterials = loc.descendantMaterials?.filter(mat => !matchedIds.has(mat.id)) || []
                    if (unmatchedMaterials.length === 0) return null

                    return unmatchedMaterials.map(mat => (
                      <div
                        key={`unmatched-desc-mat-mob-${mat.id}`}
                        onClick={() => setEditingMaterial(mat)}
                        className="ml-5 p-3.5 bg-app-bg/5 rounded-xl border border-app-border border-l-4 border-l-app-border space-y-2 cursor-pointer hover:bg-app-bg/20 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold text-fg-secondary text-[13px]">📦 {mat.name}</span>
                          <span className="text-[9px] font-medium uppercase px-1 py-0.5 rounded bg-app-bg border border-app-border text-muted">
                            {mat.type?.name}
                          </span>
                        </div>
                        {mat.description && (
                          <p className="text-[11px] text-muted">{mat.description}</p>
                        )}
                        <MaterialAttributePills material={mat} />
                        <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-app-border/40 mt-1">
                          <span className="text-muted truncate max-w-[170px]">
                            En:{' '}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                navigate(`/locations/${mat.locationId}`)
                              }}
                              className="text-primary hover:underline font-semibold"
                            >
                              {mat.location?.name}
                            </button>
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingMaterial(mat)
                            }}
                            className="text-primary font-bold hover:underline"
                          >
                            Ver / Editar
                          </button>
                        </div>
                      </div>
                    ))
                  })()}
                </div>
              </>
            )}
          </section>
        )

        const jobsSection = (
          <section className="bg-card rounded-xl border border-app-border p-5 shadow-sm h-fit">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-fg flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" /> Historial de Trabajos
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/actions?view=calendar&locationId=${locationId}`)}
                  title="Ver calendario de trabajos"
                  className="flex items-center justify-center border border-app-border p-1.5 rounded-lg text-fg-secondary bg-card hover:bg-app-bg hover:text-fg shadow-sm transition-all"
                >
                  <Calendar className="w-4 h-4" />
                </button>
                <RoleGuard require="write">
                  <button
                    onClick={() => navigate(`/actions/new?locationId=${rootId}`)}
                    className="flex items-center gap-1 text-[11px] font-semibold bg-primary text-primary-fg px-3 py-1.5 rounded-lg hover:bg-[var(--primary-hover)] transition-all shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" /> Registrar Trabajo
                  </button>
                </RoleGuard>
              </div>
            </div>

            {loc.actions.length === 0 ? (
              <div className="p-8 text-center text-muted text-xs italic bg-app-bg/40 rounded-lg border border-dashed border-app-border">
                Sin trabajos registrados en esta ubicación.
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-3">
                {loc.actions.map(act => {
                  const installsCount = act.materials.filter(m => m.operation === 'INSTALL').length
                  const uninstallsCount = act.materials.filter(m => m.operation === 'UNINSTALL').length
                  const updatesCount = act.materials.filter(m => m.operation === 'UPDATE').length

                  return (
                    <div
                      key={act.id}
                      onClick={() => navigate(`/actions/${act.id}`)}
                      className="p-3 bg-app-bg/30 rounded-lg border border-app-border space-y-2 text-xs hover:border-primary cursor-pointer hover:shadow transition-all group"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="font-semibold text-fg group-hover:text-primary transition-colors line-clamp-1">{act.title}</span>
                        <span className="text-[10px] font-mono text-muted text-right">Job #{act.id}</span>
                      </div>
                      {act.description && <p className="text-fg-secondary text-[11px] line-clamp-2">{act.description}</p>}
                      
                      {act.materials && act.materials.length > 0 && (
                        <div className="flex items-center gap-2 text-[10px] font-medium text-muted flex-wrap">
                          {installsCount > 0 && (
                            <span className="bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded border border-emerald-500/15">
                              +{installsCount} inst.
                            </span>
                          )}
                          {uninstallsCount > 0 && (
                            <span className="bg-rose-500/10 text-rose-500 px-1.5 py-0.5 rounded border border-rose-500/15">
                              -{uninstallsCount} desinst.
                            </span>
                          )}
                          {updatesCount > 0 && (
                            <span className="bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded border border-blue-500/15">
                              ~{updatesCount} mod.
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-muted pt-1 border-t border-app-border/40">
                        <span>{formatDate(act.performedAt)}</span>
                        <span className="font-medium">{act.performer.fullName}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )

        return loc.children.length === 0 ? (
          <div className="space-y-6">
            {materialsSection}
            {jobsSection}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {materialsSection}
            </div>

            <div className="lg:col-span-1">
              {jobsSection}
            </div>
          </div>
        )
      })()}

      {/* Modals */}
      {showEdit && (
        <LocationForm
          existing={loc}
          onClose={() => setShowEdit(false)}
        />
      )}
      {showAddChild && (
        <LocationForm
          parentId={locationId}
          infraTypeId={loc.infraTypeId}
          onClose={() => setShowAddChild(false)}
        />
      )}
      {showAddMaterial && (
        <MaterialForm
          locationId={locationId}
          onClose={() => setShowAddMaterial(false)}
        />
      )}
      {editingMaterial && (
        <MaterialEditAttributesModal
          material={editingMaterial}
          onClose={() => setEditingMaterial(null)}
        />
      )}

      {previewImage && (
        <ImagePreviewModal
          src={previewImage.src}
          alt={previewImage.alt}
          onClose={() => setPreviewImage(null)}
        />
      )}

      {showUploadModal && (
        <PhotoUploadModal
          onClose={() => setShowUploadModal(false)}
          onUpload={handleUploadImage}
          isPending={uploadImageMutation.isPending}
        />
      )}

      {showGalleryUploadModal && (
        <LocationPhotoUploadModal
          locationId={locationId}
          onClose={() => setShowGalleryUploadModal(false)}
        />
      )}

      {previewGalleryPhoto && (
        <ImagePreviewModal
          src={previewGalleryPhoto.url}
          alt={loc?.name}
          description={previewGalleryPhoto.description}
          date={previewGalleryPhoto.takenAt}
          actionId={previewGalleryPhoto.actionId}
          action={previewGalleryPhoto.action}
          onDelete={() => {
            handleDeleteGalleryPhoto(previewGalleryPhoto.id)
            setPreviewGalleryPhoto(null)
          }}
          onClose={() => setPreviewGalleryPhoto(null)}
        />
      )}

      {showGalleryModal && (
        <Modal title={`Galería de Fotos - ${rootLocation?.name || 'Cargando...'}`} onClose={() => setShowGalleryModal(false)} size="2xl">
          <div className="space-y-4">
            <div className="flex justify-between items-center sticky -top-4 z-10 bg-card pb-3 pt-5 border-b border-app-border/40 -mx-5 px-5 -mt-4 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.05)]">
              <span className="text-xs text-muted">
                {galleryPhotos.length} {galleryPhotos.length === 1 ? 'foto asociada' : 'fotos asociadas'}
              </span>
              <RoleGuard require="write">
                <button
                  onClick={() => setShowGalleryUploadModal(true)}
                  className="flex items-center gap-1.5 bg-primary text-primary-fg px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[var(--primary-hover)] transition-all shadow-sm active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" /> Añadir Foto
                </button>
              </RoleGuard>
            </div>

            {galleryPhotos.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-center text-muted text-xs italic bg-app-bg/40 rounded-lg border border-dashed border-app-border min-h-[200px]">
                <span>Sin fotos en la galería de esta infraestructura.</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pb-2">
                {galleryPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    onClick={() => setPreviewGalleryPhoto(photo)}
                    className="relative group aspect-square rounded-lg overflow-hidden border border-app-border bg-app-bg/50 cursor-pointer shadow-sm hover:border-primary transition-all"
                  >
                    <img
                      src={photo.url}
                      alt={photo.description || 'Foto'}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 pointer-events-none">
                      <span className="text-[10px] text-white font-mono leading-none">
                        {new Date(photo.takenAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-app-border/40">
              <button
                type="button"
                onClick={() => setShowGalleryModal(false)}
                className="px-4 py-2 text-sm text-fg-secondary border border-app-border rounded-lg hover:bg-app-bg transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
