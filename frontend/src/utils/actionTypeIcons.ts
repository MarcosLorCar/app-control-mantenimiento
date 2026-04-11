import {
  Wrench, Eye, Hammer, Zap, Shield, ClipboardCheck,
  Paintbrush, Trash2, Settings2, AlertTriangle, Droplets,
  Leaf, Flame, Gauge, Plug, Cable, HardHat, Shovel, Lightbulb, Star,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const ICON_OPTIONS = [
  'Wrench', 'Eye', 'Hammer', 'Zap', 'Shield', 'ClipboardCheck',
  'Paintbrush', 'Trash2', 'Settings2', 'AlertTriangle', 'Droplets',
  'Leaf', 'Flame', 'Gauge', 'Plug', 'Cable', 'HardHat', 'Shovel', 'Lightbulb', 'Star',
] as const

export const ICON_MAP: Record<string, LucideIcon> = {
  Wrench, Eye, Hammer, Zap, Shield, ClipboardCheck,
  Paintbrush, Trash2, Settings2, AlertTriangle, Droplets,
  Leaf, Flame, Gauge, Plug, Cable, HardHat, Shovel, Lightbulb, Star,
}

export function getActionTypeIcon(iconName: string | null | undefined): LucideIcon | null {
  if (!iconName) return null
  return ICON_MAP[iconName] ?? null
}
