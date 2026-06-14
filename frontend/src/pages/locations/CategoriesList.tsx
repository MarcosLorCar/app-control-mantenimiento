import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Folder, AlertCircle, Map as MapIcon, Grid } from 'lucide-react'
import { useInfrastructureTypes, useCreateInfrastructureType } from '../../hooks/useCatalog'
import { useLocations } from '../../hooks/useLocations'
import { RoleGuard } from '../../components/RoleGuard'
import { Modal } from '../../components/ui/Modal'
import { getCategoryIcon, CATEGORY_ICON_OPTIONS } from '../../utils/categoryIcons'
import { LocationsMapPage } from './LocationsMapPage'

export function CategoriesList() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [activeView, setActiveView] = useState<'map' | 'categories'>(() => {
    if (searchParams.get('lat') && searchParams.get('lng')) {
      return 'map'
    }
    return (localStorage.getItem('preferred_locations_view') as any) ?? 'categories'
  })

  const { data: categories = [], isLoading: loadingCats, error: catErr } = useInfrastructureTypes()
  const { data: allLocations = [] } = useLocations(undefined) // Fetch all locations to calculate counts
  const createCat = useCreateInfrastructureType()

  const [showAddForm, setShowAddForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('Building2')
  const [formErr, setFormErr] = useState('')

  const getCount = (catId: number) => {
    return allLocations.filter(loc => loc.infraTypeId === catId && loc.parentId === null).length
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormErr('')
    if (!name.trim()) return

    createCat.mutate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        icon: icon,
        color: undefined,
      },
      {
        onSuccess: () => {
          setName('')
          setDescription('')
          setIcon('Building2')
          setShowAddForm(false)
        },
        onError: (err: any) => {
          setFormErr(err?.error?.message ?? 'Error al crear la categoría')
        }
      }
    )
  }

  if (loadingCats) return (
    <div className="flex items-center justify-center py-20 text-muted text-sm">
      Cargando categorías...
    </div>
  )

  if (catErr) return (
    <div className="flex flex-col items-center justify-center py-20 text-error gap-2 text-sm">
      <AlertCircle className="w-6 h-6" />
      Error al cargar categorías de infraestructura.
    </div>
  )

  const inputCls = 'w-full border border-app-border rounded-lg px-3 py-2 text-sm bg-card text-fg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors'

  return (
    <div className="space-y-6 relative min-h-[70vh]">
      {/* Selector de Vista */}
      <div className="flex justify-between items-center border-b border-app-border/40 pb-4">
        <p className="text-xs text-muted">
          {activeView === 'categories'
            ? 'Selecciona una categoría de infraestructura para ver sus ubicaciones principales.'
            : 'Ubicaciones registradas visualizadas en el mapa.'}
        </p>
        <div className="flex items-center border border-app-border rounded-lg p-0.5 bg-card shrink-0 shadow-sm">
          <button
            onClick={() => {
              setActiveView('categories')
              localStorage.setItem('preferred_locations_view', 'categories')
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-semibold transition-all ${
              activeView === 'categories'
                ? 'bg-primary text-primary-fg shadow-sm'
                : 'text-muted hover:text-fg'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Lista</span>
          </button>
          <button
            onClick={() => {
              setActiveView('map')
              localStorage.setItem('preferred_locations_view', 'map')
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-semibold transition-all ${
              activeView === 'map'
                ? 'bg-primary text-primary-fg shadow-sm'
                : 'text-muted hover:text-fg'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>Mapa</span>
          </button>
        </div>
      </div>

      {activeView === 'map' ? (
        <LocationsMapPage />
      ) : (
        <>
          {/* Grid List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {categories.length === 0 && (
              <div className="col-span-full bg-card rounded-xl border border-app-border p-12 text-center text-muted text-sm">
                No hay categorías registradas en el catálogo.
              </div>
            )}
            {categories.map(cat => {
              const count = getCount(cat.id)
              const CatIcon = getCategoryIcon(cat.icon)

              return (
                <div
                  key={cat.id}
                  onClick={() => navigate(`/categories/${cat.id}`)}
                  role="button"
                  className="flex flex-col p-6 rounded-xl border bg-card border-app-border hover:border-primary/40 hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden"
                >
                  {/* Top border decoration */}
                  <div 
                    className="absolute top-0 inset-x-0 h-1 bg-primary/25 transition-all group-hover:h-1.5 group-hover:bg-primary"
                  />

                  <div className="flex items-center gap-3.5 mb-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-primary/10 transition-transform group-hover:scale-110 group-hover:rotate-3"
                    >
                      <CatIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-fg text-[16px] group-hover:text-primary transition-colors leading-tight">
                        {cat.name}
                      </h3>
                      <p className="text-[11px] font-semibold text-muted uppercase mt-0.5">
                        {count} ubicación{count !== 1 ? 'es' : ''}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-fg-secondary line-clamp-3 leading-relaxed flex-1">
                    {cat.description || 'Sin descripción adicional.'}
                  </p>
                </div>
              )
            })}
          </div>
        </>
      )}


      {/* FAB Button */}
      <RoleGuard require="write">
        <button
          onClick={() => setShowAddForm(true)}
          className="fixed bottom-8 right-8 w-14 h-14 bg-primary hover:bg-[var(--primary-hover)] text-primary-fg rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all z-20"
          title="Nueva Categoría"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </RoleGuard>

      {/* Modal Form */}
      {showAddForm && (
        <Modal title="Nueva Categoría de Infraestructura" onClose={() => setShowAddForm(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-fg-secondary mb-1">Nombre <span className="text-error">*</span></label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ej: Dependencias Municipales, Colegios..."
                className={inputCls}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-fg-secondary mb-2">Seleccionar Icono</label>
              <div className="grid grid-cols-3 gap-2 border border-app-border rounded-lg p-2.5 bg-card max-h-[160px] overflow-y-auto pr-3">
                {CATEGORY_ICON_OPTIONS.map(opt => {
                  const OptIcon = getCategoryIcon(opt.name)
                  const isSelected = icon === opt.name
                  return (
                    <button
                      key={opt.name}
                      type="button"
                      onClick={() => setIcon(opt.name)}
                      className={`flex flex-col items-center justify-center p-2 rounded-lg border text-[10px] transition-all hover:bg-primary/5 ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary font-bold'
                          : 'border-app-border text-muted hover:text-fg'
                      }`}
                      title={opt.label}
                    >
                      <OptIcon className="w-5 h-5 mb-1 shrink-0" />
                      <span className="truncate max-w-full text-[9px] text-center">{opt.label.split(' ')[0]}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-fg-secondary mb-1">Descripción</label>
              <textarea
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Propósito o detalles de la categoría..."
                className={inputCls}
              />
            </div>

            {formErr && <p className="text-error text-xs">{formErr}</p>}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-sm text-fg-secondary border border-app-border rounded-lg hover:bg-app-bg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={createCat.isPending}
                className="px-4 py-2 text-sm text-primary-fg bg-primary rounded-lg hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors"
              >
                {createCat.isPending ? 'Guardando...' : 'Crear Categoría'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
