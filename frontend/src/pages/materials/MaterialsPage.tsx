import { useState } from 'react'
import { Search, Package } from 'lucide-react'
import { useMaterials } from '../../hooks/useMaterials'
import { MaterialAttributePills } from '../../components/MaterialAttributePills'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export function MaterialsPage() {
  const { data: materials = [], isLoading } = useMaterials()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const allTypes = Array.from(
    new Map(materials.map(m => [m.type.id, m.type.name])).entries()
  ).sort((a, b) => a[1].localeCompare(b[1]))

  const filtered = materials.filter(m => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.type.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.serialNumber ?? '').toLowerCase().includes(search.toLowerCase())
    const matchesType = !typeFilter || String(m.type.id) === typeFilter
    return matchesSearch && matchesType
  })

  return (
    <div className="flex flex-col h-full -m-5 md:-m-8">
      {/* Barra de filtros */}
      <div
        className="flex items-center gap-3 px-7 py-3 bg-card shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2 bg-app-bg border border-app-border rounded-lg px-3 h-9 w-72">
          <Search className="w-4 h-4 text-muted shrink-0" />
          <input
            type="text"
            placeholder="Buscar por nombre o tipo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-[13px] text-fg placeholder-muted outline-none"
          />
        </div>
        {allTypes.length > 0 && (
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="h-9 border border-app-border rounded-lg px-3 text-[13px] text-fg bg-app-bg focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="">Todos los tipos</option>
            {allTypes.map(([id, name]) => (
              <option key={id} value={String(id)}>{name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-auto p-5 md:p-7 flex flex-col gap-3">
        <p className="text-[13px] text-muted">
          {filtered.length} material{filtered.length !== 1 ? 'es' : ''}
        </p>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-muted text-sm">Cargando...</div>
        ) : (
          <div className="bg-card rounded-xl border border-app-border overflow-hidden">
            <div
              className="flex items-center h-10 bg-app-bg text-[11px] font-semibold text-muted uppercase tracking-wider shrink-0"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <div className="flex-1 px-4">Nombre</div>
              <div className="w-40 px-3">Tipo</div>
              <div className="w-36 px-3">Nº Serie</div>
              <div className="w-28 px-3">Instalado</div>
            </div>

            {filtered.length === 0 ? (
              <div className="flex items-center justify-center h-24 text-muted text-sm">
                {search || typeFilter ? 'Sin resultados.' : 'No hay materiales registrados.'}
              </div>
            ) : (
              filtered.map(m => (
                <div
                  key={m.id}
                  className="flex items-center min-h-[50px] py-2 text-[13px] hover:bg-app-bg transition-colors"
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <div className="flex-1 px-4 flex items-start gap-2 min-w-0">
                    <Package className="w-3.5 h-3.5 text-muted shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <span className="font-medium text-fg block truncate">{m.name}</span>
                      <MaterialAttributePills material={m} />
                    </div>
                  </div>
                  <div className="w-40 px-3 text-fg-secondary truncate">{m.type.name}</div>
                  <div className="w-36 px-3 text-muted truncate">{m.serialNumber ?? '—'}</div>
                  <div className="w-28 px-3 text-muted">
                    {m.installedAt ? formatDate(m.installedAt) : '—'}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
