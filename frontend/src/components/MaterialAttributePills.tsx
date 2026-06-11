import type { Material } from '../api/types'

const LABELS: Record<string, string> = {
  purchase_date: 'F. Compra',
  warranty_period: 'Garantía (meses)',
  supplier: 'Proveedor',
}

function formatKey(key: string) {
  if (LABELS[key]) return LABELS[key]
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

export function MaterialAttributePills({ material }: { material: { attributes?: Record<string, any> | null } }) {
  if (!material.attributes || Object.keys(material.attributes).length === 0) return null

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {Object.entries(material.attributes).map(([key, val]) => {
        if (val === null || val === undefined || val === '') return null

        let displayVal = String(val)
        if (typeof val === 'boolean') {
          displayVal = val ? 'Sí' : 'No'
        } else if (key === 'purchase_date' && typeof val === 'string') {
          // Format date briefly
          try {
            displayVal = new Date(val).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })
          } catch {
            displayVal = val
          }
        }

        const label = `${formatKey(key)}: ${displayVal}`

        return (
          <span
            key={key}
            className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-app-bg text-fg-secondary border border-app-border"
          >
            {label}
          </span>
        )
      })}
    </div>
  )
}
