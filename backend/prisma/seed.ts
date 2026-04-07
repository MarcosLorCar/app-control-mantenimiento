import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: { name: 'admin', description: 'Administrador completo', canWrite: true, canManage: true },
  })
  const editorRole = await prisma.role.upsert({
    where: { name: 'editor' },
    update: {},
    create: { name: 'editor', description: 'Puede registrar acciones', canWrite: true, canManage: false },
  })
  await prisma.role.upsert({
    where: { name: 'reader' },
    update: {},
    create: { name: 'reader', description: 'Solo lectura', canWrite: false, canManage: false },
  })

  // Tipos de acción
  await prisma.actionType.upsert({
    where: { name: 'inspection' },
    update: {},
    create: { name: 'inspection', description: 'Inspección visual o técnica', consumesMaterials: false },
  })
  await prisma.actionType.upsert({
    where: { name: 'repair' },
    update: {},
    create: { name: 'repair', description: 'Reparación o sustitución', consumesMaterials: true },
  })
  await prisma.actionType.upsert({
    where: { name: 'installation' },
    update: {},
    create: { name: 'installation', description: 'Nueva instalación', consumesMaterials: true },
  })

  // Usuario admin inicial
  const hash = await bcrypt.hash('admin1234', 10)
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash: hash,
      fullName: 'Administrador',
      roleId: adminRole.id,
    },
  })

  // Usuario editor de ejemplo
  const editorHash = await bcrypt.hash('editor1234', 10)
  await prisma.user.upsert({
    where: { email: 'editor@example.com' },
    update: {},
    create: {
      email: 'editor@example.com',
      passwordHash: editorHash,
      fullName: 'Editor Ejemplo',
      roleId: editorRole.id,
    },
  })

  console.log('Seed completado.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
