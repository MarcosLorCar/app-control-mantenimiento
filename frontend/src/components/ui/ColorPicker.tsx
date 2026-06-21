import { CATEGORY_COLOR_PALETTE } from '../../utils/categoryColors'

interface Props {
  value: string
  onChange: (color: string) => void
}

/** Curated palette swatches + a native picker for any custom hex. */
export function ColorPicker({ value, onChange }: Props) {
  const isPreset = CATEGORY_COLOR_PALETTE.some(c => c.toLowerCase() === value.toLowerCase())
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {CATEGORY_COLOR_PALETTE.map(c => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${
            value.toLowerCase() === c.toLowerCase()
              ? 'ring-2 ring-offset-2 ring-offset-card ring-fg scale-110'
              : ''
          }`}
          style={{ backgroundColor: c }}
          title={c}
        />
      ))}
      <label
        className={`relative w-7 h-7 rounded-full overflow-hidden cursor-pointer border border-app-border ${
          !isPreset ? 'ring-2 ring-offset-2 ring-offset-card ring-fg' : ''
        }`}
        title="Color personalizado"
      >
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
        />
        <span
          className="absolute inset-0"
          style={{ background: 'conic-gradient(red, orange, yellow, lime, aqua, blue, magenta, red)' }}
        />
      </label>
    </div>
  )
}
