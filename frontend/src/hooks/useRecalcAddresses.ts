import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { listLocations, updateLocation } from '../api/locations'
import { locationKeys } from './useLocations'
import { reverseGeocode } from '../utils/geocode'

export interface RecalcProgress {
  running: boolean
  done: number
  total: number
  failed: number
  finished: boolean
}

const IDLE: RecalcProgress = { running: false, done: 0, total: 0, failed: 0, finished: false }

// Nominatim usage policy allows at most 1 request/second. Pace requests so a bulk
// recalculation doesn't get the app rate-limited / blocked.
const THROTTLE_MS = 1100

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

/**
 * Bulk re-derives every geolocated location's address from its coordinates via
 * reverse geocoding, then persists the refreshed structured address fields.
 * Runs sequentially in the browser (rate-limited) — a long, blocking operation.
 */
export function useRecalcAddresses() {
  const qc = useQueryClient()
  const [progress, setProgress] = useState<RecalcProgress>(IDLE)

  const run = useCallback(async () => {
    setProgress({ ...IDLE, running: true })
    try {
      const all = await listLocations(undefined)
      const geo = all.filter(l => l.latitude !== null && l.longitude !== null)
      setProgress(p => ({ ...p, total: geo.length }))

      let failed = 0
      for (let i = 0; i < geo.length; i++) {
        const loc = geo[i]
        try {
          const r = await reverseGeocode(loc.latitude!, loc.longitude!)
          await updateLocation(loc.id, {
            formattedAddress: r.formattedAddress,
            placeId: r.placeId,
            addrStreet: r.addrStreet,
            addrHouseNumber: r.addrHouseNumber,
            addrCity: r.addrCity,
            addrPostcode: r.addrPostcode,
            addrProvince: r.addrProvince,
          })
        } catch {
          failed++
        }
        setProgress({ running: true, done: i + 1, total: geo.length, failed, finished: false })
        if (i < geo.length - 1) await sleep(THROTTLE_MS)
      }

      await qc.invalidateQueries({ queryKey: locationKeys.all })
      setProgress(p => ({ ...p, running: false, finished: true }))
    } catch {
      setProgress(p => ({ ...p, running: false, finished: true }))
    }
  }, [qc])

  return { progress, run }
}
