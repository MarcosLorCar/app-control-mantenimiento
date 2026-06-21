import { useState, useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../api/client'
import { locationKeys } from './useLocations'

export interface RecalcProgress {
  running: boolean
  done: number
  total: number
  failed: number
  finished: boolean
}

const IDLE: RecalcProgress = { running: false, done: 0, total: 0, failed: 0, finished: false }

export function useRecalcAddresses() {
  const qc = useQueryClient()
  const [progress, setProgress] = useState<RecalcProgress>(IDLE)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: RecalcProgress }>('/api/v1/locations/recalc-addresses/status')
      setProgress(res.data)
      return res.data
    } catch {
      return IDLE
    }
  }, [])

  const run = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: RecalcProgress }>('/api/v1/locations/recalc-addresses', {
        method: 'POST',
      })
      setProgress(res.data)
    } catch (err) {
      console.error('Error starting recalc:', err)
    }
  }, [])

  // Poll status while recalculation is running
  useEffect(() => {
    let intervalId: any = null

    void fetchStatus().then(status => {
      if (status.running) {
        intervalId = setInterval(async () => {
          const currentStatus = await fetchStatus()
          if (!currentStatus.running) {
            clearInterval(intervalId)
            void qc.invalidateQueries({ queryKey: locationKeys.all })
          }
        }, 2000)
      }
    })

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [fetchStatus, qc])

  // Also poll if a start action was triggered locally
  useEffect(() => {
    let intervalId: any = null

    if (progress.running) {
      intervalId = setInterval(async () => {
        const currentStatus = await fetchStatus()
        if (!currentStatus.running) {
          clearInterval(intervalId)
          void qc.invalidateQueries({ queryKey: locationKeys.all })
        }
      }, 2000)
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [progress.running, fetchStatus, qc])

  return { progress, run }
}
