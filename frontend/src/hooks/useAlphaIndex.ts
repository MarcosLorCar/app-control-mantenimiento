import { useMemo, useRef, useCallback } from 'react'
import { letterFor } from '../components/ui/AlphaIndexScroller'

/**
 * Alphabetically sorts a list and provides everything the AlphaIndexScroller
 * needs: the ordered letters, per-item "first of its letter" markers, an anchor
 * ref setter, and a scroll-to-letter handler.
 */
export function useAlphaIndex<T>(items: T[], getName: (item: T) => string) {
  const sorted = useMemo(
    () =>
      [...items].sort((a, b) =>
        getName(a).localeCompare(getName(b), 'es', { sensitivity: 'base' })
      ),
    [items, getName]
  )

  // For each item in `sorted`, the letter it anchors (if it's the first of that
  // letter), otherwise null.
  const firstOfLetter = useMemo(() => {
    const seen = new Set<string>()
    return sorted.map(it => {
      const l = letterFor(getName(it))
      if (seen.has(l)) return null
      seen.add(l)
      return l
    })
  }, [sorted, getName])

  const letters = useMemo(
    () => firstOfLetter.filter((l): l is string => l !== null),
    [firstOfLetter]
  )

  const anchors = useRef<Map<string, HTMLElement>>(new Map())

  const setAnchorRef = useCallback(
    (letter: string) => (el: HTMLElement | null) => {
      if (el) anchors.current.set(letter, el)
    },
    []
  )

  const scrollToLetter = useCallback((letter: string) => {
    anchors.current.get(letter)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  return { sorted, letters, firstOfLetter, setAnchorRef, scrollToLetter }
}
