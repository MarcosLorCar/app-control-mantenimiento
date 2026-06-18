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
    // Build the address from road + city only, skipping neighbourhood/quarter
    // tags (e.g. Nominatim's "Los Ángeles" barrio covers most of central
    // Ciudad Real, so including it makes every point look like the same street).
    const a = data.address ?? {}
    const city: string | undefined = a.city || a.town || a.village || a.municipality || a.county
    const road: string | undefined = a.road || a.pedestrian || a.footway
    // Nominatim sets top-level `name` to the matched feature's name. For a
    // bare road/place it just repeats the road name, so only treat it as a
    // POI name when the match is an actual point of interest.
    const poiName: string | undefined =
      data.addresstype !== 'road' && data.name && data.name !== road && data.name !== city
        ? data.name
        : undefined
    let formattedAddress = display
    if (road && city) {
      const streetAddress = a.house_number ? `${road} ${a.house_number}` : road
      formattedAddress = poiName ? `${poiName}, ${streetAddress}, ${city}` : `${streetAddress}, ${city}`
    } else if (city) {
      formattedAddress = poiName ? `${poiName}, ${city}` : city
    }
    return {
      formattedAddress,
      placeId: data.place_id ? String(data.place_id) : null,
    }
  } catch {
    return fallback
  }
}
