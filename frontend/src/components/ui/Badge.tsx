// frontend/src/components/ui/Badge.tsx
const colors: Record<string, string> = {
  active:      'bg-green-100 text-green-800',
  inactive:    'bg-gray-100 text-gray-600',
  maintenance: 'bg-yellow-100 text-yellow-800',
}

export function Badge({ label }: { label: string }) {
  const cls = colors[label] ?? 'bg-blue-50 text-blue-700'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      {label}
    </span>
  )
}
