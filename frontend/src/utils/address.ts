// Structured address components. These are persisted on the Location and the
// human-readable `formattedAddress` is derived from them via buildFormattedAddress.
export interface AddressParts {
  addrStreet: string | null
  addrHouseNumber: string | null
  addrCity: string | null
  addrPostcode: string | null
  addrProvince: string | null
}

export const EMPTY_ADDRESS_PARTS: AddressParts = {
  addrStreet: null,
  addrHouseNumber: null,
  addrCity: null,
  addrPostcode: null,
  addrProvince: null,
}

function clean(v: string | null | undefined): string | null {
  const t = (v ?? '').trim()
  return t.length ? t : null
}

/** Normalizes a partial set of parts into a full AddressParts (trimmed, nulls). */
export function normalizeAddressParts(parts: Partial<AddressParts>): AddressParts {
  return {
    addrStreet: clean(parts.addrStreet),
    addrHouseNumber: clean(parts.addrHouseNumber),
    addrCity: clean(parts.addrCity),
    addrPostcode: clean(parts.addrPostcode),
    addrProvince: clean(parts.addrProvince),
  }
}

/**
 * Composes a display address from structured components in a stable order:
 * "Street Number, Postcode City, Province". Empty parts are skipped.
 * Returns null when there's nothing to show (caller can fall back to coords).
 */
export function buildFormattedAddress(parts: Partial<AddressParts>): string | null {
  const p = normalizeAddressParts(parts)
  const street = p.addrStreet
    ? p.addrHouseNumber
      ? `${p.addrStreet} ${p.addrHouseNumber}`
      : p.addrStreet
    : null
  const cityLine = [p.addrPostcode, p.addrCity].filter(Boolean).join(' ') || null
  const segments = [street, cityLine, p.addrProvince].filter(Boolean)
  return segments.length ? segments.join(', ') : null
}

export function hasAnyAddressPart(parts: Partial<AddressParts>): boolean {
  const p = normalizeAddressParts(parts)
  return Boolean(p.addrStreet || p.addrHouseNumber || p.addrCity || p.addrPostcode || p.addrProvince)
}
