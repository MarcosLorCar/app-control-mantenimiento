import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

process.env.DATABASE_URL = process.env.TEST_DATABASE_URL!

export const testDb = new PrismaClient()

export async function clearDb() {
  await testDb.actionMaterial.deleteMany()
  await testDb.action.deleteMany()
  await testDb.infrastructure.deleteMany()
  await testDb.user.deleteMany()
  await testDb.actionType.deleteMany()
  await testDb.role.deleteMany()
}

export async function seedTestData() {
  const adminRole = await testDb.role.create({
    data: { name: 'admin', canWrite: true, canManage: true },
  })
  const editorRole = await testDb.role.create({
    data: { name: 'editor', canWrite: true, canManage: false },
  })
  const readerRole = await testDb.role.create({
    data: { name: 'reader', canWrite: false, canManage: false },
  })

  const inspectionType = await testDb.actionType.create({
    data: { name: 'inspection', consumesMaterials: false },
  })
  const repairType = await testDb.actionType.create({
    data: { name: 'repair', consumesMaterials: true },
  })

  const adminHash = await bcrypt.hash('admin1234', 10)
  const adminUser = await testDb.user.create({
    data: { email: 'admin@test.com', passwordHash: adminHash, fullName: 'Admin Test', roleId: adminRole.id },
  })

  const editorHash = await bcrypt.hash('editor1234', 10)
  const editorUser = await testDb.user.create({
    data: { email: 'editor@test.com', passwordHash: editorHash, fullName: 'Editor Test', roleId: editorRole.id },
  })

  const readerHash = await bcrypt.hash('reader1234', 10)
  const readerUser = await testDb.user.create({
    data: { email: 'reader@test.com', passwordHash: readerHash, fullName: 'Reader Test', roleId: readerRole.id },
  })

  return { adminRole, editorRole, readerRole, inspectionType, repairType, adminUser, editorUser, readerUser }
}
