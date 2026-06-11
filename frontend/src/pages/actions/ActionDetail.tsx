import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Zap, Package, MapPin, Link as LinkIcon, Unlink as UnlinkIcon, Pencil, Trash2, Calendar, User, Folder } from 'lucide-react'
import { useAction, useDeleteAction, useAssociateMaterial, useDisassociateMaterial } from '../../hooks/useActions'
import { useMaterials } from '../../hooks/useMaterials'
import { MaterialInstallForm } from '../../components/forms/MaterialInstallForm'
import { MaterialEditAttributesModal } from '../../components/forms/MaterialEditAttributesModal'
import { MaterialAttributePills } from '../../components/MaterialAttributePills'
import { RoleGuard } from '../../components/RoleGuard'
import { ActionForm } from './ActionForm'
import { getActionTypeIcon } from '../../utils/actionTypeIcons'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function ActionDetail() {
  const { id } = useParams<{ id: string }>()
  const actionId = Number(id)
  const navigate = useNavigate()

  const { data: action, isLoading, error } = useAction(actionId)
  const deleteMut = useDeleteAction()
  const associateMut = useAssociateMaterial()
  const disassociateMut = useDisassociateMaterial()
  const { data: allMaterials = [] } = useMaterials()

  const [showEdit, setShowEdit] = useState(false)
  const [showAddExisting, setShowAddExisting] = useState(false)
  const [selectedMaterialIdToLink, setSelectedMaterialIdToLink] = useState(0)
  const [showInstallModal, setShowInstallModal] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<any | null>(null)

  if (isLoading) return <p className="text-muted text-sm py-20 text-center">Cargando detalles del trabajo...</p>
  if (error || !action) return <p className="text-error text-sm py-20 text-center">Trabajo no encontrado.</p>

  const availableMaterialsToLink = allMaterials.filter(
    m => !action.materials.some(am => am.id === m.id)
  )

  function handleDelete() {
    if (!confirm('¿Eliminar esta acción de trabajo?')) return
    deleteMut.mutate(actionId, {
      onSuccess: () => navigate('/actions'),
    })
  }

  function handleAssociateMaterial() {
    if (selectedMaterialIdToLink === 0) return
    associateMut.mutate(
      { actionId, materialId: selectedMaterialIdToLink },
      {
        onSuccess: () => {
          setShowAddExisting(false)
          setSelectedMaterialIdToLink(0)
        },
      }
    )
  }

  function handleDisassociateMaterial(materialId: number) {
    if (!confirm('¿Desvincular este material del trabajo?')) return
    disassociateMut.mutate({ actionId, materialId })
  }

  const TypeIcon = getActionTypeIcon(action.type.icon)
  const typeColor = action.type.color ?? '#6B7280'

  return (
    <div className="space-y-6">
      {/* Breadcrumbs and Actions */}
      <div className="flex flex-col md:flex-row md:items-start gap-4 justify-between">
        <div>
          <nav className="text-xs text-muted flex items-center gap-1.5 mb-3 flex-wrap">
            <Link to="/actions" className="hover:text-fg font-medium">Acciones</Link>
            <span className="text-muted/60">/</span>
            <span className="text-fg font-semibold truncate max-w-40">Trabajo #{action.id}</span>
          </nav>
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: typeColor + '15' }}
            >
              {TypeIcon ? (
                <TypeIcon className="w-5 h-5" style={{ color: typeColor }} />
              ) : (
                <Zap className="w-5 h-5 text-muted" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-fg leading-tight">{action.title}</h1>
              <p className="text-[11px] font-mono uppercase tracking-wider mt-0.5" style={{ color: typeColor }}>
                {action.type.name}
              </p>
            </div>
          </div>
        </div>

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
              disabled={deleteMut.isPending}
              className="flex items-center gap-1.5 border border-red-200 bg-red-50 text-red-600 px-3.5 py-2 rounded-lg text-xs font-semibold hover:bg-red-100 disabled:opacity-50 transition-all shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" /> Eliminar
            </button>
          </RoleGuard>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3 width): Materiales Utilizados */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-card rounded-xl border border-app-border p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-fg flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" /> Materiales Utilizados
              </h2>
              <RoleGuard require="write">
                <div className="flex gap-2">
                  {!showAddExisting ? (
                    <button
                      onClick={() => setShowAddExisting(true)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-primary border border-primary/20 bg-primary/5 px-2.5 py-1.5 rounded-lg hover:bg-primary/10 transition-colors"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      + Vincular Existente
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 border border-app-border rounded-lg p-1 px-2 bg-app-bg text-xs">
                      <select
                        value={selectedMaterialIdToLink}
                        onChange={e => setSelectedMaterialIdToLink(Number(e.target.value))}
                        className="bg-transparent text-xs text-fg focus:outline-none border-none pr-6 cursor-pointer"
                      >
                        <option value={0}>Seleccionar...</option>
                        {availableMaterialsToLink.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.type.name})
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleAssociateMaterial}
                        disabled={selectedMaterialIdToLink === 0}
                        className="text-primary font-bold hover:underline"
                      >
                        Ok
                      </button>
                      <button
                        onClick={() => {
                          setShowAddExisting(false)
                          setSelectedMaterialIdToLink(0)
                        }}
                        className="text-muted hover:text-fg font-medium"
                      >
                        X
                      </button>
                    </div>
                  )}

                  {action.locationId && (
                    <button
                      onClick={() => setShowInstallModal(true)}
                      className="flex items-center gap-1 text-[11px] font-semibold bg-primary text-primary-fg px-2.5 py-1.5 rounded-lg hover:bg-[var(--primary-hover)] transition-all shadow-sm"
                    >
                      <PlusIcon className="w-3.5 h-3.5" />
                      + Registrar e Instalar
                    </button>
                  )}
                </div>
              </RoleGuard>
            </div>

            {action.materials.length === 0 ? (
              <div className="p-8 text-center text-muted text-xs italic bg-app-bg/40 rounded-lg border border-dashed border-app-border">
                No hay materiales vinculados a este trabajo todavía.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-app-border text-muted font-bold">
                      <th className="pb-2.5 font-semibold">Material</th>
                      <th className="pb-2.5 font-semibold">Tipo</th>
                      <th className="pb-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-app-border/40">
                    {action.materials.map(m => (
                      <tr key={m.id} className="hover:bg-app-bg/30 transition-colors">
                        <td className="py-3 text-fg">
                          <span className="font-semibold block">{m.name}</span>
                          <MaterialAttributePills material={m} />
                        </td>
                        <td className="py-3 text-fg-secondary">{m.type.name}</td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <RoleGuard require="write">
                              <button
                                onClick={() => setEditingMaterial({
                                  ...m,
                                  locationId: action.locationId
                                })}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-fg-secondary hover:underline"
                              >
                                <Pencil className="w-3 h-3" /> specs
                              </button>
                            </RoleGuard>
                            <RoleGuard require="write">
                              <button
                                onClick={() => handleDisassociateMaterial(m.id)}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-error hover:underline"
                                title="Desvincular material"
                              >
                                <UnlinkIcon className="w-3 h-3" /> Desvincular
                              </button>
                            </RoleGuard>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* Right Column (1/3 width): Job metadata details */}
        <div className="space-y-6">
          <section className="bg-card rounded-xl border border-app-border p-5 shadow-sm text-xs space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-fg mb-1">Detalles del Trabajo</h2>
            
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-muted shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] text-muted uppercase font-semibold">Fecha de Ejecución</p>
                  <p className="font-medium text-fg">{formatDate(action.performedAt)}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <User className="w-4 h-4 text-muted shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] text-muted uppercase font-semibold">Responsable</p>
                  <p className="font-medium text-fg">{action.performer?.fullName ?? action.performer?.email ?? '—'}</p>
                </div>
              </div>

              {action.location && (
                <div className="flex items-start gap-2">
                  <Folder className="w-4 h-4 text-muted shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-muted uppercase font-semibold">Ubicación</p>
                    <Link to={`/locations/${action.location.id}`} className="font-semibold text-primary hover:underline block mt-0.5">
                      {action.location.name}
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {action.description && (
              <div className="pt-2 border-t border-app-border">
                <p className="text-[10px] text-muted uppercase font-semibold mb-1">Descripción</p>
                <p className="text-fg leading-relaxed bg-app-bg/30 p-2.5 rounded-lg border border-app-border">{action.description}</p>
              </div>
            )}

            {action.latitude !== null && action.longitude !== null && action.latitude !== undefined && action.longitude !== undefined && (
              <div className="pt-2 border-t border-app-border">
                <p className="text-[10px] text-muted uppercase font-semibold mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-primary" /> GPS Coordinadas
                </p>
                <div className="p-2.5 bg-app-bg/30 border border-app-border rounded-lg flex flex-col gap-1.5">
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-muted">Latitud:</span>
                    <span className="text-fg font-medium">{action.latitude.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-muted">Longitud:</span>
                    <span className="text-fg font-medium">{action.longitude.toFixed(6)}</span>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${action.latitude},${action.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline text-center mt-1 font-semibold flex items-center justify-center gap-1"
                  >
                    Navegar en Google Maps ↗
                  </a>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Modals */}
      {showEdit && (
        <ActionForm
          action={action}
          onClose={() => setShowEdit(false)}
        />
      )}

      {showInstallModal && action.locationId && (
        <MaterialInstallForm
          locationId={action.locationId}
          actionId={actionId}
          onClose={() => setShowInstallModal(false)}
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

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  )
}
