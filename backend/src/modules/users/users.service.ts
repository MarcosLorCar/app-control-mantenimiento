import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { PrismaClient } from '@prisma/client'
import { CreateUserBody, UpdateUserBody } from './users.schema'

const SAFE_SELECT = {
  id: true, email: true, fullName: true, roleId: true, isActive: true, mustChangePassword: true,
  createdAt: true, updatedAt: true,
  role: { select: { id: true, name: true, canWrite: true, canManage: true } },
}

export async function listUsers(db: PrismaClient) {
  return db.user.findMany({ where: { deletedAt: null }, select: SAFE_SELECT, orderBy: { createdAt: 'desc' } })
}

export async function getUser(db: PrismaClient, id: number) {
  const user = await db.user.findFirst({ where: { id, deletedAt: null }, select: SAFE_SELECT })
  if (!user) throw { statusCode: 404, code: 'NOT_FOUND', message: 'Usuario no encontrado' }
  return user
}

export async function createUser(db: PrismaClient, body: CreateUserBody) {
  const existing = await db.user.findFirst({ where: { email: body.email } })
  if (existing && existing.deletedAt === null) {
    throw { statusCode: 409, code: 'CONFLICT', message: 'El email ya está en uso' }
  }
  const tempPassword = body.password ?? crypto.randomBytes(12).toString('hex')
  const mustChangePassword = !body.password
  const passwordHash = await bcrypt.hash(tempPassword, 10)
  const user = existing
    ? await db.user.update({
        where: { id: existing.id },
        data: { passwordHash, fullName: body.fullName, roleId: body.roleId, mustChangePassword, isActive: true, deletedAt: null },
        select: SAFE_SELECT,
      })
    : await db.user.create({
        data: { email: body.email, passwordHash, fullName: body.fullName, roleId: body.roleId, mustChangePassword },
        select: SAFE_SELECT,
      })
  return { ...user, tempPassword: mustChangePassword ? tempPassword : undefined }
}

export async function updateUser(db: PrismaClient, id: number, body: UpdateUserBody) {
  await getUser(db, id) // lanza 404 si no existe
  const data: any = { ...body }
  if (body.email) {
    const dup = await db.user.findFirst({ where: { email: body.email, deletedAt: null, NOT: { id } } })
    if (dup) throw { statusCode: 409, code: 'CONFLICT', message: 'El email ya está en uso' }
  }
  return db.user.update({ where: { id }, data, select: SAFE_SELECT })
}

export async function deleteUser(db: PrismaClient, id: number) {
  const user = await getUser(db, id)
  if (user.role.canManage) {
    const otherAdmins = await db.user.count({
      where: { deletedAt: null, isActive: true, id: { not: id }, role: { canManage: true } },
    })
    if (otherAdmins === 0) {
      throw { statusCode: 409, code: 'LAST_ADMIN', message: 'No se puede eliminar el último administrador' }
    }
  }
  await db.user.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } })
}

export async function resetUserPassword(db: PrismaClient, userId: number) {
  const user = await db.user.findFirst({ where: { id: userId, deletedAt: null } })
  if (!user) throw { statusCode: 404, code: 'NOT_FOUND', message: 'Usuario no encontrado' }
  const tempPassword = crypto.randomBytes(12).toString('hex')
  const passwordHash = await bcrypt.hash(tempPassword, 10)
  await db.user.update({ where: { id: userId }, data: { passwordHash, mustChangePassword: true, tokenVersion: { increment: 1 } } })
  return { tempPassword }
}
