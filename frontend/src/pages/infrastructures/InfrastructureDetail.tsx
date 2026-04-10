// frontend/src/pages/infrastructures/InfrastructureDetail.tsx
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { X, Pencil, Trash2 } from 'lucide-react'
import { useInfrastructure } from '../../hooks/useInfrastructures'
import { useActions, useDeleteAction } from '../../hooks/useActions'
import { RoleGuard } from '../../components/RoleGuard'
import { InfrastructureForm } from './InfrastructureForm'
import { ActionForm } from '../actions/ActionForm'
import { MaterialForm } from '../actions/MaterialForm'
import type { ActionWithRelations } from '../../api/types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export function InfrastructureDetail() {
  const { id } = useParams<{ id: string }>()
  const infraId = Number(id)
  const navigate = useNavigate()
  const { data: infra, isLoading } = useInfrastructure(infraId)
  const { data: actions = [] } = useActions(infraId)
  const deleteAction = useDeleteAction(infraId)

  const [showEditInfra, setShowEditInfra] = useState(false)
  const [showNewAction, setShowNewAction] = useState(false)
  const [selected, setSelected] = useState<ActionWithRelations | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showMaterialForm, setShowMaterialForm] = useState(false)

  function handleDelete(id: number) {
    if (!confirm('¿Eliminar esta acción?')) return
    deleteAction.mutate(id, {
      onSuccess: () => setSelected(null),
    })
  }

  if (isLoading) return <p className="text-gray-400 text-sm">Cargando...</p>
  if (!infra) return <p className="text-red-500 text-sm">Infraestructura no encontrada</p>

  return (
    <div>
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 justify-between mb-6">
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
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between mb-3">
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

      <div className="flex gap-5 overflow-hidden">
        {/* Tabla de acciones */}
        <div className="flex-1 min-w-0">
          {actions.length === 0 ? (
            <p className="text-gray-400 text-sm">Sin acciones registradas.</p>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Cabecera tabla */}
              <div className="flex items-center h-10 bg-gray-50 text-[11px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-200">
                <div className="w-14 px-4">ID</div>
                <div className="w-40 px-3">Tipo</div>
                <div className="w-36 px-3">Responsable</div>
                <div className="w-24 px-3">Fecha</div>
              </div>
              {/* Filas */}
              <div>
                {actions.map(action => (
                  <div
                    key={action.id}
                    onClick={() => setSelected(action)}
                    className={`flex items-center h-[52px] text-[13px] cursor-pointer transition-colors border-b border-gray-100 last:border-b-0 ${
                      selected?.id === action.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-14 px-4 text-gray-400 font-mono">#{action.id}</div>
                    <div className="w-40 px-3 text-gray-800 font-medium truncate">{action.actionType.name}</div>
                    <div className="w-36 px-3 text-gray-500 truncate">
                      {action.performer?.fullName ?? action.performer?.email ?? '—'}
                    </div>
                    <div className="w-24 px-3 text-gray-400">{formatDate(action.performedAt)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Panel lateral de detalle */}
        {selected && (
          <div className="w-[360px] shrink-0 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between h-14 px-5 border-b border-gray-200 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-bold text-gray-900">#{selected.id}</span>
                <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">
                  {selected.actionType.name}
                </span>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 text-[13px]">
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-semibold tracking-[1px] text-gray-400 uppercase">Descripción</p>
                <p className="text-gray-800 leading-relaxed">{selected.description || '—'}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] font-semibold tracking-[1px] text-gray-400 uppercase">Responsable</p>
                  <p className="text-gray-800 truncate">{selected.performer?.fullName ?? selected.performer?.email ?? '—'}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] font-semibold tracking-[1px] text-gray-400 uppercase">Fecha</p>
                  <p className="text-gray-800">{formatDate(selected.performedAt)}</p>
                </div>
              </div>

              <hr className="border-gray-100" />

              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-semibold tracking-[1px] text-gray-400 uppercase">Materiales consumidos</p>
                {selected.materials.length === 0 ? (
                  <p className="text-gray-400">Sin materiales registrados.</p>
                ) : (
                  selected.materials.map(m => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                    >
                      <span className="text-gray-800 truncate">{m.name}</span>
                      <span className="text-gray-400 text-[12px] shrink-0 ml-2">
                        {String(m.quantity)} {m.unit}
                        {m.totalCost != null && ` · ${Number(m.totalCost).toFixed(2)}€`}
                      </span>
                    </div>
                  ))
                )}
                <RoleGuard require="write">
                  {selected.actionType.consumesMaterials && (
                    <button
                      onClick={() => setShowMaterialForm(true)}
                      className="text-[12px] text-blue-600 font-medium mt-1 text-left hover:underline"
                    >
                      + Añadir material
                    </button>
                  )}
                </RoleGuard>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-200 shrink-0">
              <RoleGuard require="write">
                <button
                  onClick={() => setShowEditForm(true)}
                  className="flex items-center gap-1.5 text-[13px] font-medium text-gray-600 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Editar
                </button>
              </RoleGuard>
              <RoleGuard require="manage">
                <button
                  onClick={() => handleDelete(selected.id)}
                  disabled={deleteAction.isPending}
                  className="flex items-center gap-1.5 text-[13px] font-medium text-red-600 border border-red-100 bg-red-50 px-4 py-2 rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Eliminar
                </button>
              </RoleGuard>
            </div>
          </div>
        )}
      </div>

      {showEditInfra && (
        <InfrastructureForm existing={infra} onClose={() => setShowEditInfra(false)} />
      )}
      {showNewAction && (
        <ActionForm infrastructureId={infraId} onClose={() => setShowNewAction(false)} />
      )}
      {showEditForm && selected && (
        <ActionForm
          infrastructureId={infraId}
          action={selected}
          onClose={() => {
            setShowEditForm(false)
            setSelected(null)
          }}
        />
      )}
      {showMaterialForm && selected && (
        <MaterialForm
          actionId={selected.id}
          infrastructureId={infraId}
          onClose={() => setShowMaterialForm(false)}
        />
      )}
    </div>
  )
}
