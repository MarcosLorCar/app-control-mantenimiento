import { useAuth } from '../hooks/useAuth'
import { LayoutDashboard, Warehouse, ClipboardList, Package } from 'lucide-react'

const metrics = [
  { label: 'Ubicaciones', value: '—', icon: Warehouse, color: 'bg-blue-50 text-blue-600' },
  { label: 'Acciones este mes', value: '—', icon: ClipboardList, color: 'bg-emerald-50 text-emerald-600' },
  { label: 'Materiales usados', value: '—', icon: Package, color: 'bg-violet-50 text-violet-600' },
]

export function Dashboard() {
  const { user } = useAuth()
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted">Bienvenido de nuevo, <span className="font-medium text-fg-secondary">{user?.email}</span></p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card rounded-xl border border-app-border shadow-sm p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted uppercase tracking-wider mb-0.5">{label}</p>
              <span className="text-2xl font-bold text-fg">{value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-xl border border-app-border shadow-sm p-6 flex flex-col items-center justify-center text-center min-h-[180px] gap-2">
        <div className="w-10 h-10 rounded-full bg-info-bg flex items-center justify-center mb-1">
          <LayoutDashboard className="w-5 h-5 text-primary" />
        </div>
        <p className="text-sm font-medium text-fg-secondary">Panel en construcción</p>
        <p className="text-xs text-muted max-w-xs">Las métricas en tiempo real estarán disponibles próximamente.</p>
      </div>
    </div>
  )
}
