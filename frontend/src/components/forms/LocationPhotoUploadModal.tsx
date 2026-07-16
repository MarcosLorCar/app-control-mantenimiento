import { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { useUploadLocationPhoto } from '../../hooks/useLocations'
import { Calendar, FileText, Loader2 } from 'lucide-react'
import { PhotoInputZone } from './PhotoInputZone'

interface Props {
  locationId: number
  onClose: () => void
  onSuccess?: () => void
}

export function LocationPhotoUploadModal({ locationId, onClose, onSuccess }: Props) {
  const uploadPhotoMut = useUploadLocationPhoto()
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [takenAt, setTakenAt] = useState(() => new Date().toISOString().slice(0, 10))
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')

  // Cleanup object URL on unmount
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError('Por favor, selecciona una foto.')
      return
    }

    setError('')
    uploadPhotoMut.mutate(
      {
        id: locationId,
        file,
        date: takenAt,
        description: description.trim() || undefined,
      },
      {
        onSuccess: () => {
          if (onSuccess) onSuccess()
          onClose()
        },
        onError: (err: any) => {
          setError(err?.error?.message || 'Error al subir la foto.')
        },
      }
    )
  }

  const inputCls =
    'w-full border border-app-border rounded-lg px-3 py-2 text-sm bg-card text-fg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors'

  return (
    <Modal title="Añadir Foto a la Galería" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-fg-secondary mb-1.5">
            Seleccionar Foto <span className="text-error">*</span>
          </label>
          <PhotoInputZone
            onFileSelect={handleFileSelect}
            selectedFile={file}
            previewUrl={previewUrl}
            isPending={uploadPhotoMut.isPending}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-fg-secondary mb-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-muted" /> Fecha de captura <span className="text-error">*</span>
          </label>
          <input
            type="date"
            required
            value={takenAt}
            onChange={e => setTakenAt(e.target.value)}
            className={inputCls}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-fg-secondary mb-1 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-muted" /> Descripción / Comentarios
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Añade detalles sobre la foto..."
            className={inputCls}
          />
        </div>

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
            disabled={uploadPhotoMut.isPending || !file}
            className="px-4 py-2 text-sm text-primary-fg bg-primary rounded-lg hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors flex items-center gap-1.5 font-semibold"
          >
            {uploadPhotoMut.isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Subiendo...
              </>
            ) : (
              'Subir Foto'
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}
