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
        .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
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
}

