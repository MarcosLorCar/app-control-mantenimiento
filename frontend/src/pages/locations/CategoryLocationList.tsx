import { useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Search, Plus, ChevronRight, Package, Zap, ChevronLeft, AlertCircle, Clock, X } from 'lucide-react'
import { useLocations } from '../../hooks/useLocations'
import { useInfrastructureTypes } from '../../hooks/useCatalog'
import { RoleGuard } from '../../components/RoleGuard'
import { LocationForm } from '../../components/forms/LocationForm'
import { getCategoryIcon } from '../../utils/categoryIcons'
import { getCategoryColor, withAlpha } from '../../utils/categoryColors'
import { ImagePreviewModal } from '../../components/ui/ImagePreviewModal'
import { formatRelativeTime } from '../../utils/date'
import { useDensity } from '../../hooks/useDensity'
import { useAlphaIndex } from '../../hooks/useAlphaIndex'
import { DensityToggle } from '../../components/ui/DensityToggle'
import { AlphaIndexScroller } from '../../components/ui/AlphaIndexScroller'
import type { Location } from '../../api/types'

export function CategoryLocationList() {
  const { id } = useParams<{ id: string }>()
  const categoryId = Number(id)
  const navigate = useNavigate()

  const { data: locations = [], isLoading: loadingLocs, error: locsErr } = useLocations(null, categoryId)
  const { data: categories = [], isLoading: loadingCats } = useInfrastructureTypes()

  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [previewImage, setPreviewImage] = useState<{ src: string; alt: string } | null>(null)
  const { density, setDensity } = useDensity()

  const activeCategory = categories.find(c => c.id === categoryId)

  const filtered = locations.filter(loc => {
    return (
      loc.name.toLowerCase().includes(search.toLowerCase()) ||
      (loc.description ?? '').toLowerCase().includes(search.toLowerCase())
    )
  })

  const getName = useCallback((loc: Location) => loc.name, [])
  const { sorted, letters, firstOfLetter, setAnchorRef, scrollToLetter } = useAlphaIndex(filtered, getName)

  function handleCreateSuccess(created: any) {
    if (created && created.infraTypeId && created.infraTypeId !== categoryId) {
      navigate(`/categories/${created.infraTypeId}`)
    }
  }

  if (loadingLocs || loadingCats) return (
    <div className="flex items-center justify-center py-20 text-muted text-sm">
      Cargando ubicaciones...
    </div>
  )

  if (locsErr || !activeCategory) return (
    <div className="flex flex-col items-center justify-center py-20 text-error gap-2 text-sm">
      <AlertCircle className="w-6 h-6" />
      Error al cargar ubicaciones de la categoría.
    </div>
  )

  const CatIcon = getCategoryIcon(activeCategory.icon)
  const color = getCategoryColor(activeCategory.color)

  return (
    <div className="space-y-6 relative min-h-[70vh]">
      {/* Navigation Breadcrumb */}
      <nav className="text-xs text-muted flex items-center gap-1.5 mb-2">
        <Link to="/" className="hover:text-fg font-medium flex items-center gap-1">
          <ChevronLeft className="w-3.5 h-3.5" /> Categorías
        </Link>
        <span className="text-muted/60">/</span>
        <span className="text-fg font-semibold">{activeCategory.name}</span>
      </nav>

      {/* Header Info */}
      <div className="flex items-center gap-4 border-b border-app-border/40 pb-5">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: withAlpha(color, 0.1) }}
        >
          <CatIcon className="w-7 h-7" style={{ color }} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-fg leading-tight">
            {activeCategory.name}
          </h2>
          <p className="text-xs text-muted mt-1">
            {activeCategory.description || 'Consulta la lista de ubicaciones de esta categoría.'}
          </p>
        </div>
      </div>

      {/* Search and Filters row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-card border border-app-border rounded-lg px-3 h-10 flex-1 min-w-40 shadow-sm focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary transition-all">
          <Search className="w-4.5 h-4.5 text-muted shrink-0" />
          <input
            type="text"
            placeholder="Buscar por nombre o descripción..."
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
        <DensityToggle density={density} onChange={setDensity} />
      </div>

      {/* Count Indicator */}
      <p className="text-[13px] text-muted">
        {sorted.length} ubicación{sorted.length !== 1 ? 'es' : ''} principal{sorted.length !== 1 ? 'es' : ''}
      </p>

      {/* Cards list */}
      <div className="relative pr-5">
        {sorted.length === 0 && (
          <div className="bg-card rounded-xl border border-app-border p-10 text-center text-muted text-sm shadow-sm">
            {search ? 'Sin resultados para la búsqueda.' : 'No hay ubicaciones registradas en esta categoría.'}
          </div>
        )}

        <div className={`grid grid-cols-1 ${density === 'compact' ? 'gap-1.5' : 'gap-4'}`}>
          {sorted.map((loc, i) => {
            const count = loc._count ?? { children: 0, materials: 0, actions: 0 }
            const anchorLetter = firstOfLetter[i]
            const anchorRef = anchorLetter ? setAnchorRef(anchorLetter) : undefined

            if (density === 'compact') {
              return (
                <div
                  key={loc.id}
                  ref={anchorRef}
                  onClick={() => navigate(`/locations/${loc.id}`)}
                  role="button"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg border bg-card border-app-border hover:border-primary/40 transition-colors cursor-pointer"
                >
                  {loc.image ? (
                    <img src={loc.image} alt={loc.name} className="w-8 h-8 rounded-md object-cover shrink-0" />
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  )}
                  <span className="font-medium text-fg text-sm truncate flex-1">{loc.name}</span>
                  <ChevronRight className="w-4 h-4 text-muted shrink-0" />
                </div>
              )
            }

            return (
              <div
                key={loc.id}
                ref={anchorRef}
                onClick={() => navigate(`/locations/${loc.id}`)}
                role="button"
                className="flex items-start gap-4 p-5 rounded-xl border bg-card border-app-border hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group"
              >
                <div
                  className="w-16 h-16 rounded-[10px] flex items-center justify-center shrink-0 transition-all group-hover:scale-110 overflow-hidden"
                  style={{ backgroundColor: withAlpha(color, 0.1) }}
                >
                  {loc.image ? (
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setPreviewImage({ src: loc.image!, alt: loc.name }) }}
                      className="w-full h-full"
                      title="Ver foto"
                    >
                      <img src={loc.image} alt={loc.name} className="w-full h-full object-cover" />
                    </button>
                  ) : (
                    <CatIcon className="w-6 h-6" style={{ color }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-fg truncate text-[15px] group-hover:text-primary transition-colors">{loc.name}</p>
                  </div>
                  {loc.description ? (
                    <p className="text-[13px] text-fg-secondary mt-1.5 line-clamp-2">{loc.description}</p>
                  ) : (
                    <p className="text-[13px] text-fg-secondary mt-1.5 line-clamp-2">{loc.formattedAddress ?? ''}</p>
                  )}

                  {/* Previews counts */}
                  <div className="flex flex-wrap items-center gap-2 mt-4 text-[11px] text-fg-secondary">
                    <div className="flex items-center gap-1 bg-app-bg px-1.5 py-0.5 rounded border border-app-border" title="Materiales Instalados">
                      <Package className="w-3 h-3 text-muted" />
                      <span className="font-medium text-fg">{count.materials}</span>
                      <span className="text-muted text-[9px]">materiales</span>
                    </div>
                    <div className="flex items-center gap-1 bg-app-bg px-1.5 py-0.5 rounded border border-app-border" title="Trabajos Realizados">
                      <Zap className="w-3 h-3 text-muted" />
                      <span className="font-medium text-fg">{count.actions}</span>
                      <span className="text-muted text-[9px]">trabajos</span>
                    </div>
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-1.5 self-center text-[12px] text-fg-secondary shrink-0">
                  <Clock className="w-3.5 h-3.5 text-muted" />
                  {loc.lastActionAt ? (
                    <span>Última actividad: <span className="font-medium text-fg">{formatRelativeTime(loc.lastActionAt)}</span></span>
                  ) : (
                    <span className="italic text-muted">Sin actividad</span>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-muted shrink-0 self-center group-hover:translate-x-1 transition-transform" />
              </div>
            )
          })}
        </div>

        <AlphaIndexScroller letters={letters} onSelect={scrollToLetter} />
      </div>

      {/* FAB to add location inside this category */}
      <RoleGuard require="write">
        <button
          onClick={() => setShowForm(true)}
          className="fixed bottom-8 right-8 w-14 h-14 bg-primary hover:bg-[var(--primary-hover)] text-primary-fg rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all z-20"
          title="Nueva Ubicación"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </RoleGuard>

      {showForm && (
        <LocationForm
          infraTypeId={categoryId}
          onClose={() => setShowForm(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {previewImage && (
        <ImagePreviewModal
          src={previewImage.src}
          alt={previewImage.alt}
          onClose={() => setPreviewImage(null)}
        />
      )}
    </div>
  )
}
