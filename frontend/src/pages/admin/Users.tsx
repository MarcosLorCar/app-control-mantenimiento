import { useState } from 'react'
import { useUsers, useUpdateUser, useResetUserPassword } from '../../hooks/useUsers'
import { useRoles } from '../../hooks/useCatalog'
import { RoleGuard } from '../../components/RoleGuard'
import { UserForm, PasswordModal } from './UserForm'
import { EditUserModal } from './EditUserModal'
import { useAuth } from '../../contexts/AuthContext'
import type { User } from '../../api/types'

export function Users() {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [resetPassword, setResetPassword] = useState<string | null>(null)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  const { user: me } = useAuth()
  const { data: users = [], isLoading } = useUsers()
  const { data: roles = [] } = useRoles()
  const updateUser = useUpdateUser()
  const resetUser = useResetUserPassword()

  const roleName = (roleId: number) => roles.find(r => r.id === roleId)?.name ?? '—'

  const filtered = users.filter(u =>
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold text-fg flex-1">Usuarios</h1>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-app-border bg-card text-fg rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors w-full sm:w-auto"
          />
          <RoleGuard require="manage">
            <button
              onClick={() => setShowForm(true)}
              className="bg-primary text-primary-fg px-3.5 py-1.5 rounded-lg text-sm font-semibold hover:bg-[var(--primary-hover)] transition-colors whitespace-nowrap shadow-sm"
            >
              + Nuevo
            </button>
          </RoleGuard>
        </div>
      </div>

      {isLoading ? (
        <p className="text-gray-400 text-sm">Cargando...</p>
      ) : (
        <>
          {/* Vista tabla — md+ */}
          <div className="hidden md:block bg-card rounded-lg shadow-sm border border-app-border overflow-x-auto">
            <table className="min-w-full divide-y divide-app-border/60">
              <thead className="bg-app-bg">
                <tr>
                  {['Nombre', 'Email', 'Rol', 'Estado', 'Acciones'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-app-border/60">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-muted">
                      Sin usuarios
                    </td>
                  </tr>
                )}
                {filtered.map(u => (
                  <tr key={u.id} className="hover:bg-app-bg/40 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-fg">{u.fullName}</td>
                    <td className="px-4 py-3 text-sm text-fg-secondary">{u.email}</td>
                    <td className="px-4 py-3 text-sm text-fg-secondary">{roleName(u.roleId)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                        u.isActive ? 'bg-success/15 text-success' : 'bg-muted/15 text-muted'
                      }`}>
                        {u.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <RoleGuard require="manage">
                        <div className="flex gap-3">
                          <button
                            onClick={() => setEditingUser(u)}
                            className="text-xs text-fg-secondary hover:text-fg font-medium transition-colors"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => updateUser.mutate({ id: u.id, body: { isActive: !u.isActive } })}
                            className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
                          >
                            {u.isActive ? 'Desactivar' : 'Activar'}
                          </button>
                          <button
                            onClick={() => resetUser.mutate(u.id, { onSuccess: d => setResetPassword(d.tempPassword) })}
                            disabled={resetUser.isPending}
                            className="text-xs text-orange-500 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 disabled:opacity-50 font-medium transition-colors"
                          >
                            Resetear
                          </button>
                        </div>
                      </RoleGuard>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Vista cards — móvil */}
          <div className="md:hidden bg-card rounded-lg shadow-sm border border-app-border divide-y divide-app-border/60">
            {filtered.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-muted">Sin usuarios</p>
            )}
            {filtered.map(u => (
              <div key={u.id} className="px-4 py-3 space-y-1.5">
                <p className="text-sm font-semibold text-fg">{u.fullName}</p>
                <p className="text-xs text-muted">{u.email}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-fg-secondary font-medium">{roleName(u.roleId)}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                    u.isActive ? 'bg-success/15 text-success' : 'bg-muted/15 text-muted'
                  }`}>
                    {u.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <RoleGuard require="manage">
                  <div className="flex gap-3 pt-0.5">
                    <button
                      onClick={() => setEditingUser(u)}
                      className="text-xs text-fg-secondary hover:text-fg font-medium transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => updateUser.mutate({ id: u.id, body: { isActive: !u.isActive } })}
                      className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
                    >
                      {u.isActive ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                      onClick={() => resetUser.mutate(u.id, { onSuccess: d => setResetPassword(d.tempPassword) })}
                      disabled={resetUser.isPending}
                      className="text-xs text-orange-500 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 disabled:opacity-50 font-medium transition-colors"
                    >
                      Resetear
                    </button>
                  </div>
                </RoleGuard>
              </div>
            ))}
          </div>
        </>
      )}

      {showForm && <UserForm onClose={() => setShowForm(false)} />}
      {resetPassword && <PasswordModal tempPassword={resetPassword} onClose={() => setResetPassword(null)} />}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          isSelf={editingUser.id === me?.sub}
          onClose={() => setEditingUser(null)}
        />
      )}
    </div>
  )
}
