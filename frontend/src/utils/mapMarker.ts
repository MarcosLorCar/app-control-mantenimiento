import L from 'leaflet'
import { getCategoryColor } from './categoryColors'

const cache = new Map<string, L.DivIcon>()

/**
 * Builds (and caches) a Leaflet divIcon teardrop pin filled with the category
 * color. Size/anchor mirror the default Leaflet pin (25x41, tip at bottom).
 */
export function buildCategoryMarker(color: string | null | undefined): L.DivIcon {
  const fill = getCategoryColor(color)
  const existing = cache.get(fill)
  if (existing) return existing

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="27" height="43" viewBox="0 0 27 43">
      <path d="M13.5 1C6.6 1 1 6.6 1 13.5C1 22.9 13.5 42 13.5 42S26 22.9 26 13.5C26 6.6 20.4 1 13.5 1Z"
        fill="${fill}" stroke="#ffffff" stroke-width="1.5"/>
      <circle cx="13.5" cy="13.5" r="4.5" fill="#ffffff"/>
    </svg>`

  const icon = L.divIcon({
    className: 'category-marker',
    html: svg,
    iconSize: [27, 43],
    iconAnchor: [13.5, 42],
    popupAnchor: [0, -36],
    tooltipAnchor: [16, -28],
  })
  cache.set(fill, icon)
  return icon
}
