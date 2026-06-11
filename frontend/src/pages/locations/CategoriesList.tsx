import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Folder, AlertCircle } from 'lucide-react'
import { useInfrastructureTypes, useCreateInfrastructureType } from '../../hooks/useCatalog'
import { useLocations } from '../../hooks/useLocations'
import { RoleGuard } from '../../components/RoleGuard'
import { Modal } from '../../components/ui/Modal'

export function CategoriesList() {
  const navigate = useNavigate()
  const { data: categories = [], isLoading: loadingCats, error: catErr } = useInfrastructureTypes()
  const { data: rootLocations = [] } = useLocations(null) // Fetch root locations to calculate counts
  const createCat = useCreateInfrastructureType()

  const [showAddForm, setShowAddForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('🌳')
  const [color, setColor] = useState('#10B981')
  const [formErr, setFormErr] = useState('')

  const getCount = (catId: number) => {
    return rootLocations.filter(loc => loc.infraTypeId === catId).length
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormErr('')
    if (!name.trim()) return

    createCat.mutate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        icon: icon.trim() || undefined,
        color,
      },
      {
        onSuccess: () => {
          setName('')
          setDescription('')
          setIcon('🌳')
          setColor('#10B981')
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
      <p className="text-xs text-muted">
        Selecciona una categoría de infraestructura para ver sus ubicaciones principales.
      </p>

      {/* Grid List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {categories.length === 0 && (
          <div className="col-span-full bg-card rounded-xl border border-app-border p-12 text-center text-muted text-sm">
            No hay categorías registradas en el catálogo.
          </div>
        )}
        {categories.map(cat => {
          const count = getCount(cat.id)
          const displayColor = cat.color ?? '#6B7280'
          const bgLight = displayColor + '10'

          return (
            <div
              key={cat.id}
              onClick={() => navigate(`/categories/${cat.id}`)}
              role="button"
              className="flex flex-col p-6 rounded-xl border bg-card border-app-border hover:border-primary/40 hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden"
            >
              {/* Top border decoration */}
              <div 
                className="absolute top-0 inset-x-0 h-1 transition-all group-hover:h-1.5"
                style={{ backgroundColor: displayColor }}
              />

              <div className="flex items-center gap-3.5 mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-2xl transition-transform group-hover:scale-110 group-hover:rotate-3"
                  style={{ backgroundColor: bgLight }}
                >
                  {cat.icon ? (
                    <span>{cat.icon}</span>
                  ) : (
                    <Folder className="w-5.5 h-5.5" style={{ color: displayColor }} />
                  )}
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
                placeholder="Ej: Hospital, Pista de Tenis..."
                className={inputCls}
                required
                autoFocus
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-fg-secondary mb-1">Icono (Emoji)</label>
                <input
                  type="text"
                  value={icon}
                  onChange={e => setIcon(e.target.value)}
                  placeholder="🌳"
                  maxLength={5}
                  className={`${inputCls} text-center text-lg`}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-fg-secondary mb-1">Color representativo</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    className="w-10 h-10 border border-app-border bg-transparent rounded-lg cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    className={`${inputCls} font-mono`}
                  />
                </div>
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
