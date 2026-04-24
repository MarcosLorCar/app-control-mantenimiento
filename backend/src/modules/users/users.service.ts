import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { PrismaClient } from '@prisma/client'
import { CreateUserBody, UpdateUserBody } from './users.schema'

const SAFE_SELECT = {
  id: true, email: true, fullName: true, isActive: true, mustChangePassword: true,
  createdAt: true, updatedAt: true,
  role: { select: { id: true, name: true, canWrite: true, canManage: true } },
}

export async function listUsers(db: PrismaClient) {
  return db.user.findMany({ select: SAFE_SELECT, orderBy: { createdAt: 'desc' } })
}

export async function getUser(db: PrismaClient, id: number) {
  const user = await db.user.findUnique({ where: { id }, select: SAFE_SELECT })
  if (!user) throw { statusCode: 404, code: 'NOT_FOUND', message: 'Usuario no encontrado' }
  return user
}

export async function createUser(db: PrismaClient, body: CreateUserBody) {
  const existing = await db.user.findFirst({ where: { email: body.email } })
  if (existing) throw { statusCode: 409, code: 'CONFLICT', message: 'El email ya está en uso' }
  const tempPassword = body.password ?? crypto.randomBytes(12).toString('hex')
  const mustChangePassword = !body.password
  const passwordHash = await bcrypt.hash(tempPassword, 10)
  const user = await db.user.create({
    data: { email: body.email, passwordHash, fullName: body.fullName, roleId: body.roleId, mustChangePassword },
    select: SAFE_SELECT,
  })
  return { ...user, tempPassword: mustChangePassword ? tempPassword : undefined }
}

export async function updateUser(db: PrismaClient, id: number, body: UpdateUserBody) {
  await getUser(db, id) // lanza 404 si no existe
  const data: any = { ...body }
  if (body.email) {
    const dup = await db.user.findFirst({ where: { email: body.email, NOT: { id } } })
    if (dup) throw { statusCode: 409, code: 'CONFLICT', message: 'El email ya está en uso' }
  }
  return db.user.update({ where: { id }, data, select: SAFE_SELECT })
}

export async function deleteUser(db: PrismaClient, id: number) {
  await getUser(db, id)
  await db.user.delete({ where: { id } })
}
