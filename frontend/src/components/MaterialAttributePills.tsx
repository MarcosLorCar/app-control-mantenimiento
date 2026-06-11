import type { Material } from '../api/types'

interface MaterialProps {
  attributes?: Record<string, any> | null
  type?: {
    categories?: {
      code: string
      name: string
      unit: string | null
    }[] | null
  } | null
}

export function MaterialAttributePills({ material }: { material: MaterialProps }) {
  if (!material.attributes || Object.keys(material.attributes).length === 0) return null
  
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {Object.entries(material.attributes).map(([key, val]) => {
        if (val === null || val === undefined || val === '') return null
        
        const cat = material.type?.categories?.find((c: any) => c.code === key)
        
        let displayVal = String(val)
        if (typeof val === 'boolean') {
          displayVal = val ? 'Sí' : 'No'
        }
        
        const label = cat 
          ? `${cat.name}: ${displayVal}${cat.unit ? ` ${cat.unit}` : ''}`
          : `${key}: ${displayVal}`
          
        return (
          <span 
            key={key} 
            className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-app-bg text-fg-secondary border border-app-border"
          >
            {label}
          </span>
        )
      })}
    </div>
  )
}
