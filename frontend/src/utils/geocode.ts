export interface ReverseGeocodeResult {
  formattedAddress: string
  placeId: string | null
}

/**
 * Reverse-geocode coordinates to a human address via Nominatim.
 * Pinned to Spanish (accept-language=es) so names come back consistently
 * (otherwise Nominatim can mix in localized name tags, e.g. Cyrillic).
 * Always resolves — falls back to a coordinate string on any failure.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult> {
  const fallback: ReverseGeocodeResult = {
    formattedAddress: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    placeId: null,
  }
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=es`
    )
    if (!res.ok) return fallback
    const data = await res.json()
    return {
      formattedAddress: data.display_name ?? fallback.formattedAddress,
      placeId: data.place_id ? String(data.place_id) : null,
    }
  } catch {
    return fallback
  }
}
