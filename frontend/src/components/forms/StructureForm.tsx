import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { useCreateStructureUnderInfra, useCreateStructureUnderDep, useUpdateStructure } from '../../hooks/useStructures'
import type { Structure } from '../../api/types'

interface Props {
  infraId?: number
  depId?: number
  existing?: Structure
  onClose: () => void
}

export function StructureForm({ infraId, depId, existing, onClose }: Props) {
  const isEdit = !!existing
  const [code, setCode] = useState(existing?.code ?? '')
  const [name, setName] = useState(existing?.name ?? '')
  const [description, setDescription] = useState(existing?.description ?? '')
  const [error, setError] = useState('')

  const createUnderInfra = useCreateStructureUnderInfra()
  const createUnderDep = useCreateStructureUnderDep()
  const update = useUpdateStructure()
  const isPending = createUnderInfra.isPending || createUnderDep.isPending || update.isPending

  const inputCls = 'w-full border border-app-border rounded-lg px-3 py-2 text-sm bg-card text-fg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors'

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const body = { code: code.trim(), name: name.trim(), description: description.trim() || undefined }
    if (!body.code || !body.name) { setError('Código y nombre son obligatorios.'); return }

    if (isEdit) {
      update.mutate(
        { id: existing!.id, body: { name: body.name, description: body.description } },
        { onSuccess: onClose, onError: (e: any) => setError(e?.error?.message ?? 'Error') }
      )
    } else if (depId) {
      createUnderDep.mutate(
        { depId, body },
        { onSuccess: onClose, onError: (e: any) => setError(e?.error?.message ?? 'Error') }
      )
    } else if (infraId) {
      createUnderInfra.mutate(
        { infraId, body },
        { onSuccess: onClose, onError: (e: any) => setError(e?.error?.message ?? 'Error') }
      )
    }
  }

  return (
    <Modal title={isEdit ? 'Editar estructura' : 'Nueva estructura'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isEdit && (
          <div>
            <label className="block text-xs font-semibold text-fg-secondary mb-1">Código <span className="text-error">*</span></label>
            <input type="text" value={code} onChange={e => setCode(e.target.value)} placeholder="Ej: EST-001" className={inputCls} required />
          </div>
        )}
        <div>
          <label className="block text-xs font-semibold text-fg-secondary mb-1">Nombre <span className="text-error">*</span></label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nombre de la estructura" className={inputCls} required />
        </div>
        <div>
          <label className="block text-xs font-semibold text-fg-secondary mb-1">Descripción</label>
          <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} className={inputCls} />
        </div>
        {error && <p className="text-error text-sm">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-fg-secondary border border-app-border rounded-lg hover:bg-app-bg transition-colors">Cancelar</button>
          <button type="submit" disabled={isPending} className="px-4 py-2 text-sm text-primary-fg bg-primary rounded-lg hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors">
            {isPending ? 'Guardando...' : isEdit ? 'Guardar' : 'Crear'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
