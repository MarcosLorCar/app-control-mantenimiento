import { useState, useCallback } from 'react'

export type GeolocationStatus = 'idle' | 'checking' | 'denied' | 'locating' | 'error' | 'success'

export interface GeolocationCoords {
  latitude: number
  longitude: number
}

export function useGeolocation() {
  const [status, setStatus] = useState<GeolocationStatus>('idle')
  const [coords, setCoords] = useState<GeolocationCoords | null>(null)
  const [error, setError] = useState<string | null>(null)

  const request = useCallback(async () => {
    if (!('geolocation' in navigator)) {
      setStatus('error')
      setError('La geolocalización no está soportada por este navegador.')
      return
    }

    setStatus('checking')
    setError(null)

    // Check permission state if permissions API is available
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName })
        if (result.state === 'denied') {
          setStatus('denied')
          return
        }
      } catch (err) {
        // Permissions query failed, proceed to direct request
      }
    }

    setStatus('locating')
    const getPosition = (highAccuracy: boolean) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          })
          setStatus('success')
        },
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            setStatus('denied')
          } else if (highAccuracy) {
            // Fallback to low accuracy on timeout/error
            getPosition(false)
          } else {
            setStatus('error')
            setError(err.message || 'Error al obtener la ubicación.')
          }
        },
        {
          enableHighAccuracy: highAccuracy,
          timeout: highAccuracy ? 8000 : 12000,
          maximumAge: highAccuracy ? 0 : 60000,
        }
      )
    }

    getPosition(true)
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setCoords(null)
    setError(null)
  }, [])

  return { status, coords, error, request, reset }
}
