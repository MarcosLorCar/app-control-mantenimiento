import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Borrar en orden seguro (FK constraints)
  await prisma.action.deleteMany()
  await prisma.material.deleteMany()
  await prisma.structure.deleteMany()
  await prisma.dependency.deleteMany()
  await prisma.infrastructure.deleteMany()
  await prisma.materialCategory.deleteMany()
  await prisma.materialType.deleteMany()
  await prisma.actionType.deleteMany()
  await prisma.user.deleteMany()
  await prisma.role.deleteMany()

  // Roles
  const managerRole = await prisma.role.create({
    data: { name: 'admin', description: 'Administrador', canWrite: true, canManage: true },
  })
  const editorRole = await prisma.role.create({
    data: { name: 'editor', description: 'Editor', canWrite: true, canManage: false },
  })
  await prisma.role.create({
    data: { name: 'viewer', description: 'Lector', canWrite: false, canManage: false },
  })

  // Usuarios
  const hash = await bcrypt.hash('admin1234', 10)
  await prisma.user.create({
    data: {
      email: 'admin@example.com',
      passwordHash: hash,
      fullName: 'Admin',
      roleId: managerRole.id,
      mustChangePassword: false,
    },
  })

  const editorHash = await bcrypt.hash('editor1234', 10)
  await prisma.user.create({
    data: {
      email: 'editor@example.com',
      passwordHash: editorHash,
      fullName: 'Editor',
      roleId: editorRole.id,
      mustChangePassword: false,
    },
  })

  // Tipos de acción
  await prisma.actionType.create({
    data: { code: 'inspection', name: 'Inspección', icon: 'search', color: '#3B82F6' },
  })
  await prisma.actionType.create({
    data: { code: 'repair', name: 'Reparación', icon: 'wrench', color: '#F59E0B' },
  })

  // Tipos de material
  await prisma.materialType.create({
    data: {
      code: 'led_bulb',
      name: 'Bombilla LED',
      description: 'Bombilla LED de uso general',
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
          {
            code: 'manufacturer',
            name: 'Fabricante',
            dataType: 'STRING',
            required: false,
            sortOrder: 2,
            enumValues: [],
          },
        ],
      },
    },
  })

  console.log('Seed completado.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
