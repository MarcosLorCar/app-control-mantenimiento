import { useRef, useState, useCallback } from 'react'

interface Props {
  /** Available letters (already in display order, e.g. ['A','B','C','#']). */
  letters: string[]
  /** Fired when a letter is activated via click or touch-drag. */
  onSelect: (letter: string) => void
}

/**
 * Vertical A–Z fast-scroll index, like a contacts list. Works with both mouse
 * (click/drag) and touch (drag) via Pointer Events. Shows a large letter bubble
 * overlay while interacting. The parent is responsible for scrolling the first
 * item of the selected letter into view inside onSelect.
 */
export function AlphaIndexScroller({ letters, onSelect }: Props) {
  const barRef = useRef<HTMLDivElement>(null)
  const lastLetter = useRef<string | null>(null)
  const [active, setActive] = useState<string | null>(null)

  const pickFromY = useCallback(
    (clientY: number) => {
      const bar = barRef.current
      if (!bar || letters.length === 0) return
      const rect = bar.getBoundingClientRect()
      const ratio = (clientY - rect.top) / rect.height
      const idx = Math.min(letters.length - 1, Math.max(0, Math.floor(ratio * letters.length)))
      const letter = letters[idx]
      if (!letter) return
      setActive(letter)
      if (letter !== lastLetter.current) {
        lastLetter.current = letter
        onSelect(letter)
      }
    },
    [letters, onSelect]
  )

  const handleDown = (e: React.PointerEvent) => {
    e.preventDefault()
    barRef.current?.setPointerCapture(e.pointerId)
    lastLetter.current = null
    pickFromY(e.clientY)
  }

  const handleMove = (e: React.PointerEvent) => {
    if (e.buttons === 0 && e.pointerType === 'mouse') return
    pickFromY(e.clientY)
  }

  const handleUp = (e: React.PointerEvent) => {
    barRef.current?.releasePointerCapture(e.pointerId)
    setActive(null)
    lastLetter.current = null
  }

  if (letters.length <= 1) return null

  return (
    <>
      <div
        ref={barRef}
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onPointerCancel={handleUp}
        className="absolute right-0 top-0 bottom-0 z-20 flex flex-col items-center justify-center gap-0.5 px-1 select-none touch-none cursor-pointer"
      >
        {letters.map(l => (
          <span
            key={l}
            className={`text-[10px] leading-none font-bold transition-colors ${
              active === l ? 'text-primary' : 'text-muted/70'
            }`}
          >
            {l}
          </span>
        ))}
      </div>

      {active && (
        <div className="fixed inset-0 z-[9998] pointer-events-none flex items-center justify-center">
          <div className="w-24 h-24 rounded-2xl bg-primary text-primary-fg flex items-center justify-center text-5xl font-bold shadow-2xl">
            {active}
          </div>
        </div>
      )}
    </>
  )
}

/** Returns the index letter for a name ('A'–'Z' uppercased, or '#' otherwise). */
export function letterFor(name: string): string {
  const first = (name.trim()[0] ?? '#').toUpperCase()
  return /[A-ZÀ-ÿ]/.test(first) ? first : '#'
}
