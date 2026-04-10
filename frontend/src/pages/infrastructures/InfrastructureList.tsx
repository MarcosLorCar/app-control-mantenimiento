// frontend/src/pages/infrastructures/InfrastructureList.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInfrastructures } from '../../hooks/useInfrastructures'
import { RoleGuard } from '../../components/RoleGuard'
import { InfrastructureForm } from './InfrastructureForm'

export function InfrastructureList() {
  const { data: infrastructures = [], isLoading, error } = useInfrastructures()
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const filtered = infrastructures.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    (i.location ?? '').toLowerCase().includes(search.toLowerCase())
  )

  if (isLoading) return <p className="text-gray-400 text-sm">Cargando...</p>
  if (error) return <p className="text-red-500 text-sm">Error al cargar infraestructuras</p>

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold text-gray-900 flex-1">Infraestructuras</h1>
        <RoleGuard require="write">
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary text-primary-fg px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors self-start sm:self-auto"
          >
            + Nueva
          </button>
        </RoleGuard>
      </div>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Buscar por nombre o ubicación..."
        className="w-full max-w-sm border border-gray-300 rounded-md px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-gray-900"
      />

      {/* Vista tabla — md+ */}
      <div className="hidden md:block bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Nombre
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Ubicación
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={2} className="px-4 py-6 text-center text-gray-400 text-sm">
                  Sin resultados
                </td>
              </tr>
            )}
            {filtered.map(i => (
              <tr
                key={i.id}
                onClick={() => navigate(`/infrastructures/${i.id}`)}
                className="hover:bg-gray-50 cursor-pointer"
              >
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{i.name}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{i.location ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vista cards — móvil */}
      <div className="md:hidden bg-white rounded-lg shadow divide-y divide-gray-100">
        {filtered.length === 0 && (
          <p className="px-4 py-6 text-center text-gray-400 text-sm">Sin resultados</p>
        )}
        {filtered.map(i => (
          <button
            key={i.id}
            onClick={() => navigate(`/infrastructures/${i.id}`)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-left"
          >
            <div>
              <p className="text-sm font-medium text-gray-900">{i.name}</p>
              {i.location && <p className="text-xs text-gray-500 mt-0.5">{i.location}</p>}
            </div>
            <span className="text-gray-400 ml-3">›</span>
          </button>
        ))}
      </div>

      {showForm && <InfrastructureForm onClose={() => setShowForm(false)} />}
    </div>
  )
}
