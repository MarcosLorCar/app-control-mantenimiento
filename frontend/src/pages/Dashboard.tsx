import { useAuth } from '../hooks/useAuth'

export function Dashboard() {
  const { user } = useAuth()
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
      <p className="text-gray-500 text-sm mb-6">Bienvenido, {user?.email}</p>
      <p className="text-gray-400 text-sm">Usa el menú lateral para navegar.</p>
    </div>
  )
}
