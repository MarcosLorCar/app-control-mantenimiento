import { useState, useEffect, useRef } from 'react'
import { Modal } from '../ui/Modal'
import { useUploadLocationPhoto } from '../../hooks/useLocations'
import { UploadCloud, Calendar, FileText, Loader2, Camera } from 'lucide-react'

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
  const [isMobile, setIsMobile] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)

  const cameraInputRef = useRef<HTMLInputElement>(null)
  const archiveInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
    const isMobileOS = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
    const isIPad = navigator.maxTouchPoints > 0 && /Macintosh/.test(userAgent)
    setIsMobile(isMobileOS || isIPad)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null
    setFile(selected)
    if (selected) {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(URL.createObjectURL(selected))
    } else {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  // Cleanup object URL to avoid memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

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
    const selected = e.dataTransfer.files?.[0] || null
    if (selected) {
      if (selected.type.startsWith('image/')) {
        setError('')
        setFile(selected)
        if (previewUrl) URL.revokeObjectURL(previewUrl)
        setPreviewUrl(URL.createObjectURL(selected))
      } else {
        setError('Por favor, selecciona un archivo de imagen válido.')
      }
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
        {/* Hidden File Inputs */}
        <input
          type="file"
          ref={cameraInputRef}
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          type="file"
          ref={archiveInputRef}
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <div>
          <label className="block text-xs font-semibold text-fg-secondary mb-1.5">
            Seleccionar Foto <span className="text-error">*</span>
          </label>
          
          {!file ? (
            !isMobile ? (
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => archiveInputRef.current?.click()}
                className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer group ${
                  isDragOver
                    ? 'border-primary bg-primary/5 scale-[1.01]'
                    : 'border-app-border bg-app-bg/10 hover:bg-app-bg/25'
                }`}
              >
                <UploadCloud className="w-10 h-10 text-muted mb-3 group-hover:text-primary transition-colors" />
                <p className="text-xs font-bold text-fg mb-1">Haz clic para seleccionar o arrastra una foto</p>
                <p className="text-[10px] text-muted">Formatos aceptados: PNG, JPG, WEBP</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-app-border rounded-xl p-8 bg-app-bg/10 text-center relative gap-4">
                <div className="text-center space-y-1">
                  <UploadCloud className="w-10 h-10 text-muted mx-auto" />
                  <p className="text-xs font-semibold text-fg">Añade una foto a la galería de esta infraestructura</p>
                  <p className="text-[10px] text-muted">Toma una foto en directo o elígela de tus archivos</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2.5 w-full justify-center">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 bg-primary text-primary-fg hover:bg-[var(--primary-hover)] rounded-lg text-xs font-semibold cursor-pointer transition-all active:scale-95 shadow-sm"
                  >
                    <Camera className="w-4 h-4" /> Hacer Foto (Cámara)
                  </button>
                  <button
                    type="button"
                    onClick={() => archiveInputRef.current?.click()}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 border border-app-border bg-card hover:bg-app-bg text-fg-secondary hover:text-fg rounded-lg text-xs font-semibold cursor-pointer transition-all active:scale-95 shadow-sm"
                  >
                    <UploadCloud className="w-4 h-4" /> Seleccionar Archivo
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="border border-app-border bg-app-bg/15 rounded-xl p-4 flex flex-col items-center gap-3 relative animate-fade-in">
              {previewUrl && (
                <div className="w-full max-h-[160px] rounded-lg overflow-hidden border border-app-border bg-black/5 flex items-center justify-center">
                  <img
                    src={previewUrl}
                    alt="Vista previa"
                    className="max-w-full max-h-[160px] object-contain shadow-sm"
                  />
                </div>
              )}
              <div className="w-full text-center">
                <p className="text-xs font-bold text-fg truncate px-2" title={file.name}>
                  {file.name}
                </p>
                <p className="text-[10px] text-muted font-mono mt-0.5">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <div className="flex gap-2 w-full justify-center">
                <button
                  type="button"
                  onClick={() => archiveInputRef.current?.click()}
                  className="flex items-center gap-1 px-3.5 py-1.5 border border-app-border bg-card hover:bg-app-bg text-fg-secondary hover:text-fg rounded-lg text-xs font-semibold cursor-pointer transition-all active:scale-95 shadow-sm"
                >
                  Cambiar Foto
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFile(null)
                    if (previewUrl) URL.revokeObjectURL(previewUrl)
                    setPreviewUrl(null)
                  }}
                  className="flex items-center gap-1 px-3.5 py-1.5 border border-error/25 bg-error/10 hover:bg-error/20 text-error rounded-lg text-xs font-semibold transition-all active:scale-95 shadow-sm"
                >
                  Quitar
                </button>
              </div>
            </div>
          )}
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

        {error && <p className="text-error text-xs">{error}</p>}

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
            disabled={uploadPhotoMut.isPending}
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
