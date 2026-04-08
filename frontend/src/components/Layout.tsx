import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 text-gray-300 flex flex-col">
        <div className="px-4 py-5 text-white font-bold text-lg border-b border-gray-700">
          Control Actions
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          <NavLink to="/" end className={({ isActive }) =>
            `flex items-center px-3 py-2 rounded-md text-sm ${isActive ? 'bg-gray-700 text-white' : 'hover:bg-gray-800'}`
          }>Dashboard</NavLink>
          <NavLink to="/infrastructures" className={({ isActive }) =>
            `flex items-center px-3 py-2 rounded-md text-sm ${isActive ? 'bg-gray-700 text-white' : 'hover:bg-gray-800'}`
          }>Infraestructuras</NavLink>
          {user?.can_manage && (
            <NavLink to="/admin" className={({ isActive }) =>
              `flex items-center px-3 py-2 rounded-md text-sm ${isActive ? 'bg-gray-700 text-white' : 'hover:bg-gray-800'}`
            }>Administración</NavLink>
          )}
        </nav>
        <div className="px-4 py-3 border-t border-gray-700 text-xs">
          <p className="text-gray-400 truncate">{user?.email}</p>
          <p className="text-gray-500 capitalize">{user?.role}</p>
          <button onClick={handleLogout} className="mt-2 text-red-400 hover:text-red-300 text-xs">
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}
