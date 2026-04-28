import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Package, Plus, Zap } from 'lucide-react'
import { useStructure } from '../../hooks/useStructures'
import { useMaterialsByStructure } from '../../hooks/useMaterials'
import { useInfrastructure } from '../../hooks/useInfrastructures'
import { useDependency } from '../../hooks/useDependencies'
import { RoleGuard } from '../../components/RoleGuard'
import { MaterialInstallForm } from '../../components/forms/MaterialInstallForm'
import { ActionForm } from '../actions/ActionForm'
import type { Material } from '../../api/types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export function StructureDetail() {
  const { id } = useParams<{ id: string }>()
  const structureId = Number(id)

  const { data: structure, isLoading } = useStructure(structureId)
  const { data: materials = [] } = useMaterialsByStructure(structureId)
  const { data: dep } = useDependency(structure?.dependencyId ?? 0)
  const infraId = dep?.infrastructureId ?? structure?.infrastructureId ?? 0
  const { data: infra } = useInfrastructure(infraId)

  const [showAddMaterial, setShowAddMaterial] = useState(false)
  const [actionMaterial, setActionMaterial] = useState<Material | null>(null)

  if (isLoading) return <p className="text-muted text-sm">Cargando...</p>
  if (!structure) return <p className="text-error text-sm">Estructura no encontrada</p>

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
          {dep && (
            <>
              <span>/</span>
              <Link to={`/dependencies/${dep.id}`} className="hover:text-fg">{dep.name}</Link>
            </>
          )}
          <span>/</span>
          <span className="text-fg">{structure.name}</span>
        </nav>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-fg">{structure.name}</h1>
          {structure.code && (
            <span className="text-sm font-mono text-muted bg-app-bg border border-app-border px-2 py-0.5 rounded">
              {structure.code}
            </span>
          )}
        </div>
        {structure.description && <p className="text-sm text-fg-secondary mt-1">{structure.description}</p>}
      </div>

      {/* Materials */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-fg flex items-center gap-2">
            <Package className="w-4 h-4 text-muted" /> Materiales instalados
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">{materials.length} registrado{materials.length !== 1 ? 's' : ''}</span>
            <RoleGuard require="write">
              <button
                onClick={() => setShowAddMaterial(true)}
                className="flex items-center gap-1 text-xs bg-primary text-primary-fg px-2.5 py-1.5 rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Instalar material
              </button>
            </RoleGuard>
          </div>
        </div>

        {materials.length === 0 ? (
          <div className="bg-card rounded-xl border border-app-border p-8 text-center text-muted text-sm">
            Sin materiales instalados en esta estructura.
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-app-border overflow-hidden">
            <div className="flex items-center h-9 bg-app-bg text-[11px] font-semibold text-muted uppercase tracking-wider border-b border-app-border">
              <div className="w-32 px-4">Código</div>
              <div className="flex-1 px-3">Nombre</div>
              <div className="w-36 px-3">Tipo</div>
              <div className="w-28 px-3">Nº Serie</div>
              <div className="w-24 px-3">Instalado</div>
              <div className="w-28 px-3" />
            </div>
            <div>
              {materials.map(mat => (
                <div key={mat.id} className="flex items-center h-[48px] text-[13px] border-b border-app-border last:border-b-0 hover:bg-app-bg/50 transition-colors">
                  <div className="w-32 px-4 font-mono text-xs text-muted">{mat.code}</div>
                  <div className="flex-1 px-3 flex items-center gap-2 min-w-0">
                    <Package className="w-3.5 h-3.5 text-muted shrink-0" />
                    <span className="font-medium text-fg truncate">{mat.name}</span>
                  </div>
                  <div className="w-36 px-3 text-fg-secondary truncate">{mat.type.name}</div>
                  <div className="w-28 px-3 text-muted truncate">{mat.serialNumber ?? '—'}</div>
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

      {showAddMaterial && (
        <MaterialInstallForm
          context={{ type: 'structure', id: structureId }}
          onClose={() => setShowAddMaterial(false)}
        />
      )}
      {actionMaterial && (
        <ActionForm
          materials={[actionMaterial]}
          onClose={() => setActionMaterial(null)}
        />
      )}
    </div>
  )
}
