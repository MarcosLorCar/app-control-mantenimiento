import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  ClipboardList, MapPin, Package, Map,
  Users, Settings, LogOut, Menu,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const GENERAL_ITEMS = [
  { to: '/', icon: MapPin, label: 'Departamentos' },
  { to: '/map', icon: Map, label: 'Mapa' },
  { to: '/actions', icon: ClipboardList, label: 'Trabajos' },
  { to: '/materials', icon: Package, label: 'Materiales' },
]

const ADMIN_ITEMS = [
  { to: '/admin', icon: Users, label: 'Usuarios', end: true },
  { to: '/admin/catalog', icon: Settings, label: 'Configuración', end: false },
]

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Departamentos', subtitle: '' },
  '/map': { title: 'Mapa de Ubicaciones', subtitle: 'Ubicaciones geolocalizadas' },
  '/categories': { title: 'Navegador de Ubicaciones', subtitle: 'Ubicaciones registradas en la categoría' },
  '/locations': { title: 'Ficha de Ubicación', subtitle: 'Detalle de equipos, materiales y trabajos' },
  '/actions': { title: 'Gestión de Trabajos', subtitle: 'Registro y seguimiento de trabajos' },
  '/actions/new': { title: 'Registrar Trabajo / Mantenimiento', subtitle: 'Registra una intervención en una infraestructura principal' },
  '/materials': { title: 'Inventario de Materiales', subtitle: 'Listado completo de materiales en el sistema' },
  '/admin': { title: 'Usuarios', subtitle: 'Gestión de usuarios del sistema' },
  '/admin/catalog': { title: 'Configuración del Catálogo', subtitle: 'Gestión de categorías y propiedades del sistema' },
}

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => { setSidebarOpen(false) }, [location.pathname])

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const pageInfo = Object.entries(PAGE_TITLES)
    .filter(([path]) => location.pathname === path || location.pathname.startsWith(path + '/'))
    .sort((a, b) => b[0].length - a[0].length)[0]?.[1]
    ?? { title: '', subtitle: '' }

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? '?'

  return (
    <div className="flex h-[100dvh] bg-app-bg text-fg">
      {/* Overlay móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-60 bg-sidebar-bg border-r border-white/[0.08] flex flex-col shrink-0
        transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0
      `}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 h-16 px-6 shrink-0">
          <img src="/icon.svg" alt="Infragest" className="w-8 h-8 rounded-lg shrink-0" />
          <span className="text-white font-bold text-base tracking-[1px]">INFRAGEST</span>
        </div>

        {/* Nav general */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="px-3 pb-2 text-[10px] font-semibold tracking-[2px] text-sidebar-fg uppercase">Menú</p>
          {GENERAL_ITEMS.map(({ to, icon: Icon, label }) => {
            const isDepartamentos = to === '/'
            const active = isDepartamentos
              ? (location.pathname === '/' || location.pathname.startsWith('/categories/') || location.pathname.startsWith('/locations/'))
              : (location.pathname === to || location.pathname.startsWith(to + '/'))

            return (
              <NavLink
                key={to}
                to={to}
                className={
                  `flex items-center gap-3 py-2.5 rounded-md text-sm transition-colors border-l-2 pr-3 pl-[10px] ${
                    active
                      ? 'bg-sidebar-active text-sidebar-active-fg font-medium border-primary'
                      : 'text-sidebar-fg hover:bg-sidebar-active/50 hover:text-white border-transparent'
                  }`
                }
              >
                <Icon className="w-[18px] h-[18px] shrink-0" />
                {label}
              </NavLink>
            )
          })}
        </nav>

        {/* Sección admin — pegada al fondo */}
        {user?.can_manage && (
          <div className="px-3 pb-3 space-y-0.5">
            <p className="px-3 pb-1 pt-2 text-[10px] font-semibold tracking-[2px] text-sidebar-fg uppercase">Admin</p>
            {ADMIN_ITEMS.map(({ to, icon: Icon, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 py-2.5 rounded-md text-sm transition-colors border-l-2 pr-3 pl-[10px] ${
                    isActive
                      ? 'bg-sidebar-active text-sidebar-active-fg font-medium border-primary'
                      : 'text-sidebar-fg hover:bg-sidebar-active/50 hover:text-white border-transparent'
                  }`
                }
              >
                <Icon className="w-[18px] h-[18px] shrink-0" />
                {label}
              </NavLink>
            ))}
          </div>
        )}

        {/* Footer */}
        <div
          className="flex items-center gap-3 px-6 py-4 shrink-0"
          style={{ borderTop: '1px solid #334155' }}
        >
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0">
            <span className="text-white text-[13px] font-semibold">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-[13px] font-medium truncate">{user?.email}</p>
            <p className="text-sidebar-fg text-[11px] truncate">{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            className="text-sidebar-fg hover:text-white transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <div className={`flex-1 flex flex-col min-w-0 ${location.pathname === '/map' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        {/* Topbar */}
        <header className="min-h-[4.5rem] bg-card flex items-center justify-between px-7 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-1.5 rounded text-muted hover:bg-app-bg"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-[20px] font-bold text-fg leading-snug">{pageInfo.title}</h1>
              {pageInfo.subtitle && (
                <p className="text-[13px] text-muted leading-snug mt-0.5">{pageInfo.subtitle}</p>
              )}
            </div>
          </div>
        </header>


        <main className={`flex-1 p-5 md:p-8 ${location.pathname === '/map' ? 'flex flex-col overflow-hidden' : ''}`}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
