// frontend/src/pages/infrastructures/InfrastructureDetail.tsx
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useInfrastructure } from '../../hooks/useInfrastructures'
import { useActions, useDeleteAction } from '../../hooks/useActions'
import { Badge } from '../../components/ui/Badge'
import { RoleGuard } from '../../components/RoleGuard'
import { InfrastructureForm } from './InfrastructureForm'
import { ActionForm } from '../actions/ActionForm'

export function InfrastructureDetail() {
  const { id } = useParams<{ id: string }>()
  const infraId = Number(id)
  const navigate = useNavigate()
  const { data: infra, isLoading } = useInfrastructure(infraId)
  const { data: actions = [] } = useActions(infraId)
  const deleteAction = useDeleteAction(infraId)
  const [showEditInfra, setShowEditInfra] = useState(false)
  const [showNewAction, setShowNewAction] = useState(false)

  if (isLoading) return <p className="text-gray-400 text-sm">Cargando...</p>
  if (!infra) return <p className="text-red-500 text-sm">Infraestructura no encontrada</p>

  return (
    <div>
      {/* Cabecera */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <button
            onClick={() => navigate('/infrastructures')}
            className="text-sm text-gray-500 hover:text-gray-700 mb-1"
          >
            ← Volver
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{infra.name}</h1>
          {infra.location && <p className="text-sm text-gray-500 mt-0.5">{infra.location}</p>}
          {infra.description && <p className="text-sm text-gray-400 mt-1">{infra.description}</p>}
        </div>
        <RoleGuard require="write">
          <button
            onClick={() => setShowEditInfra(true)}
            className="border border-gray-300 px-3 py-1.5 rounded-md text-sm text-gray-700 hover:bg-gray-50"
          >
            Editar
          </button>
        </RoleGuard>
      </div>

      {/* Acciones */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-800">Acciones registradas</h2>
        <RoleGuard require="write">
          <button
            onClick={() => setShowNewAction(true)}
            className="bg-gray-900 text-white px-3 py-1.5 rounded-md text-sm hover:bg-gray-700"
          >
            + Registrar acción
          </button>
        </RoleGuard>
      </div>

      <div className="space-y-3">
        {actions.length === 0 && (
          <p className="text-gray-400 text-sm">Sin acciones registradas.</p>
        )}
        {actions.map(action => (
          <div key={action.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-start justify-between">
              <div>
                <Badge label={action.actionType.name} />
                <p className="text-sm text-gray-800 mt-1">{action.description ?? '—'}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(action.performedAt).toLocaleDateString('es-ES')} · {action.performer.fullName}
                </p>
              </div>
              <RoleGuard require="manage">
                <button
                  onClick={() => deleteAction.mutate(action.id)}
                  className="text-xs text-red-400 hover:text-red-600 ml-4"
                >
                  Eliminar
                </button>
              </RoleGuard>
            </div>
            {action.materials.length > 0 && (
              <div className="mt-3 border-t border-gray-100 pt-3">
                <p className="text-xs font-medium text-gray-500 mb-1">Materiales</p>
                <div className="space-y-1">
                  {action.materials.map(m => (
                    <div key={m.id} className="flex justify-between text-xs text-gray-600">
                      <span>{m.name} — {m.quantity} {m.unit}</span>
                      {m.totalCost && <span>{Number(m.totalCost).toFixed(2)} €</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {showEditInfra && (
        <InfrastructureForm existing={infra} onClose={() => setShowEditInfra(false)} />
      )}
      {showNewAction && (
        <ActionForm infrastructureId={infraId} onClose={() => setShowNewAction(false)} />
      )}
    </div>
  )
}
