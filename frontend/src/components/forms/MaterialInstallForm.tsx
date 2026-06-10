import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { useCreateMaterial, materialKeys } from '../../hooks/useMaterials'
import { useMaterialTypes } from '../../hooks/useCatalog'
import { useQueryClient } from '@tanstack/react-query'
import { locationKeys } from '../../hooks/useLocations'

interface Props {
  locationId: number
  onClose: () => void
}

export function MaterialInstallForm({ locationId, onClose }: Props) {
  const [name, setName] = useState('')
  const [typeId, setTypeId] = useState(0)
  const [serialNumber, setSerialNumber] = useState('')
  const [installedAt, setInstalledAt] = useState(new Date().toISOString().slice(0, 10))
  const [error, setError] = useState('')

  const { data: materialTypes = [] } = useMaterialTypes()
  const createMaterial = useCreateMaterial()
  const qc = useQueryClient()

  const inputCls = 'w-full border border-app-border rounded-lg px-3 py-2 text-sm bg-card text-fg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors'

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim() || !typeId) {
      setError('Nombre y tipo son obligatorios.')
      return
    }

    createMaterial.mutate(
      {
        name: name.trim(),
        typeId,
        serialNumber: serialNumber.trim() || undefined,
        installedAt: installedAt ? new Date(installedAt).toISOString() : undefined,
        locationId,
      },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: materialKeys.byLocation(locationId) })
          qc.invalidateQueries({ queryKey: locationKeys.detail(locationId) })
          onClose()
        },
        onError: (e: any) => setError(e?.error?.message ?? 'Error al instalar material'),
      }
    )
  }

  return (
    <Modal title="Instalar material" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-fg-secondary mb-1">Nombre <span className="text-error">*</span></label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Bombilla LED 12W" className={inputCls} required />
        </div>
        <div>
          <label className="block text-xs font-semibold text-fg-secondary mb-1">Tipo de material <span className="text-error">*</span></label>
          <select value={typeId} onChange={e => setTypeId(Number(e.target.value))} className={inputCls} required>
            <option value={0}>Seleccionar tipo...</option>
            {materialTypes.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-fg-secondary mb-1">Nº Serie</label>
            <input type="text" value={serialNumber} onChange={e => setSerialNumber(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-fg-secondary mb-1">Fecha instalación</label>
            <input type="date" value={installedAt} onChange={e => setInstalledAt(e.target.value)} className={inputCls} />
          </div>
        </div>
        {error && <p className="text-error text-sm">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-fg-secondary border border-app-border rounded-lg hover:bg-app-bg transition-colors">Cancelar</button>
          <button type="submit" disabled={createMaterial.isPending} className="px-4 py-2 text-sm text-primary-fg bg-primary rounded-lg disabled:opacity-50 transition-colors">
            {createMaterial.isPending ? 'Instalando...' : 'Instalar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
