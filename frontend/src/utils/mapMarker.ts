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
    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41">
      <path d="M12.5 0C5.6 0 0 5.6 0 12.5C0 21.9 12.5 41 12.5 41S25 21.9 25 12.5C25 5.6 19.4 0 12.5 0Z"
        fill="${fill}" stroke="#ffffff" stroke-width="1.5"/>
      <circle cx="12.5" cy="12.5" r="4.5" fill="#ffffff"/>
    </svg>`

  const icon = L.divIcon({
    className: 'category-marker',
    html: svg,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
  })
  cache.set(fill, icon)
  return icon
}
