import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Package, X } from 'lucide-react'
import { useMaterials } from '../../hooks/useMaterials'
import { MaterialAttributePills } from '../../components/MaterialAttributePills'
import { MaterialEditAttributesModal } from '../../components/forms/MaterialEditAttributesModal'
import type { Material } from '../../api/types'
import { formatDate } from '../../utils/date'

export function MaterialsPage() {
  const navigate = useNavigate()
  const { data: materials = [], isLoading } = useMaterials()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)

  const allTypes = Array.from(
    new Map(materials.map(m => [m.type.id, m.type.name])).entries()
  ).sort((a, b) => a[1].localeCompare(b[1]))

  const filtered = materials.filter(m => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.type.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.location?.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (String(m.attributes?.serial_number ?? '')).toLowerCase().includes(search.toLowerCase())
    const matchesType = !typeFilter || String(m.type.id) === typeFilter
    return matchesSearch && matchesType
  })

  return (
    <div className="flex flex-col min-h-full -m-5 md:-m-8">
      {/* Barra de filtros */}
      <div
        className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 sm:px-7 py-3 bg-card shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2 bg-app-bg border border-app-border rounded-lg px-3 h-9 w-full sm:w-72">
          <Search className="w-4 h-4 text-muted shrink-0" />
          <input
            type="text"
            placeholder="Buscar por nombre, tipo o ubicación..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-[13px] text-fg placeholder-muted outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="text-muted hover:text-fg shrink-0"
              title="Limpiar búsqueda"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {allTypes.length > 0 && (
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="h-9 border border-app-border rounded-lg px-3 text-[13px] text-fg bg-app-bg focus:outline-none focus:ring-2 focus:ring-primary/40 w-full sm:w-auto"
          >
            <option value="">Todos los tipos</option>
            {allTypes.map(([id, name]) => (
              <option key={id} value={String(id)}>{name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Contenido */}
      <div className="p-5 md:p-7 flex flex-col gap-3">
        <p className="text-[13px] text-muted">
          {filtered.length} material{filtered.length !== 1 ? 'es' : ''}
        </p>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-muted text-sm">Cargando...</div>
        ) : (
          <div className="bg-card rounded-xl border border-app-border overflow-hidden">
            <div
              className="hidden md:flex items-center h-10 bg-app-bg text-[11px] font-semibold text-muted uppercase tracking-wider shrink-0"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <div className="flex-1 px-4">Nombre</div>
              <div className="w-48 px-3">Ubicación</div>
              <div className="w-32 px-3">Instalado</div>
              <div className="w-40 px-3">Tipo</div>
            </div>

            {filtered.length === 0 ? (
              <div className="flex items-center justify-center h-24 text-muted text-sm">
                {search || typeFilter ? 'Sin resultados.' : 'No hay materiales registrados.'}
              </div>
            ) : (
              filtered.map(m => (
                <div
                  key={m.id}
                  onClick={() => setSelectedMaterial(m)}
                  className="flex flex-col md:flex-row md:items-center min-h-[50px] py-3 md:py-2 text-[13px] hover:bg-app-bg transition-colors px-4 md:px-0 cursor-pointer"
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <div className="flex-1 flex items-start gap-2 min-w-0 md:px-4">
                    <Package className="w-4 h-4 text-muted shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <span className="font-semibold text-fg block truncate text-[14px] md:text-[13px]">{m.name}</span>
                      <MaterialAttributePills material={m} />
                      
                      {/* Mobile metadata detail block */}
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-[11px] text-muted md:hidden">
                        <span>
                          Ubicación:{' '}
                          {m.location ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                navigate(`/locations/${m.locationId}`)
                              }}
                              className="text-primary hover:underline font-semibold text-left"
                            >
                              {m.location.name}
                            </button>
                          ) : (
                            <span className="text-fg-secondary font-medium">—</span>
                          )}
                        </span>
                        {m.installedAt && (
                          <span>Instalado: <span className="text-fg-secondary font-medium">{formatDate(m.installedAt)}</span></span>
                        )}
                        <span>Tipo: <span className="text-fg-secondary font-medium">{m.type.name}</span></span>
                      </div>
                    </div>
                  </div>
                  <div className="hidden md:block w-48 px-3 text-fg-secondary truncate">
                    {m.location ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/locations/${m.locationId}`)
                        }}
                        className="text-primary hover:underline font-semibold text-left truncate max-w-full"
                      >
                        {m.location.name}
                      </button>
                    ) : (
                      '—'
                    )}
                  </div>
                  <div className="hidden md:block w-32 px-3 text-muted">
                    {m.installedAt ? formatDate(m.installedAt) : '—'}
                  </div>
                  <div className="hidden md:block w-40 px-3 text-fg-secondary truncate">{m.type.name}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {selectedMaterial && (
        <MaterialEditAttributesModal
          material={selectedMaterial}
          onClose={() => setSelectedMaterial(null)}
        />
      )}
    </div>
  )
}
