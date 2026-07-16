import { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { Loader2 } from 'lucide-react'
import { PhotoInputZone } from './PhotoInputZone'

interface Props {
  onClose: () => void
  onUpload: (file: File) => Promise<void>
  isPending: boolean
}

export function PhotoUploadModal({ onClose, onUpload, isPending }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const handleFileSelect = (selected: File | null) => {
    setFile(selected)
    if (selected) {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(URL.createObjectURL(selected))
    } else {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (file) {
      setError(null)
      try {
        await onUpload(file)
        onClose()
      } catch (err: any) {
        setError(err?.message || 'Error al subir la imagen. Por favor, inténtalo de nuevo.')
      }
    }
  }

  return (
    <Modal title="Cambiar Foto de Ubicación" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <PhotoInputZone
          onFileSelect={handleFileSelect}
          selectedFile={file}
          previewUrl={previewUrl}
          isPending={isPending}
        />

        {error && <p className="text-error text-xs font-semibold">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-fg-secondary border border-app-border rounded-lg hover:bg-app-bg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending || !file}
            className="px-4 py-2 text-sm text-primary-fg bg-primary rounded-lg hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors flex items-center gap-1.5 font-semibold"
          >
            {isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Guardando...
              </>
            ) : (
              'Guardar Foto'
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}
