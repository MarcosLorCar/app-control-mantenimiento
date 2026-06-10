import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Folder, GitBranch, Package, Zap, Plus, Pencil, Trash, ChevronRight } from 'lucide-react'
import { useLocation, useDeleteLocation, useLocations } from '../../hooks/useLocations'
import { RoleGuard } from '../../components/RoleGuard'
import { LocationForm } from '../../components/forms/LocationForm'
import { MaterialInstallForm } from '../../components/forms/MaterialInstallForm'
import { ActionForm } from '../actions/ActionForm'
import type { Location, Material } from '../../api/types'

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
  const [showAddMaterial, setShowAddMaterial] = useState(false)
  const [actionMaterial, setActionMaterial] = useState<Material | null>(null)
  const [showAddActionOnLocation, setShowAddActionOnLocation] = useState(false)

  async function handleDelete() {
    if (!confirm('¿Eliminar esta ubicación? Sus sub-ubicaciones subirán un nivel en la jerarquía. Esta acción no se puede deshacer.')) return
    await deleteLoc.mutateAsync(locationId)
    navigate('/locations')
  }

  if (isLoading) return <p className="text-muted text-sm py-20 text-center">Cargando detalles de ubicación...</p>
  if (error || !loc) return <p className="text-error text-sm py-20 text-center">Ubicación no encontrada.</p>

  // Build breadcrumbs
  const pathIds = loc.path.split('/').filter(Boolean).map(Number)
  const breadcrumbs = pathIds.map(pid => {
    const found = allLocs.find(l => l.id === pid)
    return found || { id: pid, name: pid === locationId ? loc.name : `Cargando...` }
  })

  return (
    <div className="space-y-6">
      {/* Header and Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-start gap-4 justify-between">
        <div>
          {/* Breadcrumb row */}
          <nav className="text-xs text-muted flex items-center gap-1.5 mb-3 flex-wrap">
            <Link to="/locations" className="hover:text-fg font-medium">Ubicaciones</Link>
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
                {loc.code && (
                  <span className="text-[11px] font-mono text-muted bg-app-bg px-2 py-0.5 rounded border border-app-border">
                    {loc.code}
                  </span>
                )}
              </div>
              {loc.type && (
                <p className="text-[11px] font-mono uppercase text-primary tracking-wider mt-0.5">{loc.type}</p>
              )}
            </div>
          </div>
          {loc.description && <p className="text-sm text-fg-secondary mt-2 pl-13">{loc.description}</p>}
        </div>

        {/* Header Action Buttons */}
        <div className="flex gap-2 shrink-0">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column (2/3 width on large): subfolders, materials */}
        <div className="lg:col-span-2 space-y-6">
          {/* Subfolders (children locations) */}
          <section className="bg-card rounded-xl border border-app-border p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-fg flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-primary" /> Sub-ubicaciones (Carpetas)
              </h2>
              <RoleGuard require="write">
                <button
                  onClick={() => setShowAddChild(true)}
                  className="flex items-center gap-1 text-[11px] font-semibold bg-primary text-primary-fg px-2.5 py-1.5 rounded-lg hover:bg-[var(--primary-hover)] transition-all shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Nueva Carpeta
                </button>
              </RoleGuard>
            </div>

            {loc.children.length === 0 ? (
              <div className="p-6 text-center text-muted text-xs italic bg-app-bg/40 rounded-lg border border-dashed border-app-border">
                Sin sub-ubicaciones. Crea carpetas dentro de esta ubicación para organizar tus materiales.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {loc.children.map(child => {
                  const count = child._count ?? { children: 0, materials: 0, actions: 0 }
                  return (
                    <div
                      key={child.id}
                      onClick={() => navigate(`/locations/${child.id}`)}
                      className="flex items-center justify-between p-3.5 rounded-lg border border-app-border bg-app-bg/30 hover:border-primary/40 hover:bg-app-bg/50 cursor-pointer transition-all group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Folder className="w-4.5 h-4.5 text-muted group-hover:text-primary transition-colors shrink-0" />
                        <div className="min-w-0">
                          <p className="font-semibold text-xs text-fg group-hover:text-primary transition-colors truncate">{child.name}</p>
                          <span className="text-[10px] text-muted">
                            {count.children} carpetas · {count.materials} materiales
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-muted/60 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* Materials Section */}
          <section className="bg-card rounded-xl border border-app-border p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-fg flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" /> Inventario de Materiales
              </h2>
              <RoleGuard require="write">
                <button
                  onClick={() => setShowAddMaterial(true)}
                  className="flex items-center gap-1 text-[11px] font-semibold bg-primary text-primary-fg px-2.5 py-1.5 rounded-lg hover:bg-[var(--primary-hover)] transition-all shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Instalar Material
                </button>
              </RoleGuard>
            </div>

            {loc.materials.length === 0 ? (
              <div className="p-8 text-center text-muted text-xs italic bg-app-bg/40 rounded-lg border border-dashed border-app-border">
                Sin materiales registrados directamente en esta ubicación.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-app-border text-muted font-bold">
                      <th className="pb-2.5 font-semibold">Código</th>
                      <th className="pb-2.5 font-semibold">Nombre</th>
                      <th className="pb-2.5 font-semibold">Tipo</th>
                      <th className="pb-2.5 font-semibold">Instalación</th>
                      <th className="pb-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-app-border/40">
                    {loc.materials.map(mat => (
                      <tr key={mat.id} className="hover:bg-app-bg/30 transition-colors">
                        <td className="py-3 font-mono text-muted text-[11px]">{mat.code}</td>
                        <td className="py-3 font-semibold text-fg">{mat.name}</td>
                        <td className="py-3 text-fg-secondary">{mat.type?.name}</td>
                        <td className="py-3 text-muted">{mat.installedAt ? formatDate(mat.installedAt) : '—'}</td>
                        <td className="py-3 text-right">
                          <RoleGuard require="write">
                            <button
                              onClick={() => setActionMaterial(mat)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline hover:text-primary-hover"
                            >
                              <Zap className="w-3 h-3" /> Acción
                            </button>
                          </RoleGuard>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* Right column (1/3 width on large): Actions history */}
        <section className="bg-card rounded-xl border border-app-border p-5 shadow-sm h-fit">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-fg flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" /> Historial de Acciones
            </h2>
            <RoleGuard require="write">
              <button
                onClick={() => setShowAddActionOnLocation(true)}
                className="flex items-center gap-1 text-[11px] font-semibold bg-primary/10 text-primary px-2.5 py-1.5 rounded-lg hover:bg-primary/20 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Registrar Acción
              </button>
            </RoleGuard>
          </div>

          {loc.actions.length === 0 ? (
            <div className="p-8 text-center text-muted text-xs italic bg-app-bg/40 rounded-lg border border-dashed border-app-border">
              Sin acciones registradas en esta ubicación.
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {loc.actions.map(act => (
                <div key={act.id} className="p-3 bg-app-bg/30 rounded-lg border border-app-border space-y-1.5 text-xs hover:border-primary/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-fg line-clamp-1">{act.title}</span>
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-medium shrink-0"
                      style={{
                        backgroundColor: act.type.color ? `${act.type.color}15` : 'var(--primary-bg)',
                        color: act.type.color ?? 'var(--primary)',
                      }}
                    >
                      {act.type.name}
                    </span>
                  </div>
                  {act.description && <p className="text-fg-secondary text-[11px] line-clamp-2">{act.description}</p>}
                  {act.material && (
                    <p className="text-[10px] text-muted flex items-center gap-1">
                      <Package className="w-3 h-3 text-muted shrink-0" />
                      Material: <span className="font-mono text-fg-secondary">{act.material.name}</span>
                    </p>
                  )}
                  <div className="flex items-center justify-between text-[10px] text-muted pt-1 border-t border-app-border/40">
                    <span>{formatDate(act.performedAt)}</span>
                    <span className="font-medium">{act.performer.fullName}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

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
          onClose={() => setShowAddChild(false)}
        />
      )}
      {showAddMaterial && (
        <MaterialInstallForm
          locationId={locationId}
          onClose={() => setShowAddMaterial(false)}
        />
      )}
      {actionMaterial && (
        <ActionForm
          materials={[actionMaterial]}
          onClose={() => setActionMaterial(null)}
        />
      )}
      {showAddActionOnLocation && (
        <ActionForm
          locationId={locationId}
          onClose={() => setShowAddActionOnLocation(false)}
        />
      )}
    </div>
  )
}
