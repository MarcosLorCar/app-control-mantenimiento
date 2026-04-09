import { useState } from 'react'
import { useUsers, useUpdateUser, useDeleteUser } from '../../hooks/useUsers'
import { useRoles } from '../../hooks/useCatalog'
import { RoleGuard } from '../../components/RoleGuard'
import { UserForm } from './UserForm'

export function Users() {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)

  const { data: users = [], isLoading } = useUsers()
  const { data: roles = [] } = useRoles()
  const updateUser = useUpdateUser()
  const deleteUser = useDeleteUser()

  const roleName = (roleId: number) => roles.find(r => r.id === roleId)?.name ?? '—'

  const filtered = users.filter(u =>
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <RoleGuard require="manage">
            <button
              onClick={() => setShowForm(true)}
              className="bg-gray-900 text-white px-3 py-1.5 rounded-md text-sm hover:bg-gray-700"
            >
              + Nuevo
            </button>
          </RoleGuard>
        </div>
      </div>

      {isLoading ? (
        <p className="text-gray-400 text-sm">Cargando...</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Nombre', 'Email', 'Rol', 'Estado', 'Acciones'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-400">
                    Sin usuarios
                  </td>
                </tr>
              )}
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{u.fullName}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{roleName(u.roleId)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      u.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {u.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <RoleGuard require="manage">
                      <div className="flex gap-3">
                        <button
                          onClick={() => updateUser.mutate({ id: u.id, body: { isActive: !u.isActive } })}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          {u.isActive ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          onClick={() => deleteUser.mutate(u.id)}
                          className="text-xs text-red-400 hover:text-red-600"
                        >
                          Eliminar
                        </button>
                      </div>
                    </RoleGuard>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && <UserForm onClose={() => setShowForm(false)} />}
    </div>
  )
}
