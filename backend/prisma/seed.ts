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

  // Tipos de acción (renombrar a español si existen en inglés)
  await prisma.actionType.updateMany({ where: { name: 'inspection' }, data: { name: 'Inspección' } })
  await prisma.actionType.updateMany({ where: { name: 'repair' }, data: { name: 'Reparación' } })
  await prisma.actionType.updateMany({ where: { name: 'installation' }, data: { name: 'Instalación' } })

  await prisma.actionType.upsert({
    where: { name: 'Inspección' },
    update: {},
    create: { name: 'Inspección', description: 'Inspección visual o técnica', consumesMaterials: false },
  })
  await prisma.actionType.upsert({
    where: { name: 'Reparación' },
    update: {},
    create: { name: 'Reparación', description: 'Reparación o sustitución', consumesMaterials: true },
  })
  await prisma.actionType.upsert({
    where: { name: 'Instalación' },
    update: {},
    create: { name: 'Instalación', description: 'Nueva instalación', consumesMaterials: true },
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

  // Tipos de infraestructura
  const infraTypeNames = [
    'Colegios',
    'Fuentes',
    'Pistas deportivas',
    'Centros Sociales',
    'Dependencias municipales',
  ]
  for (const name of infraTypeNames) {
    await prisma.infrastructureType.upsert({
      where: { name },
      update: {},
      create: { name },
    })
  }

  console.log('Seed completado.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
