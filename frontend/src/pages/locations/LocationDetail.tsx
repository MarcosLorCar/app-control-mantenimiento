import { useState, Fragment } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Folder, GitBranch, Package, Zap, Plus, Pencil, Trash, ChevronRight } from 'lucide-react'
import { useLocation, useDeleteLocation, useLocations } from '../../hooks/useLocations'
import { RoleGuard } from '../../components/RoleGuard'
import { LocationForm } from '../../components/forms/LocationForm'
import { ActionForm } from '../actions/ActionForm'
import type { Location, Material } from '../../api/types'
import { MaterialAttributePills } from '../../components/MaterialAttributePills'
import { MaterialEditAttributesModal } from '../../components/forms/MaterialEditAttributesModal'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export function LocationDetail() {
  const { id } = useParams<{ id: string }>()
  const locationId = Number(id)
  const navigate = useNavigate()

  const { data: loc, isLoading, error } = useLocation(locationId)
  const { data: allLocs = [] } = useLocations(undefined) // Fetch all for breadcrumbs name resolution
  const deleteLoc = useDeleteLocation()

  const [showEdit, setShowEdit] = useState(false)
  const [showAddChild, setShowAddChild] = useState(false)
  const [showAddActionOnLocation, setShowAddActionOnLocation] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)

  async function handleDelete() {
    if (!confirm('¿Eliminar esta ubicación? Sus sub-ubicaciones subirán un nivel en la jerarquía. Esta acción no se puede deshacer.')) return
    await deleteLoc.mutateAsync(locationId)
    // Redirect to category view on delete
    if (loc?.infraTypeId) {
      navigate(`/categories/${loc.infraTypeId}`)
    } else {
      navigate('/')
    }
  }

  if (isLoading) return <p className="text-muted text-sm py-20 text-center">Cargando detalles de ubicación...</p>
  if (error || !loc) return <p className="text-error text-sm py-20 text-center">Ubicación no encontrada.</p>

  // Build breadcrumbs
  const pathIds = loc.path.split('/').filter(Boolean).map(Number)
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

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-fg leading-tight">{loc.name}</h1>
              </div>
              {loc.infraType && (
                <p className="text-[11px] font-mono uppercase text-primary tracking-wider mt-0.5">{loc.infraType.name}</p>
              )}
            </div>
          </div>
          {loc.description && <p className="text-sm text-fg-secondary mt-2 pl-13">{loc.description}</p>}
        </div>

        {/* Header Action Buttons */}
        <div className="flex gap-2 shrink-0 flex-wrap">
          <RoleGuard require="write">
            <button
              onClick={() => setShowAddChild(true)}
              className="flex items-center gap-1.5 bg-primary text-primary-fg px-3.5 py-2 rounded-lg text-xs font-semibold hover:bg-[var(--primary-hover)] shadow-sm transition-all"
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
        const hasItems = loc.children.length > 0 || loc.materials.length > 0 || (loc.descendantMaterials?.length ?? 0) > 0

        const materialsSection = (
          <section className="bg-card rounded-xl border border-app-border p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-fg flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" /> Inventario de Materiales y Sub-ubicaciones
              </h2>
            </div>

            {!hasItems ? (
              <div className="p-8 text-center text-muted text-xs italic bg-app-bg/40 rounded-lg border border-dashed border-app-border">
                Sin materiales o sub-ubicaciones registradas en esta ubicación.
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
                      {loc.materials.map(mat => (
                        <tr key={`mat-${mat.id}`} className="hover:bg-app-bg/30 transition-colors">
                          <td className="py-3 text-fg pl-2">
                            <span className="font-semibold block">📦 {mat.name}</span>
                            <span className="text-[11px] text-fg-secondary block line-clamp-1 mt-0.5">{mat.description || 'Sin descripción'}</span>
                            <MaterialAttributePills material={mat} />
                          </td>
                          <td className="py-3 text-fg-secondary">{mat.type?.name}</td>
                          <td className="py-3 text-muted">{mat.installedAt ? formatDate(mat.installedAt) : '—'}</td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => setEditingMaterial(mat)}
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

                        return (
                          <Fragment key={`child-group-${child.id}`}>
                            {/* Subfolder (child location) */}
                            <tr key={`child-${child.id}`} className="hover:bg-app-bg/30 transition-colors bg-app-bg/5">
                              <td className="py-3 text-fg font-semibold pl-6">
                                <div className="flex items-center gap-2">
                                  <Folder className="w-4 h-4 text-primary shrink-0" />
                                  <button
                                    onClick={() => navigate(`/locations/${child.id}`)}
                                    className="hover:underline text-left text-primary font-bold"
                                  >
                                    {child.name}
                                  </button>
                                </div>
                                {child.description && (
                                  <span className="text-[11px] text-fg-secondary block line-clamp-1 mt-0.5 ml-6">
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
                            {branchMaterials.map(mat => (
                              <tr key={`desc-mat-${mat.id}`} className="hover:bg-app-bg/30 transition-colors opacity-80 bg-app-bg/5">
                                <td className="py-3 text-fg pl-10 border-l-2 border-app-border">
                                  <span className="font-medium block text-fg-secondary">📦 {mat.name}</span>
                                  <span className="text-[11px] text-muted block line-clamp-1 mt-0.5">{mat.description || 'Sin descripción'}</span>
                                  <MaterialAttributePills material={mat} />
                                </td>
                                <td className="py-3 text-muted">{mat.type?.name}</td>
                                <td className="py-3 text-muted">
                                  <span>Instalado en: </span>
                                  <button
                                    onClick={() => navigate(`/locations/${mat.locationId}`)}
                                    className="hover:underline text-primary font-semibold text-left"
                                  >
                                    {mat.location?.name}
                                  </button>
                                </td>
                                <td className="py-3 text-right">
                                  <button
                                    onClick={() => setEditingMaterial(mat)}
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
                          <tr key={`unmatched-desc-mat-${mat.id}`} className="hover:bg-app-bg/30 transition-colors opacity-80 bg-app-bg/5">
                            <td className="py-3 text-fg pl-10 border-l-2 border-app-border">
                              <span className="font-medium block text-fg-secondary">📦 {mat.name}</span>
                              <span className="text-[11px] text-muted block line-clamp-1 mt-0.5">{mat.description || 'Sin descripción'}</span>
                              <MaterialAttributePills material={mat} />
                            </td>
                            <td className="py-3 text-muted">{mat.type?.name}</td>
                            <td className="py-3 text-muted">
                              <span>Instalado en: </span>
                              <button
                                onClick={() => navigate(`/locations/${mat.locationId}`)}
                                className="hover:underline text-primary font-semibold text-left"
                              >
                                {mat.location?.name}
                              </button>
                            </td>
                            <td className="py-3 text-right">
                              <button
                                onClick={() => setEditingMaterial(mat)}
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
                  {loc.materials.map(mat => (
                    <div key={`mat-mob-${mat.id}`} className="p-4 bg-app-bg/15 rounded-xl border border-app-border space-y-2">
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
                          onClick={() => setEditingMaterial(mat)}
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

                    return (
                      <Fragment key={`child-mob-group-${child.id}`}>
                        {/* Subfolder (child location) card */}
                        <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <Folder className="w-4.5 h-4.5 text-primary shrink-0" />
                              <span className="font-bold text-fg text-sm truncate">{child.name}</span>
                            </div>
                            <span className="text-[10px] font-semibold text-primary uppercase bg-primary/10 px-1.5 py-0.5 rounded shrink-0">
                              Sub-ubicación
                            </span>
                          </div>
                          {child.description && (
                            <p className="text-xs text-fg-secondary">{child.description}</p>
                          )}
                          <p className="text-[11px] text-muted">
                            {child._count?.children || 0} sub-ubics · {child._count?.materials || 0} materiales
                          </p>
                          <div className="flex justify-end pt-1">
                            <button
                              onClick={() => navigate(`/locations/${child.id}`)}
                              className="text-xs font-bold text-primary hover:underline"
                            >
                              Abrir Ubicación &rarr;
                            </button>
                          </div>
                        </div>

                        {/* Descendant materials in this child's subtree */}
                        {branchMaterials.map(mat => (
                          <div key={`desc-mat-mob-${mat.id}`} className="ml-5 p-3.5 bg-app-bg/5 rounded-xl border border-app-border/75 border-l-4 border-l-primary/40 space-y-2">
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
                                  onClick={() => navigate(`/locations/${mat.locationId}`)}
                                  className="text-primary hover:underline font-semibold"
                                >
                                  {mat.location?.name}
                                </button>
                              </span>
                              <button
                                onClick={() => setEditingMaterial(mat)}
                                className="text-primary font-bold hover:underline"
                              >
                                Ver / Editar
                              </button>
                            </div>
                          </div>
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
                      <div key={`unmatched-desc-mat-mob-${mat.id}`} className="ml-5 p-3.5 bg-app-bg/5 rounded-xl border border-app-border border-l-4 border-l-app-border space-y-2">
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
                              onClick={() => navigate(`/locations/${mat.locationId}`)}
                              className="text-primary hover:underline font-semibold"
                            >
                              {mat.location?.name}
                            </button>
                          </span>
                          <button
                            onClick={() => setEditingMaterial(mat)}
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
              <RoleGuard require="write">
                <button
                  onClick={() => setShowAddActionOnLocation(true)}
                  className="flex items-center gap-1 text-[11px] font-semibold bg-primary/10 text-primary px-2.5 py-1.5 rounded-lg hover:bg-primary/20 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Registrar Trabajo
                </button>
              </RoleGuard>
            </div>

            {loc.actions.length === 0 ? (
              <div className="p-8 text-center text-muted text-xs italic bg-app-bg/40 rounded-lg border border-dashed border-app-border">
                Sin trabajos registrados en esta ubicación.
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                {loc.actions.map(act => {
                  const installsCount = act.materials.filter(m => m.operation === 'INSTALL').length
                  const uninstallsCount = act.materials.filter(m => m.operation === 'UNINSTALL').length

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
      {showAddActionOnLocation && (
        <ActionForm
          locationId={locationId}
          onClose={() => setShowAddActionOnLocation(false)}
        />
      )}
      {editingMaterial && (
        <MaterialEditAttributesModal
          material={editingMaterial}
          onClose={() => setEditingMaterial(null)}
        />
      )}
    </div>
  )
}
