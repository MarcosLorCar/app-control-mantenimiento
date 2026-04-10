// frontend/src/pages/infrastructures/InfrastructureForm.tsx
import { useState, FormEvent } from 'react'
import { Modal } from '../../components/ui/Modal'
import { useCreateInfrastructure, useUpdateInfrastructure } from '../../hooks/useInfrastructures'
import type { Infrastructure } from '../../api/types'

interface Props {
  onClose: () => void
  existing?: Infrastructure
}

export function InfrastructureForm({ onClose, existing }: Props) {
  const [name, setName] = useState(existing?.name ?? '')
  const [description, setDescription] = useState(existing?.description ?? '')
  const [location, setLocation] = useState(existing?.location ?? '')
  const [error, setError] = useState('')

  const createMutation = useCreateInfrastructure()
  const updateMutation = useUpdateInfrastructure()
  const isPending = createMutation.isPending || updateMutation.isPending

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    const body = {
      name,
      description: description || undefined,
      location: location || undefined,
    }
    try {
      if (existing) {
        await updateMutation.mutateAsync({ id: existing.id, body })
      } else {
        await createMutation.mutateAsync(body)
      }
      onClose()
    } catch (err: any) {
      setError(err?.error?.message ?? 'Error al guardar')
    }
  }

  return (
    <Modal title={existing ? 'Editar infraestructura' : 'Nueva infraestructura'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
          <input
            value={location}
            onChange={e => setLocation(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 text-sm text-white bg-primary rounded-lg hover:bg-[var(--primary-hover)] disabled:opacity-50"
          >
            {isPending ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
