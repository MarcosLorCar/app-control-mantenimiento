import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Modal } from '../../components/ui/Modal'
import { useCreateMaterial, actionKeys } from '../../hooks/useActions'

interface Props {
  actionId: number
  infrastructureId: number
  onClose: () => void
}

export function MaterialForm({ actionId, infrastructureId, onClose }: Props) {
  const [name, setName] = useState('')
  const [unit, setUnit] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unitCost, setUnitCost] = useState('')
  const [supplier, setSupplier] = useState('')
  const [error, setError] = useState('')

  const qc = useQueryClient()
  const createMaterial = useCreateMaterial(actionId)

  const computedTotal =
    quantity && unitCost
      ? (Number(quantity) * Number(unitCost)).toFixed(2)
      : null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !unit || !quantity) {
      setError('Nombre, cantidad y unidad son obligatorios.')
      return
    }
    setError('')
    createMaterial.mutate(
      {
        name,
        unit,
        quantity: Number(quantity),
        unitCost: unitCost ? Number(unitCost) : undefined,
        supplier: supplier || undefined,
      },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: actionKeys.byInfra(infrastructureId) })
          onClose()
        },
        onError: (err: any) => setError(err?.error?.message ?? 'Error al añadir material'),
      }
    )
  }

  const inputCls = 'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900'

  return (
    <Modal title="Añadir material" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Material <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="ej. Cable UTP cat6"
            className={inputCls}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cantidad <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unidad <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={unit}
              onChange={e => setUnit(e.target.value)}
              placeholder="m, kg, uds..."
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Coste unitario (€)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={unitCost}
            onChange={e => setUnitCost(e.target.value)}
            className={inputCls}
          />
          {computedTotal && (
            <p className="text-xs text-gray-500 mt-1">Total estimado: {computedTotal} €</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
          <input
            type="text"
            value={supplier}
            onChange={e => setSupplier(e.target.value)}
            className={inputCls}
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={createMaterial.isPending}
            className="px-4 py-2 text-sm text-white bg-gray-900 rounded-md hover:bg-gray-700 disabled:opacity-50"
          >
            {createMaterial.isPending ? 'Añadiendo...' : 'Añadir'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
