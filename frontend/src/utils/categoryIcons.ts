import {
  Building2,
  Droplet,
  GraduationCap,
  School,
  Warehouse,
  Home,
  MapPin,
  Landmark,
  Folder,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  Building2,
  Droplet,
  GraduationCap,
  School,
  Warehouse,
  Home,
  MapPin,
  Landmark,
  Folder,
}

export const CATEGORY_ICON_OPTIONS = [
  { name: 'Building2', label: 'Edificio Municipal' },
  { name: 'Droplet', label: 'Fuente / Agua' },
  { name: 'GraduationCap', label: 'Colegio / Educación' },
  { name: 'School', label: 'Escuela' },
  { name: 'Warehouse', label: 'Almacén / Depósito' },
  { name: 'Home', label: 'Sede' },
  { name: 'MapPin', label: 'Ubicación' },
  { name: 'Landmark', label: 'Monumento' },
  { name: 'Folder', label: 'Carpeta' },
] as const

export function getCategoryIcon(iconName: string | null | undefined): LucideIcon {
  if (!iconName) return Folder
  return CATEGORY_ICON_MAP[iconName] ?? Folder
}
