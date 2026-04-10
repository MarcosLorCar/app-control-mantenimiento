import { useAuth } from '../hooks/useAuth'

const metrics = [
  { label: 'Infraestructuras', value: '—' },
  { label: 'Acciones este mes', value: '—' },
  { label: 'Usuarios activos', value: '—' },
]

export function Dashboard() {
  const { user } = useAuth()
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
      <p className="text-gray-500 text-sm mb-6">Bienvenido, {user?.email}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {metrics.map(m => (
          <div key={m.label} className="bg-white border border-gray-200 p-4 md:p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{m.label}</p>
            <span className="text-3xl font-bold text-gray-900">{m.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
