import { StretchHorizontal, AlignJustify } from 'lucide-react'
import type { Density } from '../../hooks/useDensity'

interface Props {
  density: Density
  onChange: (d: Density) => void
}

/** Comfortable / compact density switch for location lists. */
export function DensityToggle({ density, onChange }: Props) {
  const btn = (active: boolean) =>
    `flex items-center justify-center w-8 h-8 rounded-md transition-all ${
      active ? 'bg-primary text-primary-fg shadow-sm' : 'text-muted hover:text-fg'
    }`
  return (
    <div className="flex bg-card p-1 rounded-lg border border-app-border shadow-sm shrink-0">
      <button
        type="button"
        onClick={() => onChange('comfortable')}
        className={btn(density === 'comfortable')}
        title="Vista cómoda"
      >
        <StretchHorizontal className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange('compact')}
        className={btn(density === 'compact')}
        title="Vista compacta"
      >
        <AlignJustify className="w-4 h-4" />
      </button>
    </div>
  )
}
