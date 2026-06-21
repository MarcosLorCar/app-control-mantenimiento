import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { MapPin } from 'lucide-react'
import { buildFormattedAddress, normalizeAddressParts, type AddressParts } from '../../utils/address'

interface Props {
  initial: Partial<AddressParts>
  onSave: (parts: AddressParts, formattedAddress: string | null) => void
  onClose: () => void
  saving?: boolean
}

const FIELDS: { key: keyof AddressParts; label: string; placeholder: string }[] = [
  { key: 'addrStreet', label: 'Calle / Vía', placeholder: 'Ej: Calle Mayor' },
  { key: 'addrHouseNumber', label: 'Número', placeholder: 'Ej: 12' },
  { key: 'addrPostcode', label: 'Código postal', placeholder: 'Ej: 13001' },
  { key: 'addrCity', label: 'Ciudad / Municipio', placeholder: 'Ej: Ciudad Real' },
  { key: 'addrProvince', label: 'Provincia', placeholder: 'Ej: Ciudad Real' },
]

/**
 * Edit the structured address fields. Lets the user correct errors coming from
 * the reverse-geocoding API. The displayed address is rebuilt from the parts.
 */
export function AddressEditModal({ initial, onSave, onClose, saving }: Props) {
  const [parts, setParts] = useState<AddressParts>(normalizeAddressParts(initial))

  const inputCls =
    'w-full border border-app-border rounded-lg px-3 py-2 text-sm bg-card text-fg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors'

  const set = (k: keyof AddressParts, v: string) =>
    setParts(p => ({ ...p, [k]: v.length ? v : null }))

  const preview = buildFormattedAddress(parts)

  function handleSave() {
    const normalized = normalizeAddressParts(parts)
    onSave(normalized, buildFormattedAddress(normalized))
  }

  return (
    <Modal title="Editar dirección" onClose={onClose} size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {FIELDS.map(f => (
            <div key={f.key} className={f.key === 'addrStreet' ? 'col-span-2' : ''}>
              <label className="block text-xs font-semibold text-fg-secondary mb-1">{f.label}</label>
              <input
                type="text"
                value={parts[f.key] ?? ''}
                onChange={e => set(f.key, e.target.value)}
                placeholder={f.placeholder}
                className={inputCls}
              />
            </div>
          ))}
        </div>

        <div className="flex items-start gap-1.5 text-xs text-muted bg-app-bg/60 border border-app-border rounded-lg px-3 py-2">
          <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
          <span>{preview ?? 'Sin dirección (se mostrarán las coordenadas).'}</span>
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-fg-secondary border border-app-border rounded-lg hover:bg-app-bg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm text-primary-fg bg-primary rounded-lg hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors"
          >
            {saving ? 'Guardando...' : 'Guardar dirección'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
