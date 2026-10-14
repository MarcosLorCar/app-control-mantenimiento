export interface CompressImageOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
}

/**
 * Resizes and compresses an image client-side to prevent massive uploads (>10MB)
 * and dramatically speed up network transfers on mobile devices.
 */
export async function compressImage(
  file: File,
  options: CompressImageOptions = {}
): Promise<File> {
  const { maxWidth = 1920, maxHeight = 1920, quality = 0.85 } = options

  // Only compress standard raster images
  if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return file
  }

  return new Promise((resolve) => {
    const img = document.createElement('img')
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      let { width, height } = img

      // Check if image already fits within dimensions and is reasonably small (<1MB)
      if (width <= maxWidth && height <= maxHeight && file.size < 1024 * 1024) {
        resolve(file)
        return
      }

      // Calculate scaled dimensions
      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        } else {
          width = Math.round((width * maxHeight) / height)
          height = maxHeight
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(file)
        return
      }

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, width, height)

      // Use JPEG for maximum compatibility and compression
      const outputType = 'image/jpeg'
      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            // If compression didn't help (rare), return original
            resolve(file)
            return
          }

          const baseName = file.name.replace(/\.[^/.]+$/, '')
          const compressedFile = new File([blob], `${baseName}.jpg`, {
            type: outputType,
            lastModified: Date.now(),
          })
          resolve(compressedFile)
        },
        outputType,
        quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      // Fallback to original file on decode error
      resolve(file)
    }

    img.src = objectUrl
  })
}
