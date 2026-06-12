import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface Props {
  src: string
  alt?: string
  onClose: () => void
}

export function ImagePreviewModal({ src, alt, onClose }: Props) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
        aria-label="Cerrar"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Image — stop propagation so clicking image doesn't close */}
      <img
        src={src}
        alt={alt ?? ''}
        onClick={e => e.stopPropagation()}
        className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl"
        style={{ animation: 'fadeScaleIn 0.18s ease' }}
      />

      <style>{`
        @keyframes fadeScaleIn {
          from { opacity: 0; transform: scale(0.93); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>,
    document.body
  )
}
