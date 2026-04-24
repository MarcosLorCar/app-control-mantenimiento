import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

process.env.DATABASE_URL = process.env.TEST_DATABASE_URL!

export const testDb = new PrismaClient()

export async function clearDb(db: PrismaClient = testDb) {
  await db.action.deleteMany()
  await db.material.deleteMany()
  await db.structure.deleteMany()
  await db.dependency.deleteMany()
  await db.infrastructure.deleteMany()
  await db.materialCategory.deleteMany()
  await db.materialType.deleteMany()
  await db.actionStatus.deleteMany()
  await db.actionType.deleteMany()
  await db.user.deleteMany()
  await db.role.deleteMany()
}

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

  const hash = await bcrypt.hash('password123', 10)
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

  const actionType = await db.actionType.create({
    data: { code: 'inspection', name: 'Inspección' },
  })
  const actionStatus = await db.actionStatus.create({
    data: { code: 'pending', name: 'Pendiente', sortOrder: 1 },
  })
  const doneStatus = await db.actionStatus.create({
    data: { code: 'done', name: 'Completada', isTerminal: true, sortOrder: 2 },
  })

  const materialType = await db.materialType.create({
    data: {
      code: 'led_bulb',
      name: 'Bombilla LED',
      categories: {
        create: [
          {
            code: 'power_w',
            name: 'Potencia (W)',
            dataType: 'NUMBER',
            unit: 'W',
            required: true,
            sortOrder: 1,
            enumValues: [],
          },
        ],
      },
    },
  })

  const infra = await db.infrastructure.create({
    data: { code: 'HOSP-001', name: 'Hospital Central' },
  })

  const dep = await db.dependency.create({
    data: { code: 'WING-A', name: 'Ala A', infrastructureId: infra.id },
  })

  const structure = await db.structure.create({
    data: { code: 'ROOM-101', name: 'Habitación 101', dependencyId: dep.id },
  })

  const material = await db.material.create({
    data: {
      code: 'MAT-001',
      name: 'Bombilla Philips E27',
      typeId: materialType.id,
      structureId: structure.id,
      attributes: { power_w: 9 },
    },
  })

  // Keep backwards-compatible aliases
  const adminRole = managerRole
  const adminUser = manager
  const readerRole = viewerRole
  const readerUser = viewer
  const editorUser = editor
  const inspectionType = actionType

  return {
    managerRole, editorRole, viewerRole,
    manager, editor, viewer,
    actionType, actionStatus, doneStatus,
    materialType,
    infra, dep, structure, material,
    // backwards-compat aliases
    adminRole, adminUser, editorUser, readerRole, readerUser, inspectionType,
  }
}
