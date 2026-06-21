// Curated palette for category colors. Picked to be distinguishable on the map
// and to read well as icon tints over the light card backgrounds.
export const CATEGORY_COLOR_PALETTE = [
  '#2563EB', // blue (default/primary)
  '#0EA5E9', // sky
  '#06B6D4', // cyan
  '#10B981', // emerald
  '#84CC16', // lime
  '#EAB308', // yellow
  '#F59E0B', // amber
  '#F97316', // orange
  '#EF4444', // red
  '#EC4899', // pink
  '#A855F7', // purple
  '#6366F1', // indigo
  '#64748B', // slate
  '#78716C', // stone
] as const

// Fallback when a category has no color set yet (matches the app primary).
export const DEFAULT_CATEGORY_COLOR = '#2563EB'

export function getCategoryColor(color: string | null | undefined): string {
  return color && color.trim() ? color : DEFAULT_CATEGORY_COLOR
}

/**
 * Returns a translucent version of a hex color for use as a tinted background
 * (e.g. behind an icon). `alpha` is 0–1. Falls back gracefully for non-hex input.
 */
export function withAlpha(color: string, alpha: number): string {
  const hex = color.trim()
  if (/^#([0-9a-fA-F]{6})$/.test(hex)) {
    const a = Math.round(Math.min(1, Math.max(0, alpha)) * 255)
      .toString(16)
      .padStart(2, '0')
    return `${hex}${a}`
  }
  return color
}
