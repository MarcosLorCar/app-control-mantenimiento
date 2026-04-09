import { useState } from 'react'
import { useActionTypes, useRoles, useCreateActionType } from '../../hooks/useCatalog'
import { useAuth } from '../../hooks/useAuth'

export function Catalog() {
  const [typeName, setTypeName] = useState('')
  const [consumesMaterials, setConsumesMaterials] = useState(false)
  const [typeError, setTypeError] = useState('')

  const { user } = useAuth()
  const { data: actionTypes = [] } = useActionTypes()
  const { data: roles = [] } = useRoles()
  const addType = useCreateActionType()

  function handleAddType(e: React.FormEvent) {
    e.preventDefault()
    if (!typeName.trim()) return
    setTypeError('')
    addType.mutate(
      { name: typeName.trim(), consumesMaterials },
      {
        onSuccess: () => {
          setTypeName('')
          setConsumesMaterials(false)
        },
        onError: (err: any) => setTypeError(err?.error?.message ?? 'Error al añadir tipo'),
      }
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Catálogos</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tipos de acción */}
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Tipos de acción</h2>
          <ul className="divide-y divide-gray-100 mb-4">
            {actionTypes.length === 0 && (
              <li className="py-2 text-sm text-gray-400">Sin tipos definidos</li>
            )}
            {actionTypes.map(at => (
              <li key={at.id} className="py-2 flex items-center justify-between">
                <span className="text-sm text-gray-800">{at.name}</span>
                {at.consumesMaterials && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                    materiales
                  </span>
                )}
              </li>
            ))}
          </ul>

          {user?.can_manage && (
            <form onSubmit={handleAddType} className="border-t border-gray-100 pt-4 space-y-2">
              <input
                type="text"
                value={typeName}
                onChange={e => setTypeName(e.target.value)}
                placeholder="Nombre del tipo"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
              <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consumesMaterials}
                    onChange={e => setConsumesMaterials(e.target.checked)}
                    className="rounded"
                  />
                  Consume materiales
                </label>
                <button
                  type="submit"
                  disabled={!typeName.trim() || addType.isPending}
                  className="px-3 py-2 text-sm text-white bg-gray-900 rounded-md hover:bg-gray-700 disabled:opacity-50"
                >
                  {addType.isPending ? 'Añadiendo...' : 'Añadir'}
                </button>
              </div>
              {typeError && <p className="text-red-600 text-xs">{typeError}</p>}
            </form>
          )}
        </div>

        {/* Roles */}
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Roles</h2>
          <ul className="divide-y divide-gray-100">
            {roles.length === 0 && (
              <li className="py-2 text-sm text-gray-400">Sin roles definidos</li>
            )}
            {roles.map(r => (
              <li key={r.id} className="py-2 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-800">{r.name}</span>
                <div className="flex gap-1">
                  {r.canWrite && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                      escritura
                    </span>
                  )}
                  {r.canManage && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-800 text-white">
                      gestión
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
