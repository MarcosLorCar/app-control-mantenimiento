import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { GitBranch, Layers, Package, Plus, Zap, ChevronRight } from 'lucide-react'
import { useDependency, useDeleteDependency } from '../../hooks/useDependencies'
import { useMaterialsByDependency } from '../../hooks/useMaterials'
import { useInfrastructure } from '../../hooks/useInfrastructures'
import { RoleGuard } from '../../components/RoleGuard'
import { DependencyForm } from '../../components/forms/DependencyForm'
import { StructureForm } from '../../components/forms/StructureForm'
import { MaterialInstallForm } from '../../components/forms/MaterialInstallForm'
import { ActionForm } from '../actions/ActionForm'
import type { Dependency, Structure, Material } from '../../api/types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export function DependencyDetail() {
  const { id } = useParams<{ id: string }>()
  const depId = Number(id)
  const navigate = useNavigate()

  const { data: dep, isLoading } = useDependency(depId)
  const { data: materials = [] } = useMaterialsByDependency(depId)
  const { data: infra } = useInfrastructure(dep?.infrastructureId ?? 0)
  const deleteDep = useDeleteDependency()

  const [showAddChild, setShowAddChild] = useState(false)
  const [showAddStructure, setShowAddStructure] = useState(false)
  const [showAddMaterial, setShowAddMaterial] = useState(false)
  const [editingDep, setEditingDep] = useState<Dependency | null>(null)
  const [editingStructure, setEditingStructure] = useState<Structure | null>(null)
  const [actionMaterial, setActionMaterial] = useState<Material | null>(null)

  if (isLoading) return <p className="text-muted text-sm">Cargando...</p>
  if (!dep) return <p className="text-error text-sm">Dependencia no encontrada</p>

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div>
        <nav className="text-sm text-muted flex items-center gap-1 mb-2 flex-wrap">
          <Link to="/infrastructures" className="hover:text-fg">Infraestructuras</Link>
          {infra && (
            <>
              <span>/</span>
              <Link to={`/infrastructures/${infra.id}`} className="hover:text-fg">{infra.name}</Link>
            </>
          )}
          <span>/</span>
          <span className="text-fg">{dep.name}</span>
        </nav>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-fg">{dep.name}</h1>
          <span className="text-sm font-mono text-muted bg-app-bg border border-app-border px-2 py-0.5 rounded">
            {dep.code}
          </span>
        </div>
        {dep.description && <p className="text-sm text-fg-secondary mt-1">{dep.description}</p>}
      </div>

      {/* Child dependencies */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-fg flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-muted" /> Sub-dependencias
          </h2>
          <RoleGuard require="write">
            <button
              onClick={() => setShowAddChild(true)}
              className="flex items-center gap-1 text-xs bg-primary text-primary-fg px-2.5 py-1.5 rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Nueva
            </button>
          </RoleGuard>
        </div>
        {(dep.children?.length ?? 0) === 0 ? (
          <div className="bg-card rounded-xl border border-app-border p-6 text-center text-muted text-sm">Sin sub-dependencias.</div>
        ) : (
          <div className="bg-card rounded-xl border border-app-border divide-y divide-app-border">
            {dep.children.map(child => (
              <div key={child.id} className="flex items-center px-4 py-3 hover:bg-app-bg/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-fg text-sm">{child.name}</span>
                  <span className="ml-2 font-mono text-xs text-muted">{child.code}</span>
                </div>
                <div className="flex items-center gap-2">
                  <RoleGuard require="write">
                    <button
                      onClick={() => setEditingDep(child)}
                      className="text-xs text-muted hover:text-fg px-2 py-1 rounded hover:bg-app-bg transition-colors"
                    >
                      Editar
                    </button>
                  </RoleGuard>
                  <RoleGuard require="manage">
                    <button
                      onClick={() => { if (confirm(`¿Eliminar "${child.name}"?`)) deleteDep.mutate(child.id) }}
                      className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                    >
                      Eliminar
                    </button>
                  </RoleGuard>
                  <button
                    onClick={() => navigate(`/dependencies/${child.id}`)}
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    Ver <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Structures */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-fg flex items-center gap-2">
            <Layers className="w-4 h-4 text-muted" /> Estructuras
          </h2>
          <RoleGuard require="write">
            <button
              onClick={() => setShowAddStructure(true)}
              className="flex items-center gap-1 text-xs bg-primary text-primary-fg px-2.5 py-1.5 rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Nueva
            </button>
          </RoleGuard>
        </div>
        {(dep.structures?.length ?? 0) === 0 ? (
          <div className="bg-card rounded-xl border border-app-border p-6 text-center text-muted text-sm">Sin estructuras.</div>
        ) : (
          <div className="bg-card rounded-xl border border-app-border divide-y divide-app-border">
            {dep.structures.map(s => (
              <div key={s.id} className="flex items-center px-4 py-3 hover:bg-app-bg/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-fg text-sm">{s.name}</span>
                  {s.code && <span className="ml-2 font-mono text-xs text-muted">{s.code}</span>}
                  {s.description && <p className="text-xs text-muted truncate">{s.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <RoleGuard require="write">
                    <button
                      onClick={() => setEditingStructure(s)}
                      className="text-xs text-muted hover:text-fg px-2 py-1 rounded hover:bg-app-bg transition-colors"
                    >
                      Editar
                    </button>
                  </RoleGuard>
                  <button
                    onClick={() => navigate(`/structures/${s.id}`)}
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    Ver <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Materials */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-fg flex items-center gap-2">
            <Package className="w-4 h-4 text-muted" /> Materiales
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">{materials.length} registrado{materials.length !== 1 ? 's' : ''}</span>
            <RoleGuard require="write">
              <button
                onClick={() => setShowAddMaterial(true)}
                className="flex items-center gap-1 text-xs bg-primary text-primary-fg px-2.5 py-1.5 rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Instalar
              </button>
            </RoleGuard>
          </div>
        </div>
        {materials.length === 0 ? (
          <div className="bg-card rounded-xl border border-app-border p-6 text-center text-muted text-sm">Sin materiales registrados en esta dependencia.</div>
        ) : (
          <div className="bg-card rounded-xl border border-app-border overflow-hidden">
            <div className="flex items-center h-9 bg-app-bg text-[11px] font-semibold text-muted uppercase tracking-wider border-b border-app-border">
              <div className="w-28 px-4">Código</div>
              <div className="flex-1 px-3">Nombre</div>
              <div className="w-36 px-3">Tipo</div>
              <div className="w-24 px-3">Instalado</div>
              <div className="w-28 px-3" />
            </div>
            <div>
              {materials.map(mat => (
                <div key={mat.id} className="flex items-center h-[48px] text-[13px] border-b border-app-border last:border-b-0 hover:bg-app-bg/50 transition-colors">
                  <div className="w-28 px-4 font-mono text-xs text-muted">{mat.code}</div>
                  <div className="flex-1 px-3 flex items-center gap-2 min-w-0">
                    <Package className="w-3.5 h-3.5 text-muted shrink-0" />
                    <span className="font-medium text-fg truncate">{mat.name}</span>
                  </div>
                  <div className="w-36 px-3 text-fg-secondary truncate">{mat.type.name}</div>
                  <div className="w-24 px-3 text-muted">{mat.installedAt ? formatDate(mat.installedAt) : '—'}</div>
                  <div className="w-28 px-3">
                    <RoleGuard require="write">
                      <button
                        onClick={() => setActionMaterial(mat)}
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <Zap className="w-3 h-3" /> Acción
                      </button>
                    </RoleGuard>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Modals */}
      {showAddChild && <DependencyForm parentDepId={depId} onClose={() => setShowAddChild(false)} />}
      {showAddStructure && <StructureForm depId={depId} onClose={() => setShowAddStructure(false)} />}
      {showAddMaterial && <MaterialInstallForm context={{ type: 'dependency', id: depId }} onClose={() => setShowAddMaterial(false)} />}
      {editingDep && <DependencyForm existing={editingDep} onClose={() => setEditingDep(null)} />}
      {editingStructure && <StructureForm existing={editingStructure} onClose={() => setEditingStructure(null)} />}
      {actionMaterial && <ActionForm materials={[actionMaterial]} onClose={() => setActionMaterial(null)} />}
    </div>
  )
}
