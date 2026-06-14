import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Zap, Package, MapPin, Pencil, Trash2, Calendar, User, Folder, Plus, Minus } from 'lucide-react'
import { useAction, useDeleteAction } from '../../hooks/useActions'
import { MaterialEditAttributesModal } from '../../components/forms/MaterialEditAttributesModal'
import { MaterialAttributePills } from '../../components/MaterialAttributePills'
import { RoleGuard } from '../../components/RoleGuard'
import { ActionForm } from './ActionForm'
import type { Material } from '../../api/types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function ActionDetail() {
  const { id } = useParams<{ id: string }>()
  const actionId = Number(id)
  const navigate = useNavigate()

  const { data: action, isLoading, error } = useAction(actionId)
  const deleteMut = useDeleteAction()

  const [showEdit, setShowEdit] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<{ material: any; readOnly: boolean; title?: string } | null>(null)

  if (isLoading) return <p className="text-muted text-sm py-20 text-center">Cargando detalles del trabajo...</p>
  if (error || !action) return <p className="text-error text-sm py-20 text-center">Trabajo no encontrado.</p>

  function handleDelete() {
    if (!confirm('¿Eliminar este registro de trabajo?')) return
    const targetLocationId = action?.locationId
    deleteMut.mutate(actionId, {
      onSuccess: () => {
        if (targetLocationId) {
          navigate(`/locations/${targetLocationId}`)
        } else {
          navigate('/actions')
        }
      },
    })
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs and Actions */}
      <div className="flex flex-col md:flex-row md:items-start gap-4 justify-between">
        <div>
          <nav className="text-xs text-muted flex items-center gap-1.5 mb-3 flex-wrap">
            <Link to="/actions" className="hover:text-fg font-medium">Trabajos</Link>
            <span className="text-muted/60">/</span>
            <span className="text-fg font-semibold truncate max-w-40">Detalle #{action.id}</span>
          </nav>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-fg leading-tight">{action.title}</h1>
              <p className="text-[11px] font-mono text-muted uppercase mt-0.5">
                Registro de Mantenimiento
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
              <Pencil className="w-3.5 h-3.5" /> Editar Info
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
        {/* Left Column (2/3 width): Materials Changes */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-card rounded-xl border border-app-border p-5 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-fg flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" /> Cambios en Materiales
              </h2>
            </div>

            {action.materials.length === 0 ? (
              <div className="p-8 text-center text-muted text-xs italic bg-app-bg/40 rounded-lg border border-dashed border-app-border">
                No hubo cambios en los materiales en este trabajo.
              </div>
            ) : (
              <div className="space-y-3">
                {action.materials.map(am => {
                  const op = am.operation
                  const m = am.material
                  
                  let cardCls = ''
                  let badgeCls = ''
                  let badgeIcon = null
                  let btnColorCls = ''
                  let opText = ''

                  if (op === 'INSTALL') {
                    cardCls = 'bg-emerald-500/[0.06] border-emerald-500/20 hover:border-emerald-500/40 text-fg'
                    badgeCls = 'bg-emerald-500/15 text-emerald-500'
                    badgeIcon = <Plus className="w-4 h-4" />
                    btnColorCls = 'text-emerald-500'
                    opText = 'Instalado'
                  } else if (op === 'UPDATE') {
                    cardCls = 'bg-blue-500/[0.06] border-blue-500/20 hover:border-blue-500/40 text-fg'
                    badgeCls = 'bg-blue-500/15 text-blue-500'
                    badgeIcon = <Pencil className="w-4 h-4" />
                    btnColorCls = 'text-blue-500'
                    opText = 'Modificado'
                  } else {
                    // UNINSTALL
                    cardCls = 'bg-rose-500/[0.04] border-rose-500/10 hover:border-rose-500/30 text-fg-secondary'
                    badgeCls = 'bg-rose-500/15 text-rose-500'
                    badgeIcon = <Minus className="w-4 h-4" />
                    btnColorCls = 'text-rose-400'
                    opText = 'Retirado'
                  }
                  
                  return (
                    <div
                      key={m.id}
                      className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${cardCls}`}
                    >
                      {/* Operation Symbol Badge */}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-sm ${badgeCls}`}>
                        {badgeIcon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                            <h3 className="font-bold text-sm text-fg break-words">
                              {m.name}
                            </h3>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                              op === 'INSTALL' ? 'bg-emerald-500/10 text-emerald-600' :
                              op === 'UPDATE' ? 'bg-blue-500/10 text-blue-600' : 'bg-rose-500/10 text-rose-500'
                            }`}>
                              {opText}
                            </span>
                          </div>
                          <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded bg-card border border-app-border text-muted">
                            {m.type.name}
                          </span>
                        </div>

                        {m.description && (
                          <p className="text-xs text-fg-secondary mt-2 leading-relaxed">
                            {m.description}
                          </p>
                        )}

                        {m.location && m.locationId !== action.locationId && (
                          <p className="text-[11px] text-muted mt-2 flex items-center gap-1">
                            <Folder className="w-3.5 h-3.5" /> Ubicación: <span className="font-semibold text-primary">{m.location.name}</span>
                          </p>
                        )}

                        <MaterialAttributePills material={m} />
                      </div>

                      {/* Clickable details action */}
                      <div className="flex flex-col sm:flex-row gap-2 shrink-0 self-center">
                        {am.snapshot ? (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                const prevMat = {
                                  ...m,
                                  name: (am.snapshot as any).name ?? m.name,
                                  description: (am.snapshot as any).description ?? m.description,
                                  attributes: (am.snapshot as any).attributes ?? {},
                                }
                                setEditingMaterial({
                                  material: prevMat,
                                  readOnly: true,
                                  title: `Detalles Previos (Antes del Trabajo) - ${prevMat.name}`
                                })
                              }}
                              className="text-[10px] bg-muted/20 hover:bg-muted/30 px-2 py-1 rounded text-fg border border-app-border font-semibold transition-colors"
                            >
                              Previos
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingMaterial({
                                  material: m,
                                  readOnly: true,
                                  title: `Detalles Actuales (Resultado) - ${m.name}`
                                })
                              }}
                              className={`text-[10px] px-2 py-1 rounded border border-current font-semibold transition-colors ${btnColorCls}`}
                            >
                              Actuales
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setEditingMaterial({
                              material: m,
                              readOnly: true,
                              title: `Detalles - ${m.name}`
                            })}
                            className={`text-[11px] font-semibold hover:underline ${btnColorCls}`}
                          >
                            Detalles
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
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

      {editingMaterial && (
        <MaterialEditAttributesModal
          material={editingMaterial.material}
          readOnly={editingMaterial.readOnly}
          titleOverride={editingMaterial.title}
          onClose={() => setEditingMaterial(null)}
        />
      )}
    </div>
  )
}
