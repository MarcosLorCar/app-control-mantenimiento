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
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=es&addressdetails=1`
    )
    if (!res.ok) return fallback
    const data = await res.json()
    const display: string = data.display_name ?? fallback.formattedAddress
    // Trim the hierarchy at the city: keep everything up to and including the
    // city/town/village, drop the trailing province, postcode and country.
    const a = data.address ?? {}
    const city: string | undefined = a.city || a.town || a.village || a.municipality || a.county
    let formattedAddress = display
    if (city) {
      const parts = display.split(', ')
      const idx = parts.indexOf(city)
      if (idx >= 0) formattedAddress = parts.slice(0, idx + 1).join(', ')
    }
    return {
      formattedAddress,
      placeId: data.place_id ? String(data.place_id) : null,
    }
  } catch {
    return fallback
  }
}
