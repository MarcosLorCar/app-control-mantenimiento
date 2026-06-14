import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

if (!process.env.TEST_DATABASE_URL) {
  throw new Error('TEST_DATABASE_URL is required for tests')
}
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL

export const testDb = new PrismaClient()

export async function clearDb(db: PrismaClient = testDb) {
  await db.actionMaterial.deleteMany()
  await db.action.deleteMany()
  await db.material.deleteMany()
  await db.location.deleteMany()
  await db.infrastructureType.deleteMany()
  await db.materialType.deleteMany()
  await db.fixedProperty.deleteMany()
  await db.user.deleteMany()
  await db.role.deleteMany()
}

let cachedHash: string | null = null

export async function seedTestData(db: PrismaClient = testDb) {
  const managerRole = await db.role.create({
    data: { name: 'admin', canWrite: true, canManage: true },
  })
  const editorRole = await db.role.create({
    data: { name: 'editor', canWrite: true, canManage: false },
  })
  const viewerRole = await db.role.create({
    data: { name: 'viewer', canWrite: false, canManage: false },
  })

  if (!cachedHash) {
    cachedHash = await bcrypt.hash('password123', 10)
  }
  const hash = cachedHash
  const manager = await db.user.create({
    data: {
      email: 'manager@test.com',
      passwordHash: hash,
      fullName: 'Test Manager',
      roleId: managerRole.id,
      mustChangePassword: false,
    },
  })
  const editor = await db.user.create({
    data: {
      email: 'editor@test.com',
      passwordHash: hash,
      fullName: 'Test Editor',
      roleId: editorRole.id,
      mustChangePassword: false,
    },
  })
  const viewer = await db.user.create({
    data: {
      email: 'viewer@test.com',
      passwordHash: hash,
      fullName: 'Test Viewer',
      roleId: viewerRole.id,
      mustChangePassword: false,
    },
  })

  const materialType = await db.materialType.create({
    data: {
      code: 'led_bulb',
      name: 'Bombilla LED',
    },
  })

  const infraType = await db.infrastructureType.create({
    data: {
      name: 'Hospital',
      description: 'Centros sanitarios',
    },
  })

  // Seed serial_number fixed property
  await db.fixedProperty.create({
    data: { code: 'serial_number', name: 'Número de Serie', type: 'STRING' },
  })

  const infra = await db.location.create({
    data: { name: 'Hospital Central', infraTypeId: infraType.id },
  })
  await db.location.update({
    where: { id: infra.id },
    data: { path: `/${infra.id}/` },
  })

  const dep = await db.location.create({
    data: { name: 'Ala A', parentId: infra.id, infraTypeId: infraType.id },
  })
  await db.location.update({
    where: { id: dep.id },
    data: { path: `/${infra.id}/${dep.id}/` },
  })

  const structure = await db.location.create({
    data: { name: 'Habitación 101', parentId: dep.id, infraTypeId: infraType.id },
  })
  await db.location.update({
    where: { id: structure.id },
    data: { path: `/${infra.id}/${dep.id}/${structure.id}/` },
  })

  const material = await db.material.create({
    data: {
      name: 'Bombilla Philips E27',
      typeId: materialType.id,
      locationId: structure.id,
      attributes: { serial_number: 'SN-TEST-123', power_w: 9 },
    },
  })

  // Keep backwards-compatible aliases
  const adminRole = managerRole
  const adminUser = manager
  const readerRole = viewerRole
  const readerUser = viewer
  const editorUser = editor

  return {
    managerRole, editorRole, viewerRole,
    manager, editor, viewer,
    materialType,
    infraType,
    infra, dep, structure, material,
    // backwards-compat aliases
    adminRole, adminUser, editorUser, readerRole, readerUser,
  }
}
