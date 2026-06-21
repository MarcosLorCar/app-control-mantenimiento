import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { useUpdateInfrastructureType, useDeleteInfrastructureType } from '../../hooks/useCatalog'
import { getCategoryIcon, CATEGORY_ICON_OPTIONS } from '../../utils/categoryIcons'
import { getCategoryColor, DEFAULT_CATEGORY_COLOR } from '../../utils/categoryColors'
import { ColorPicker } from '../ui/ColorPicker'
import { AlertTriangle, Trash2 } from 'lucide-react'
import type { InfrastructureType } from '../../api/types'

interface Props {
  category: InfrastructureType
  onClose: () => void
}

export function CategoryEditModal({ category, onClose }: Props) {
  const updateCatMut = useUpdateInfrastructureType()
  const deleteCatMut = useDeleteInfrastructureType()

  const [name, setName] = useState(category.name)
  const [description, setDescription] = useState(category.description ?? '')
  const [icon, setIcon] = useState(category.icon ?? 'Building2')
  const [color, setColor] = useState<string>(getCategoryColor(category.color))
  
  // Deletion safety state
  const [deleteConfirmName, setDeleteConfirmName] = useState('')
  const [deleteCheck, setDeleteCheck] = useState(false)
  
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const inputCls = 'w-full border border-app-border rounded-lg px-3 py-2 text-sm bg-card text-fg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors'

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!name.trim()) return

    updateCatMut.mutate(
      {
        id: category.id,
        body: {
          name: name.trim(),
          description: description.trim() || undefined,
          icon,
          color: color || DEFAULT_CATEGORY_COLOR,
        },
      },
      {
        onSuccess: () => {
          setSuccess('Categoría actualizada con éxito')
          setTimeout(() => {
            onClose()
          }, 1000)
        },
        onError: (err: any) => {
          setError(err?.error?.message ?? 'Error al actualizar la categoría')
        },
      }
    )
  }

  const handleDelete = () => {
    setError('')
    if (deleteConfirmName !== category.name || !deleteCheck) return

    deleteCatMut.mutate(category.id, {
      onSuccess: () => {
        onClose()
      },
      onError: (err: any) => {
        setError(err?.error?.message ?? 'No se pudo eliminar la categoría')
      },
    })
  }

  return (
    <Modal title={`Editar Categoría - ${category.name}`} onClose={onClose}>
      <div className="max-h-[75vh] overflow-y-auto px-2 space-y-6">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-fg-secondary mb-1">
              Nombre de la Categoría <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className={inputCls}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-fg-secondary mb-2">Seleccionar Icono</label>
            <div className="grid grid-cols-3 gap-2 border border-app-border rounded-lg p-2.5 bg-card max-h-[140px] overflow-y-auto">
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
            <label className="block text-xs font-semibold text-fg-secondary mb-2">Color</label>
            <ColorPicker value={color} onChange={setColor} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-fg-secondary mb-1">Descripción</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Propósito o detalles de la categoría..."
              className={inputCls}
            />
          </div>

          {error && <p className="text-error text-xs">{error}</p>}
          {success && <p className="text-emerald-500 text-xs font-semibold">{success}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-fg-secondary border border-app-border rounded-lg hover:bg-app-bg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={updateCatMut.isPending}
              className="px-4 py-2 text-sm text-primary-fg bg-primary rounded-lg hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors"
            >
              {updateCatMut.isPending ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>

        {/* Danger Zone */}
        <div className="border-t border-app-border pt-5 space-y-4">
          <div className="flex items-center gap-2 text-error">
            <AlertTriangle className="w-5 h-5" />
            <h4 className="text-sm font-bold uppercase tracking-wider">Zona de Peligro</h4>
          </div>

          <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 space-y-3">
            <p className="text-xs text-fg-secondary leading-relaxed">
              Eliminar esta categoría ocultará todas las ubicaciones y materiales asociados en las vistas principales. Esta acción no se puede deshacer.
            </p>

            <label className="flex items-start gap-2.5 text-xs text-fg cursor-pointer select-none">
              <input
                type="checkbox"
                checked={deleteCheck}
                onChange={e => setDeleteCheck(e.target.checked)}
                className="mt-0.5 rounded border-app-border text-red-600 focus:ring-red-500/40 focus:ring-1 bg-card"
              />
              <span>Entiendo las consecuencias y deseo proceder con la eliminación.</span>
            </label>

            <div>
              <p className="text-[11px] font-semibold text-fg-secondary mb-1">
                Escribe el nombre de la categoría para confirmar: <strong className="text-fg font-mono select-all px-1 bg-muted rounded">{category.name}</strong>
              </p>
              <input
                type="text"
                value={deleteConfirmName}
                onChange={e => setDeleteConfirmName(e.target.value)}
                placeholder="Escribe el nombre exacto de la categoría"
                className="w-full border border-red-500/20 focus:border-red-500 rounded-lg px-3 py-1.5 text-xs bg-card text-fg focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-colors"
              />
            </div>

            <button
              type="button"
              onClick={handleDelete}
              disabled={!deleteCheck || deleteConfirmName !== category.name || deleteCatMut.isPending}
              className="w-full py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-600/30 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-sm"
            >
              <Trash2 className="w-4 h-4" />
              {deleteCatMut.isPending ? 'Eliminando...' : 'Eliminar Categoría Permanentemente'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
