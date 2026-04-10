import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Cerrar sidebar al cambiar de ruta (móvil)
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const navCls = ({ isActive }: { isActive: boolean }) =>
    `flex items-center px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-gray-700 text-white' : 'hover:bg-gray-800 hover:text-white'}`

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Overlay móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-56 bg-gray-900 text-gray-300 flex flex-col shrink-0
        transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0
      `}>
        <div className="h-14 flex items-center px-4 border-b border-gray-700">
          <span className="text-white font-bold text-sm tracking-wide">Control Actions</span>
          {/* Botón cerrar (solo móvil) */}
          <button
            className="ml-auto text-gray-400 hover:text-white lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar menú"
          >
            ✕
          </button>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-0.5">
          <NavLink to="/" end className={navCls}>Dashboard</NavLink>
          <NavLink to="/infrastructures" className={navCls}>Infraestructuras</NavLink>
          {user?.can_manage && (
            <>
              <div className="px-3 pt-4 pb-1">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Admin</p>
              </div>
              <NavLink to="/admin" end className={navCls}>Administración</NavLink>
              <NavLink to="/admin/catalog" className={navCls}>Catálogos</NavLink>
            </>
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
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 shrink-0 gap-3">
          {/* Hamburger (solo móvil/tablet) */}
          <button
            className="lg:hidden p-1.5 rounded text-gray-500 hover:bg-gray-100"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-xs text-gray-400 font-mono">● SISTEMA ONLINE</span>
        </header>
        <main className="flex-1 overflow-auto p-3 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
