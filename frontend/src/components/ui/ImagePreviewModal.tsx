import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Modal } from './Modal'
import { RoleGuard } from '../RoleGuard'
import { Calendar, FileText, Trash2, ExternalLink, ZoomIn, ZoomOut } from 'lucide-react'

interface Props {
  src: string
  alt?: string
  onClose: () => void
  description?: string | null
  date?: string
  actionId?: number | null
  onDelete?: () => void
}

export function ImagePreviewModal({
  src,
  alt,
  onClose,
  description,
  date,
  actionId,
  onDelete
}: Props) {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [touchStartDist, setTouchStartDist] = useState<number | null>(null)
  
  // Track click/tap duration to distinguish drag vs click
  const [startTime, setStartTime] = useState(0)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleDeleteClick = () => {
    if (confirm('¿Seguro que deseas eliminar esta foto permanentemente?')) {
      if (onDelete) onDelete()
    }
  }

  const getDistance = (
    t1: { clientX: number; clientY: number },
    t2: { clientX: number; clientY: number }
  ) => {
    return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY)
  }

  const handleDragStart = (clientX: number, clientY: number) => {
    setStartTime(Date.now())
    setStartPos({ x: clientX, y: clientY })
    
    if (scale > 1) {
      setIsDragging(true)
      setDragStart({
        x: clientX - position.x,
        y: clientY - position.y
      })
    }
  }

  const handleDragMove = (clientX: number, clientY: number) => {
    if (isDragging && scale > 1) {
      const maxDragX = (window.innerWidth * scale) / 2
      const maxDragY = (window.innerHeight * scale) / 2
      const x = Math.min(Math.max(clientX - dragStart.x, -maxDragX), maxDragX)
      const y = Math.min(Math.max(clientY - dragStart.y, -maxDragY), maxDragY)
      setPosition({ x, y })
    }
  }

  const handleDragEnd = (clientX: number, clientY: number) => {
    setIsDragging(false)
    const elapsed = Date.now() - startTime
    const dist = Math.hypot(clientX - startPos.x, clientY - startPos.y)

    // Quick tap or click (less than 250ms and minimal movement) toggles 2.5x zoom
    if (elapsed < 250 && dist < 6) {
      toggleZoom()
    }
  }

  const toggleZoom = () => {
    if (scale > 1) {
      setScale(1)
      setPosition({ x: 0, y: 0 })
    } else {
      setScale(2.5)
      setPosition({ x: 0, y: 0 })
    }
  }

  // Touch specific handlers for Pinch-to-Zoom and Pan
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      handleDragStart(e.touches[0].clientX, e.touches[0].clientY)
    } else if (e.touches.length === 2) {
      setIsDragging(false)
      const dist = getDistance(e.touches[0], e.touches[1])
      setTouchStartDist(dist)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      handleDragMove(e.touches[0].clientX, e.touches[0].clientY)
    } else if (e.touches.length === 2 && touchStartDist !== null) {
      const dist = getDistance(e.touches[0], e.touches[1])
      const factor = dist / touchStartDist
      const newScale = Math.min(Math.max(scale * factor, 1), 4.5)
      setScale(newScale)
      setTouchStartDist(dist)
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    setTouchStartDist(null)
    setIsDragging(false)
    
    // Check if we need to handle tap
    if (e.changedTouches.length === 1) {
      handleDragEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY)
    }

    // Reset position if zoomed out close to 1x
    if (scale <= 1.05) {
      setScale(1)
      setPosition({ x: 0, y: 0 })
    }
  }

  return (
    <Modal title={alt || 'Detalles de Imagen'} onClose={onClose} size="2xl">
      <div className="space-y-4 flex flex-col">
        {/* Image Viewer Wrapper */}
        <div className="relative w-full h-[320px] md:h-[450px] flex flex-col shrink-0">
          {/* Scroll-hidden Viewport for Gesture Zoom/Pan */}
          <div className="w-full h-full overflow-hidden border border-app-border rounded-lg bg-app-bg/25 flex items-center justify-center p-2 relative select-none">
            <img
              src={src}
              alt={alt || 'Imagen'}
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transition: isDragging ? 'none' : 'transform 0.15s ease-out'
              }}
              className="max-w-full max-h-full object-contain cursor-grab active:cursor-grabbing touch-none select-none rounded-md"
              onMouseDown={e => {
                e.preventDefault()
                handleDragStart(e.clientX, e.clientY)
              }}
              onMouseMove={e => {
                handleDragMove(e.clientX, e.clientY)
              }}
              onMouseUp={e => {
                handleDragEnd(e.clientX, e.clientY)
              }}
              onMouseLeave={() => setIsDragging(false)}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />
          </div>
          {/* Zoom Indicator Badge (Fixed position) */}
          <button 
            type="button"
            onClick={toggleZoom}
            className="absolute bottom-3 right-3 p-1.5 rounded-lg bg-black/60 hover:bg-black/85 text-white transition-all shadow border border-white/10 z-10 flex items-center justify-center active:scale-95"
            title={scale > 1 ? "Reducir zoom" : "Ampliar zoom"}
          >
            {scale > 1 ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
          </button>
        </div>

        {/* Metadata info */}
        {(date || description) && (
          <div className="p-3 bg-app-bg/50 border border-app-border rounded-lg space-y-2 text-xs text-fg-secondary">
            {description && (
              <p className="flex items-start gap-1.5 leading-relaxed">
                <FileText className="w-4 h-4 text-muted shrink-0 mt-0.5" />
                <span>{description}</span>
              </p>
            )}
            {date && (
              <p className="flex items-center gap-1.5 text-muted">
                <Calendar className="w-3.5 h-3.5 text-muted shrink-0" />
                <span>Capturada el: <strong>{new Date(date).toLocaleDateString()}</strong></span>
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end items-center gap-3 pt-2 shrink-0 border-t border-app-border/40">
          {actionId && (
            <Link
              to={`/actions/${actionId}`}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ver Trabajo</span>
            </Link>
          )}
          {onDelete && (
            <RoleGuard require="write">
              <button
                type="button"
                onClick={handleDeleteClick}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-error bg-error/10 hover:bg-error/20 border border-error/25 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar</span>
              </button>
            </RoleGuard>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-fg-secondary border border-app-border rounded-lg hover:bg-app-bg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  )
}
