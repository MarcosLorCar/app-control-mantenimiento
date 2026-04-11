import { useState } from 'react'
import { Search } from 'lucide-react'
import { useAllMaterials } from '../../hooks/useActions'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export function MaterialsPage() {
  const { data: materials = [], isLoading } = useAllMaterials()
  const [search, setSearch] = useState('')
  const [infraFilter, setInfraFilter] = useState('')

  const allInfras = Array.from(
    new Map(materials.map(m => [m.action.infrastructure.id, m.action.infrastructure.name])).entries()
  ).sort((a, b) => a[1].localeCompare(b[1]))

  const filtered = materials.filter(m => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.supplier ?? '').toLowerCase().includes(search.toLowerCase())
    const matchesInfra = !infraFilter || String(m.action.infrastructure.id) === infraFilter
    return matchesSearch && matchesInfra
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
            placeholder="Buscar por material o proveedor..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-[13px] text-fg placeholder-muted outline-none"
          />
        </div>
        <select
          value={infraFilter}
          onChange={e => setInfraFilter(e.target.value)}
          className="h-9 border border-app-border rounded-lg px-3 text-[13px] text-fg bg-app-bg focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="">Todas las infraestructuras</option>
          {allInfras.map(([id, name]) => (
            <option key={id} value={String(id)}>{name}</option>
          ))}
        </select>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-auto p-5 md:p-7 flex flex-col gap-3">
        <p className="text-[13px] text-muted">
          {filtered.length} registro{filtered.length !== 1 ? 's' : ''}
        </p>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-muted text-sm">Cargando...</div>
        ) : (
          <div className="bg-card rounded-xl border border-app-border overflow-hidden">
            {/* Cabecera */}
            <div
              className="flex items-center h-10 bg-app-bg text-[11px] font-semibold text-muted uppercase tracking-wider shrink-0"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <div className="flex-1 px-4">Material</div>
              <div className="w-20 px-3">Cant.</div>
              <div className="w-20 px-3">Unidad</div>
              <div className="w-24 px-3">C. Unit.</div>
              <div className="w-24 px-3">Total</div>
              <div className="w-32 px-3">Proveedor</div>
              <div className="w-32 px-3">Tipo acción</div>
              <div className="w-40 px-3">Infraestructura</div>
              <div className="w-24 px-3">Fecha</div>
            </div>

            {/* Filas */}
            {filtered.length === 0 ? (
              <div className="flex items-center justify-center h-24 text-muted text-sm">
                {search || infraFilter ? 'Sin resultados.' : 'No hay materiales registrados.'}
              </div>
            ) : (
              filtered.map(m => (
                <div
                  key={m.id}
                  className="flex items-center h-[50px] text-[13px] hover:bg-app-bg transition-colors"
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <div className="flex-1 px-4 font-medium text-fg truncate">{m.name}</div>
                  <div className="w-20 px-3 text-muted tabular-nums">{String(m.quantity)}</div>
                  <div className="w-20 px-3 text-muted">{m.unit}</div>
                  <div className="w-24 px-3 text-muted tabular-nums">
                    {m.unitCost != null ? `${Number(m.unitCost).toFixed(2)}€` : '—'}
                  </div>
                  <div className="w-24 px-3 text-fg font-medium tabular-nums">
                    {m.totalCost != null ? `${Number(m.totalCost).toFixed(2)}€` : '—'}
                  </div>
                  <div className="w-32 px-3 text-fg-secondary truncate">{m.supplier ?? '—'}</div>
                  <div className="w-32 px-3 text-fg-secondary truncate">{m.action.actionType.name}</div>
                  <div className="w-40 px-3 text-fg-secondary truncate">{m.action.infrastructure.name}</div>
                  <div className="w-24 px-3 text-muted">{formatDate(m.action.performedAt)}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
