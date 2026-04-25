import { useState, FormEvent } from 'react'
import { Modal } from '../../components/ui/Modal'
import { useCreateInfrastructure, useUpdateInfrastructure } from '../../hooks/useInfrastructures'
import type { Infrastructure } from '../../api/types'

interface Props {
  onClose: () => void
  existing?: Infrastructure
}

export function InfrastructureForm({ onClose, existing }: Props) {
  const [code, setCode] = useState(existing?.code ?? '')
  const [name, setName] = useState(existing?.name ?? '')
  const [description, setDescription] = useState(existing?.description ?? '')
  const [error, setError] = useState('')

  const createMutation = useCreateInfrastructure()
  const updateMutation = useUpdateInfrastructure()
  const isPending = createMutation.isPending || updateMutation.isPending

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    const body = {
      code,
      name,
      description: description || undefined,
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

  const inputCls = 'w-full border border-app-border rounded-lg px-3 py-2 text-sm bg-card text-fg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors'

  return (
    <Modal title={existing ? 'Editar infraestructura' : 'Nueva infraestructura'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-fg-secondary mb-1">
            Código <span className="text-error">*</span>
          </label>
          <input
            value={code}
            onChange={e => setCode(e.target.value)}
            required
            placeholder="Ej: HOSP-001"
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-fg-secondary mb-1">
            Nombre <span className="text-error">*</span>
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-fg-secondary mb-1">Descripción</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            className={inputCls}
          />
        </div>
        {error && <p className="text-error text-sm">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-fg-secondary border border-app-border rounded-lg hover:bg-app-bg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 text-sm text-primary-fg bg-primary rounded-lg hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors"
          >
            {isPending ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
