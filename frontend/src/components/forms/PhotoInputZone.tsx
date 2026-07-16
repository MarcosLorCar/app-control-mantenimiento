import { useState, useEffect, useRef } from 'react'
import { Camera, UploadCloud, Clipboard, Loader2 } from 'lucide-react'

interface Props {
  onFileSelect: (file: File | null) => void
  selectedFile: File | null
  previewUrl: string | null
  isPending?: boolean
}

export function PhotoInputZone({ onFileSelect, selectedFile, previewUrl, isPending }: Props) {
  const [isMobile, setIsMobile] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [cameraLoading, setCameraLoading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Detect device type
  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
    const isMobileOS = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
    const isIPad = navigator.maxTouchPoints > 0 && /Macintosh/.test(userAgent)
    setIsMobile(isMobileOS || isIPad)
  }, [])

  // Camera cleanup on unmount or stream change
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [cameraStream])

  // Global paste handler for PC
  useEffect(() => {
    if (isMobile) return

    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return

      const items = Array.from(e.clipboardData?.items ?? [])
      const imageItem = items.find(item => item.type.startsWith('image/'))
      if (imageItem) {
        const file = imageItem.getAsFile()
        if (file) {
          onFileSelect(file)
        }
      }
    }

    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [isMobile, onFileSelect])

  // Start WebRTC in-line camera stream
  const startCamera = async () => {
    setCameraActive(true)
    setCameraLoading(true)
    setCameraError(null)

    try {
      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        })
      } catch (err) {
        // Fallback to any camera if environment (rear camera) fails
        stream = await navigator.mediaDevices.getUserMedia({ video: true })
      }

      setCameraStream(stream)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err: any) {
      console.error('Error starting camera:', err)
      setCameraError('No se pudo acceder a la cámara. Asegúrate de otorgar los permisos necesarios.')
    } finally {
      setCameraLoading(false)
    }
  }

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
    }
    setCameraActive(false)
  }

  const capturePhoto = () => {
    if (!videoRef.current) return

    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || video.clientWidth
    canvas.height = video.videoHeight || video.clientHeight

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((blob) => {
        if (blob) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
          const filename = `infragest_photo_${timestamp}.jpg`
          const file = new File([blob], filename, { type: 'image/jpeg' })

          // 1. Save to phone gallery (programmatic download)
          const downloadUrl = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = downloadUrl
          a.download = filename
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(downloadUrl)

          // 2. Select file
          onFileSelect(file)
          stopCamera()
        }
      }, 'image/jpeg', 0.9)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    if (file && file.type.startsWith('image/')) {
      onFileSelect(file)
    }
  }

  const handlePasteFromClipboard = async () => {
    if (!navigator.clipboard || !navigator.clipboard.read) return
    try {
      const items = await navigator.clipboard.read()
      for (const item of items) {
        const imageType = item.types.find(type => type.startsWith('image/'))
        if (imageType) {
          const blob = await item.getType(imageType)
          const file = new File([blob], 'photo_clipboard.png', { type: imageType })
          onFileSelect(file)
          return
        }
      }
    } catch (err) {
      console.error('Failed to read clipboard: ', err)
    }
  }

  // Drag & Drop Handlers
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
    if (file && file.type.startsWith('image/')) {
      onFileSelect(file)
    }
  }

  // --- RENDERING ---

  // Preview Mode: Image already selected
  if (selectedFile && previewUrl) {
    return (
      <div className="border border-app-border bg-app-bg/15 rounded-xl p-4 flex flex-col items-center gap-3 relative animate-fade-in animate-duration-200">
        <div className="w-full max-h-[180px] rounded-lg overflow-hidden border border-app-border bg-black/5 flex items-center justify-center">
          <img
            src={previewUrl}
            alt="Vista previa"
            className="max-w-full max-h-[180px] object-contain shadow-sm"
          />
        </div>
        <div className="w-full text-center">
          <p className="text-xs font-bold text-fg truncate px-2" title={selectedFile.name}>
            {selectedFile.name}
          </p>
          <p className="text-[10px] text-muted font-mono mt-0.5">
            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
        <div className="flex gap-2 w-full justify-center">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isPending}
            className="flex items-center gap-1 px-3.5 py-1.5 border border-app-border bg-card hover:bg-app-bg text-fg-secondary hover:text-fg rounded-lg text-xs font-semibold cursor-pointer transition-all active:scale-95 shadow-sm disabled:opacity-50"
          >
            Cambiar Foto
          </button>
          <button
            type="button"
            onClick={() => onFileSelect(null)}
            disabled={isPending}
            className="flex items-center gap-1 px-3.5 py-1.5 border border-error/25 bg-error/10 hover:bg-error/20 text-error rounded-lg text-xs font-semibold transition-all active:scale-95 shadow-sm disabled:opacity-50"
          >
            Quitar
          </button>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleFileInputChange}
        />
      </div>
    )
  }

  // Camera Mode: In-line camera streaming
  if (cameraActive) {
    return (
      <div className="border border-app-border bg-black rounded-xl overflow-hidden flex flex-col items-center justify-center relative min-h-[220px]">
        {cameraLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 text-white gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-xs font-semibold">Iniciando cámara...</span>
          </div>
        )}
        {cameraError ? (
          <div className="p-6 text-center text-white flex flex-col items-center gap-3">
            <p className="text-xs text-rose-400 font-semibold">{cameraError}</p>
            <button
              type="button"
              onClick={stopCamera}
              className="px-4 py-1.5 bg-card hover:bg-app-bg text-fg rounded-lg text-xs font-semibold transition-all active:scale-95"
            >
              Cerrar Cámara
            </button>
          </div>
        ) : (
          <div className="relative w-full aspect-video flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {/* Viewfinder helper */}
            <div className="absolute inset-4 border border-white/20 pointer-events-none rounded-lg flex items-center justify-center">
              <div className="w-8 h-8 border-t-2 border-l-2 border-white/55 absolute top-0 left-0 rounded-tl"></div>
              <div className="w-8 h-8 border-t-2 border-r-2 border-white/55 absolute top-0 right-0 rounded-tr"></div>
              <div className="w-8 h-8 border-b-2 border-l-2 border-white/55 absolute bottom-0 left-0 rounded-bl"></div>
              <div className="w-8 h-8 border-b-2 border-r-2 border-white/55 absolute bottom-0 right-0 rounded-br"></div>
            </div>
            {/* Controls */}
            <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-6 z-10">
              <button
                type="button"
                onClick={stopCamera}
                className="px-4 py-2 bg-black/60 hover:bg-black/80 border border-white/20 text-white rounded-lg text-xs font-semibold transition-all active:scale-95"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={capturePhoto}
                className="w-12 h-12 rounded-full bg-rose-600 border-4 border-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg cursor-pointer"
                title="Capturar foto"
              />
            </div>
          </div>
        )}
      </div>
    )
  }

  // Selection Mode: Mobile
  if (isMobile) {
    return (
      <div className="flex flex-col items-center justify-center border-2 border-dashed border-app-border rounded-xl p-8 bg-app-bg/10 text-center gap-4">
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleFileInputChange}
        />
        <div className="text-center space-y-1">
          <UploadCloud className="w-10 h-10 text-muted mx-auto" />
          <p className="text-xs font-semibold text-fg">Adjuntar Foto</p>
          <p className="text-[10px] text-muted">Haz una foto en directo o selecciónala de tu galería</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2.5 w-full justify-center">
          <button
            type="button"
            onClick={startCamera}
            disabled={isPending}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-primary text-primary-fg hover:bg-[var(--primary-hover)] rounded-lg text-xs font-semibold cursor-pointer transition-all active:scale-95 shadow-sm disabled:opacity-50"
          >
            <Camera className="w-4 h-4" /> Hacer Foto (Cámara)
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isPending}
            className="flex items-center justify-center gap-1.5 px-4 py-2 border border-app-border bg-card hover:bg-app-bg text-fg-secondary hover:text-fg rounded-lg text-xs font-semibold cursor-pointer transition-all active:scale-95 shadow-sm disabled:opacity-50"
          >
            <UploadCloud className="w-4 h-4" /> Seleccionar Galería
          </button>
        </div>
      </div>
    )
  }

  // Selection Mode: PC
  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleFileInputChange}
      />
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
          isDragOver
            ? 'border-primary bg-primary/5 scale-[1.01]'
            : 'border-app-border bg-app-bg/10 hover:bg-app-bg/25'
        }`}
      >
        <UploadCloud className="w-12 h-12 text-muted mb-3 animate-pulse" />
        <p className="text-sm font-bold text-fg mb-1">Arrastra y suelta tu foto aquí o haz clic</p>
        <p className="text-xs text-muted max-w-[260px] leading-relaxed">
          O presiona <kbd className="px-1.5 py-0.5 rounded bg-card border border-app-border text-[10px] font-mono shadow-sm">Ctrl + V</kbd> para pegar desde el portapapeles.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isPending}
          className="flex flex-col items-center justify-center p-4 border border-app-border bg-card rounded-xl hover:bg-app-bg hover:border-primary/40 active:scale-95 transition-all text-center gap-2 group shadow-sm disabled:opacity-50"
        >
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:bg-primary/20 transition-all">
            <Camera className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-fg">Examinar Archivos</span>
        </button>

        <button
          type="button"
          onClick={handlePasteFromClipboard}
          disabled={isPending}
          className="flex flex-col items-center justify-center p-4 border border-app-border bg-card rounded-xl hover:bg-app-bg hover:border-primary/40 active:scale-95 transition-all text-center gap-2 group shadow-sm disabled:opacity-50"
        >
          <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-600 group-hover:bg-emerald-500/20 transition-all">
            <Clipboard className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-fg">Pegar Portapapeles</span>
        </button>
      </div>
    </div>
  )
}
