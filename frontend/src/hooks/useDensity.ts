import { useState } from 'react'

export type Density = 'comfortable' | 'compact'

const KEY = 'locationsDensity'

/** Persisted, app-wide list density preference for location lists. */
export function useDensity() {
  const [density, setDensityState] = useState<Density>(() =>
    localStorage.getItem(KEY) === 'compact' ? 'compact' : 'comfortable'
  )
  const setDensity = (d: Density) => {
    setDensityState(d)
    localStorage.setItem(KEY, d)
  }
  return { density, setDensity }
}
