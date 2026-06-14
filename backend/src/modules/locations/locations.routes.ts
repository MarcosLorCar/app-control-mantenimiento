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
}

