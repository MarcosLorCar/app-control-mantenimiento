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
      <aside className="w-56 bg-gray-900 text-gray-300 flex flex-col shrink-0">
        <div className="h-14 flex items-center px-4 border-b border-gray-700">
          <span className="text-white font-bold text-sm tracking-wide">Control Actions</span>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-0.5">
          <NavLink to="/" end className={({ isActive }) =>
            `flex items-center px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-gray-700 text-white' : 'hover:bg-gray-800 hover:text-white'}`
          }>Dashboard</NavLink>
          <NavLink to="/infrastructures" className={({ isActive }) =>
            `flex items-center px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-gray-700 text-white' : 'hover:bg-gray-800 hover:text-white'}`
          }>Infraestructuras</NavLink>
          {user?.can_manage && (
            <NavLink to="/admin" className={({ isActive }) =>
              `flex items-center px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-gray-700 text-white' : 'hover:bg-gray-800 hover:text-white'}`
            }>Administración</NavLink>
          )}
        </nav>
        <div className="p-4 border-t border-gray-700">
          <p className="text-xs font-medium text-white truncate mb-0.5">{user?.email}</p>
          <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-3">{user?.role}</p>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center py-1.5 px-3 text-xs font-medium text-gray-400 hover:text-white hover:bg-gray-800 border border-gray-700 hover:border-gray-600 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 shrink-0">
          <span className="text-xs text-gray-400 font-mono">● SISTEMA ONLINE</span>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
