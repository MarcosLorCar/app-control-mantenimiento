import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Pencil, Package } from 'lucide-react'
import { useInfrastructure, useDeleteInfrastructure } from '../../hooks/useInfrastructures'
import { useMaterialsByInfra } from '../../hooks/useMaterials'
import { RoleGuard } from '../../components/RoleGuard'
import { InfrastructureForm } from './InfrastructureForm'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export function InfrastructureDetail() {
  const { id } = useParams<{ id: string }>()
  const infraId = Number(id)
  const navigate = useNavigate()

  const { data: infra, isLoading } = useInfrastructure(infraId)
  const { data: materials = [] } = useMaterialsByInfra(infraId)
  const deleteInfra = useDeleteInfrastructure()

  const [showEditInfra, setShowEditInfra] = useState(false)

  async function handleDeleteInfra() {
    if (!confirm('¿Eliminar esta infraestructura? Esta acción no se puede deshacer.')) return
    await deleteInfra.mutateAsync(infraId)
    navigate('/infrastructures')
  }

  if (isLoading) return <p className="text-muted text-sm">Cargando...</p>
  if (!infra) return <p className="text-error text-sm">Infraestructura no encontrada</p>

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 justify-between">
        <div>
          <button
            onClick={() => navigate('/infrastructures')}
            className="text-sm text-muted hover:text-fg mb-1"
          >
            ← Volver
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-fg">{infra.name}</h1>
            <span className="text-sm font-mono text-muted bg-app-bg border border-app-border px-2 py-0.5 rounded">
              {infra.code}
            </span>
          </div>
          {infra.description && (
            <p className="text-sm text-fg-secondary mt-1">{infra.description}</p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <RoleGuard require="write">
            <button
              onClick={() => setShowEditInfra(true)}
              className="flex items-center gap-1.5 border border-app-border px-3 py-1.5 rounded-lg text-sm text-fg-secondary hover:bg-app-bg transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              Editar
            </button>
          </RoleGuard>
          <RoleGuard require="manage">
            <button
              onClick={handleDeleteInfra}
              disabled={deleteInfra.isPending}
              className="border border-red-100 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-sm hover:opacity-80 transition-opacity disabled:opacity-50"
            >
              Eliminar
            </button>
          </RoleGuard>
        </div>
      </div>

      {/* Materiales */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-fg">Materiales</h2>
          <span className="text-xs text-muted">{materials.length} registrado{materials.length !== 1 ? 's' : ''}</span>
        </div>

        {materials.length === 0 ? (
          <div className="bg-card rounded-xl border border-app-border p-8 text-center text-muted text-sm">
            Sin materiales registrados en esta infraestructura.
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-app-border overflow-hidden">
            <div className="flex items-center h-9 bg-app-bg text-[11px] font-semibold text-muted uppercase tracking-wider border-b border-app-border">
              <div className="w-32 px-4">Código</div>
              <div className="flex-1 px-3">Nombre</div>
              <div className="w-40 px-3">Tipo</div>
              <div className="w-32 px-3">Nº Serie</div>
              <div className="w-28 px-3">Instalado</div>
            </div>
            <div>
              {materials.map(mat => (
                <div
                  key={mat.id}
                  className="flex items-center h-[48px] text-[13px] border-b border-app-border last:border-b-0 hover:bg-app-bg/50 transition-colors"
                >
                  <div className="w-32 px-4 font-mono text-xs text-muted">{mat.code}</div>
                  <div className="flex-1 px-3 flex items-center gap-2 min-w-0">
                    <Package className="w-3.5 h-3.5 text-muted shrink-0" />
                    <span className="font-medium text-fg truncate">{mat.name}</span>
                  </div>
                  <div className="w-40 px-3 text-fg-secondary truncate">{mat.type.name}</div>
                  <div className="w-32 px-3 text-muted truncate">{mat.serialNumber ?? '—'}</div>
                  <div className="w-28 px-3 text-muted">
                    {mat.installedAt ? formatDate(mat.installedAt) : '—'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {showEditInfra && (
        <InfrastructureForm existing={infra} onClose={() => setShowEditInfra(false)} />
      )}
    </div>
  )
}
