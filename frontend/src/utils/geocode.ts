import { buildFormattedAddress, EMPTY_ADDRESS_PARTS, type AddressParts } from './address'

export interface ReverseGeocodeResult extends AddressParts {
  formattedAddress: string
  placeId: string | null
}

/**
 * Reverse-geocode coordinates to a human address via Nominatim.
 * Pinned to Spanish (accept-language=es) so names come back consistently
 * (otherwise Nominatim can mix in localized name tags, e.g. Cyrillic).
 * Always resolves — falls back to a coordinate string on any failure.
 *
 * Note: the matched POI/feature name is intentionally NOT included; the address
 * starts at the street level of the returned hierarchy.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult> {
  const fallback: ReverseGeocodeResult = {
    ...EMPTY_ADDRESS_PARTS,
    formattedAddress: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    placeId: null,
  }
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=es&addressdetails=1`
    )
    if (!res.ok) return fallback
    const data = await res.json()
    const a = data.address ?? {}

    // Parse structured components, skipping the POI/feature name entirely so the
    // address begins at the street level of the returned hierarchy.
    const parts: AddressParts = {
      addrStreet: a.road || a.pedestrian || a.footway || null,
      addrHouseNumber: a.house_number || null,
      addrCity: a.city || a.town || a.village || a.municipality || a.county || null,
      addrPostcode: a.postcode || null,
      addrProvince: a.province || a.state || null,
    }

    const formattedAddress =
      buildFormattedAddress(parts) ?? data.display_name ?? fallback.formattedAddress

    return {
      ...parts,
      formattedAddress,
      placeId: data.place_id ? String(data.place_id) : null,
    }
  } catch {
    return fallback
  }
}
