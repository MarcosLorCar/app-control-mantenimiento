// Available base map styles. All are free / keyless tile providers usable with
// OpenStreetMap data, plus Esri World Imagery for satellite.
export interface TileLayerOption {
  id: string
  label: string
  url: string
  attribution: string
  maxZoom?: number
}

export const TILE_LAYERS: TileLayerOption[] = [
  {
    id: 'standard',
    label: 'Estándar',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  },
  {
    id: 'humanitarian',
    label: 'Humanitario',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · HOT',
    maxZoom: 19,
  },
  {
    id: 'light',
    label: 'Claro',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20,
  },
  {
    id: 'dark',
    label: 'Oscuro',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20,
  },
  {
    id: 'satellite',
    label: 'Satélite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
    maxZoom: 19,
  },
]

const TILE_STORAGE_KEY = 'mapTileMode'

export function getStoredTileId(): string {
  const stored = localStorage.getItem(TILE_STORAGE_KEY)
  return TILE_LAYERS.some(t => t.id === stored) ? (stored as string) : TILE_LAYERS[0].id
}

export function setStoredTileId(id: string): void {
  localStorage.setItem(TILE_STORAGE_KEY, id)
}
