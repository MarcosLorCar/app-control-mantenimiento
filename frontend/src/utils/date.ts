import { format, formatDistanceStrict, isToday, isYesterday } from 'date-fns'
import { es } from 'date-fns/locale'

export function formatDate(iso: string): string {
  return format(new Date(iso), 'dd/MM/yyyy')
}

export function formatRelativeTime(iso: string): string {
  const date = new Date(iso)
  if (isToday(date)) return 'Hoy'
  if (isYesterday(date)) return 'Ayer'
  const text = formatDistanceStrict(date, new Date(), {
    unit: 'day',
    addSuffix: true,
    locale: es,
    roundingMethod: 'floor',
  })
  return text.charAt(0).toUpperCase() + text.slice(1)
}
