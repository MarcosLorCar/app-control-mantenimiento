import type { FastifyInstance } from 'fastify'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import { pipeline } from 'stream/promises'
import { CreateLocationSchema, UpdateLocationSchema } from './locations.schema'
import {
  listLocations,
  getLocationDetail,
  createLocation,
  updateLocation,
  softDeleteLocation,
} from './locations.service'

export async function locationsRoutes(app: FastifyInstance) {
  // List locations
  app.get('/', { preHandler: [app.verifyToken] }, async (req, reply) => {
    const query = req.query as { parentId?: string; infraTypeId?: string }
    let parentId: number | null | undefined = undefined
    let infraTypeId: number | undefined = undefined

    if (query.parentId === 'null') {
      parentId = null
    } else if (query.parentId !== undefined) {
      parentId = Number(query.parentId)
    }

    if (query.infraTypeId !== undefined) {
      infraTypeId = Number(query.infraTypeId)
    }

    const data = await listLocations(app.db, { parentId, infraTypeId })
    return reply.send({ data })
  })

  // Create location
  app.post('/', { preHandler: [app.requireWrite] }, async (req, reply) => {
    const parsed = CreateLocationSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } })
    }

    const data = await createLocation(app.db, parsed.data)
    return reply.status(201).send({ data })
  })

  // Get location details
  app.get('/:id', { preHandler: [app.verifyToken] }, async (req, reply) => {
    const id = Number((req.params as { id: string }).id)
    const data = await getLocationDetail(app.db, id)
    if (!data) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Ubicación no encontrada' } })
    }
    return reply.send({ data })
  })

  // Update location
  app.patch('/:id', { preHandler: [app.requireWrite] }, async (req, reply) => {
    const id = Number((req.params as { id: string }).id)
    const existing = await app.db.location.findFirst({ where: { id, deletedAt: null } })
    if (!existing) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Ubicación no encontrada' } })
    }

    const parsed = UpdateLocationSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } })
    }

    try {
      const data = await updateLocation(app.db, id, parsed.data)
      return reply.send({ data })
    } catch (err: any) {
      if (err.code === 'CYCLE_ERROR') {
        return reply.status(400).send({ error: { code: 'CYCLE_ERROR', message: err.message } })
      }
      throw err
    }
  })

  // Delete location (soft delete with bubble-up)
  app.delete('/:id', { preHandler: [app.requireManage] }, async (req, reply) => {
    const id = Number((req.params as { id: string }).id)
    const existing = await app.db.location.findFirst({ where: { id, deletedAt: null } })
    if (!existing) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Ubicación no encontrada' } })
    }

    await softDeleteLocation(app.db, id)
    return reply.status(204).send()
  })

  // Upload photo for location
  app.post('/:id/image', { preHandler: [app.requireWrite] }, async (req, reply) => {
    const id = Number((req.params as { id: string }).id)
    const existing = await app.db.location.findFirst({ where: { id, deletedAt: null } })
    if (!existing) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Ubicación no encontrada' } })
    }

    const fileData = await req.file()
    if (!fileData) {
      return reply.status(400).send({ error: { code: 'MISSING_FILE', message: 'No se recibió ningún archivo' } })
    }

    const buffer = await fileData.toBuffer()
    const filename = `location_${id}_${Date.now()}.webp`
    const uploadDir = path.join(process.cwd(), 'uploads')

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    const targetPath = path.join(uploadDir, filename)

    try {
      await sharp(buffer)
        .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(targetPath)
    } catch (err: any) {
      return reply.status(400).send({
        error: {
          code: 'INVALID_IMAGE',
          message: 'El archivo subido no es una imagen válida o está dañado.'
        }
      })
    }

    const imageUrl = `/uploads/${filename}`
    await app.db.location.update({
      where: { id },
      data: { image: imageUrl }
    })

    const data = await getLocationDetail(app.db, id)
    return reply.send({ data })
  })

  // Delete photo for location
  app.delete('/:id/image', { preHandler: [app.requireWrite] }, async (req, reply) => {
    const id = Number((req.params as { id: string }).id)
    const existing = await app.db.location.findFirst({ where: { id, deletedAt: null } })
    if (!existing) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Ubicación no encontrada' } })
    }

    if (existing.image) {
      // Extract file name
      const filename = path.basename(existing.image)
      const filePath = path.join(process.cwd(), 'uploads', filename)
      try {
        if (fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath)
        }
      } catch (err) {
        app.log.error(err)
      }
    }

    await app.db.location.update({
      where: { id },
      data: { image: null }
    })

    const data = await getLocationDetail(app.db, id)
    return reply.send({ data })
  })

  // Get gallery for a location and all its descendants recursively
  app.get('/:id/gallery', { preHandler: [app.verifyToken] }, async (req, reply) => {
    const id = Number((req.params as { id: string }).id)
    const current = await app.db.location.findFirst({ where: { id, deletedAt: null } })
    if (!current) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Ubicación no encontrada' } })
    }

    const locations = await app.db.location.findMany({
      where: {
        path: { startsWith: current.path },
        deletedAt: null,
      },
      select: { id: true }
    })
    const locationIds = locations.map(l => l.id)

    const photos = await app.db.locationPhoto.findMany({
      where: {
        locationId: { in: locationIds }
      },
      include: {
        action: {
          select: {
            id: true,
            title: true,
            performedAt: true,
          }
        }
      },
      orderBy: {
        takenAt: 'desc'
      }
    })

    return reply.send({ data: photos })
  })

  // Upload photo to location gallery
  app.post('/:id/gallery', { preHandler: [app.requireWrite] }, async (req, reply) => {
    const id = Number((req.params as { id: string }).id)
    const existing = await app.db.location.findFirst({ where: { id, deletedAt: null } })
    if (!existing) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Ubicación no encontrada' } })
    }

    const fileData = await req.file()
    if (!fileData) {
      return reply.status(400).send({ error: { code: 'MISSING_FILE', message: 'No se recibió ningún archivo' } })
    }

    const description = (fileData.fields?.description as any)?.value || null
    const takenAtVal = (fileData.fields?.takenAt as any)?.value
    const takenAt = takenAtVal ? new Date(takenAtVal) : new Date()

    const buffer = await fileData.toBuffer()
    const filename = `gallery_${id}_${Date.now()}.webp`
    const uploadDir = path.join(process.cwd(), 'uploads')

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    const targetPath = path.join(uploadDir, filename)

    try {
      await sharp(buffer)
        .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(targetPath)
    } catch (err: any) {
      return reply.status(400).send({
        error: {
          code: 'INVALID_IMAGE',
          message: 'El archivo subido no es una imagen válida o está dañado.'
        }
      })
    }

    const imageUrl = `/uploads/${filename}`

    const photo = await app.db.locationPhoto.create({
      data: {
        url: imageUrl,
        description,
        takenAt,
        locationId: id,
      }
    })

    return reply.status(201).send({ data: photo })
  })

  // Delete photo from gallery
  app.delete('/gallery/:photoId', { preHandler: [app.requireWrite] }, async (req, reply) => {
    const photoId = Number((req.params as { photoId: string }).photoId)
    const photo = await app.db.locationPhoto.findFirst({ where: { id: photoId } })
    if (!photo) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Foto no encontrada' } })
    }

    const filename = path.basename(photo.url)
    const filePath = path.join(process.cwd(), 'uploads', filename)
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath)
      }
    } catch (err) {
      app.log.error(err)
    }

    await app.db.locationPhoto.delete({ where: { id: photoId } })

    return reply.status(204).send()
  })

  // Start recalculation of addresses in the background
  app.post('/recalc-addresses', { preHandler: [app.requireWrite] }, async (req, reply) => {
    if (recalcProgress.running) {
      return reply.status(400).send({ error: { code: 'ALREADY_RUNNING', message: 'El proceso ya está en ejecución' } })
    }

    // Start background process
    void runRecalcBackground(app.db)

    return reply.status(202).send({ data: recalcProgress })
  })

  // Get recalculation progress
  app.get('/recalc-addresses/status', { preHandler: [app.verifyToken] }, async (req, reply) => {
    return reply.send({ data: recalcProgress })
  })
}

// Module-level scope for background recalculation state
export interface RecalcProgress {
  running: boolean
  done: number
  total: number
  failed: number
  finished: boolean
}

let recalcProgress: RecalcProgress = {
  running: false,
  done: 0,
  total: 0,
  failed: 0,
  finished: false,
}

function clean(v: string | null | undefined): string | null {
  const t = (v ?? '').trim()
  return t.length ? t : null
}

function normalizeAddressParts(parts: {
  addrStreet?: string | null
  addrHouseNumber?: string | null
  addrCity?: string | null
  addrPostcode?: string | null
  addrProvince?: string | null
}) {
  return {
    addrStreet: clean(parts.addrStreet),
    addrHouseNumber: clean(parts.addrHouseNumber),
    addrCity: clean(parts.addrCity),
    addrPostcode: clean(parts.addrPostcode),
    addrProvince: clean(parts.addrProvince),
  }
}

function buildFormattedAddress(parts: {
  addrStreet?: string | null
  addrHouseNumber?: string | null
  addrCity?: string | null
  addrPostcode?: string | null
  addrProvince?: string | null
}): string | null {
  const p = normalizeAddressParts(parts)
  const street = p.addrStreet
    ? p.addrHouseNumber
      ? `${p.addrStreet} ${p.addrHouseNumber}`
      : p.addrStreet
    : null
  const cityLine = [p.addrPostcode, p.addrCity].filter(Boolean).join(' ') || null
  const segments = [street, cityLine, p.addrProvince].filter(Boolean)
  return segments.length ? segments.join(', ') : null
}

async function reverseGeocode(lat: number, lng: number) {
  const fallback = {
    addrStreet: null,
    addrHouseNumber: null,
    addrCity: null,
    addrPostcode: null,
    addrProvince: null,
    formattedAddress: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    placeId: null,
  }
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=es&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'Infragest/1.0.0 (contact: support@infragest.local)',
        }
      }
    )
    if (!res.ok) return fallback
    const data: any = await res.json()
    const a = data.address ?? {}

    const parts = {
      addrStreet: a.road || a.pedestrian || a.footway || null,
      addrHouseNumber: a.house_number || null,
      addrCity: a.city || a.town || a.village || a.municipality || a.county || null,
      addrPostcode: a.postcode || null,
      addrProvince: a.province || a.state || null,
    }

    const formattedAddress =
      buildFormattedAddress(parts) ?? data.display_name ?? fallback.formattedAddress

    return {
      ...parts,
      formattedAddress,
      placeId: data.place_id ? String(data.place_id) : null,
    }
  } catch {
    return fallback
  }
}

async function runRecalcBackground(db: any) {
  recalcProgress = {
    running: true,
    done: 0,
    total: 0,
    failed: 0,
    finished: false,
  }

  try {
    const geo = await db.location.findMany({
      where: {
        deletedAt: null,
        latitude: { not: null },
        longitude: { not: null },
      }
    })

    recalcProgress.total = geo.length
    if (geo.length === 0) {
      recalcProgress.running = false
      recalcProgress.finished = true
      return
    }

    for (let i = 0; i < geo.length; i++) {
      const loc = geo[i]
      try {
        const r = await reverseGeocode(Number(loc.latitude), Number(loc.longitude))
        await db.location.update({
          where: { id: loc.id },
          data: {
            formattedAddress: r.formattedAddress,
            placeId: r.placeId,
            addrStreet: r.addrStreet,
            addrHouseNumber: r.addrHouseNumber,
            addrCity: r.addrCity,
            addrPostcode: r.addrPostcode,
            addrProvince: r.addrProvince,
          }
        })
      } catch (err) {
        recalcProgress.failed++
      }
      recalcProgress.done = i + 1
      if (i < geo.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1100))
      }
    }
  } catch (err) {
    // Suppress background errors
  } finally {
    recalcProgress.running = false
    recalcProgress.finished = true
  }
}

