import { useState, useEffect, useRef } from 'react'
import { Modal } from '../ui/Modal'
import { Camera, UploadCloud, Clipboard, X, Loader2 } from 'lucide-react'

interface Props {
  onClose: () => void
  onUpload: (file: File) => Promise<void>
  isPending: boolean
}

export function PhotoUploadModal({ onClose, onUpload, isPending }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Global paste event listener while the modal is open
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      // Ignore if user is typing in inputs or textareas
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return

      const items = Array.from(e.clipboardData?.items ?? [])
      const imageItem = items.find(item => item.type.startsWith('image/'))
      if (!imageItem) {
        setError('No se encontró ninguna imagen en el portapapeles. Asegúrate de tener una imagen copiada.')
        return
      }

      const file = imageItem.getAsFile()
      if (file) {
        handleFileSelect(file)
      }
    }

    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [])

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecciona un archivo de imagen válido.')
      return
    }
    setError(null)
    try {
      await onUpload(file)
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Error al subir la imagen. Por favor, inténtalo de nuevo.')
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const handlePasteFromClipboardButton = async () => {
    setError(null)
    try {
      if (!navigator.clipboard || !navigator.clipboard.read) {
        setError('Tu navegador no soporta la lectura directa del portapapeles. Prueba presionando Ctrl+V en su lugar.')
        return
      }

      const items = await navigator.clipboard.read()
      for (const item of items) {
        const imageType = item.types.find(type => type.startsWith('image/'))
        if (imageType) {
          const blob = await item.getType(imageType)
          const file = new File([blob], 'photo_clipboard.png', { type: imageType })
          await handleFileSelect(file)
          return
        }
      }
      setError('No se encontró ninguna imagen en el portapapeles. Copia una imagen e inténtalo de nuevo.')
    } catch (err: any) {
      console.error('Failed to read clipboard: ', err)
      setError(
        'No se pudo acceder al portapapeles. Asegúrate de otorgar los permisos necesarios o presiona Ctrl+V para pegar.'
      )
    }
  }

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  return (
    <Modal title="Cambiar Foto de Ubicación" onClose={onClose}>
      <div className="space-y-4">
        {/* Drag/Drop and Information Box */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all ${
            isDragOver
              ? 'border-primary bg-primary/5 scale-[1.01]'
              : 'border-app-border bg-app-bg/10 hover:bg-app-bg/25'
          }`}
        >
          {isPending ? (
            <div className="flex flex-col items-center py-4">
              <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
              <p className="text-sm font-semibold text-fg">Subiendo imagen...</p>
            </div>
          ) : (
            <>
              <UploadCloud className="w-12 h-12 text-muted mb-3 animate-pulse" />
              <p className="text-sm font-bold text-fg mb-1">Arrastra y suelta tu foto aquí</p>
              <p className="text-xs text-muted max-w-[260px] leading-relaxed">
                O presiona <kbd className="px-1.5 py-0.5 rounded bg-card border border-app-border text-[10px] font-mono shadow-sm">Ctrl + V</kbd> en cualquier parte para pegar la imagen de tu portapapeles.
              </p>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3.5">
          <button
            type="button"
            onClick={triggerFileInput}
            disabled={isPending}
            className="flex flex-col items-center justify-center p-4 border border-app-border bg-card rounded-xl hover:bg-app-bg hover:border-primary/40 active:scale-95 transition-all text-center gap-2 group shadow-sm disabled:opacity-50"
          >
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:bg-primary/20 transition-all">
              <Camera className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-fg">Subir desde dispositivo</span>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileInputChange}
            />
          </button>

          <button
            type="button"
            onClick={handlePasteFromClipboardButton}
            disabled={isPending}
            className="flex flex-col items-center justify-center p-4 border border-app-border bg-card rounded-xl hover:bg-app-bg hover:border-primary/40 active:scale-95 transition-all text-center gap-2 group shadow-sm disabled:opacity-50"
          >
            <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-600 group-hover:bg-emerald-500/20 transition-all">
              <Clipboard className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-fg">Pegar Portapapeles</span>
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-start gap-2 p-3 border border-rose-200 bg-rose-50 rounded-lg text-xs text-rose-600 animate-fade-in">
            <X
              className="w-4 h-4 shrink-0 cursor-pointer hover:bg-rose-100 rounded p-0.5"
              onClick={() => setError(null)}
            />
            <span className="font-medium">{error}</span>
          </div>
        )}
      </div>
    </Modal>
  )
}
