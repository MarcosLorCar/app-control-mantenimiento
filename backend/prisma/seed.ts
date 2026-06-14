import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Borrar en orden seguro (FK constraints)
  await prisma.systemSetting.deleteMany()
  await prisma.actionMaterial.deleteMany()
  await prisma.action.deleteMany()
  await prisma.material.deleteMany()
  await prisma.location.deleteMany()
  await prisma.fixedProperty.deleteMany()
  await prisma.materialType.deleteMany()
  await prisma.infrastructureType.deleteMany()
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
      fullName: 'Admin Mantenimiento',
      roleId: managerRole.id,
      mustChangePassword: false,
    },
  })

  const editorHash = await bcrypt.hash('editor1234', 10)
  await prisma.user.create({
    data: {
      email: 'editor@example.com',
      passwordHash: editorHash,
      fullName: 'Técnico Operario',
      roleId: editorRole.id,
      mustChangePassword: false,
    },
  })

  // Propiedades Fijas Globales (Fixed Properties)
  await prisma.fixedProperty.create({
    data: { code: 'serial_number', name: 'Número de Serie', type: 'STRING' },
  })
  await prisma.fixedProperty.create({
    data: { code: 'purchase_date', name: 'Fecha de Compra', type: 'DATE' },
  })
  await prisma.fixedProperty.create({
    data: { code: 'warranty_period', name: 'Garantía (Meses)', type: 'NUMBER' },
  })
  await prisma.fixedProperty.create({
    data: { code: 'supplier', name: 'Proveedor', type: 'STRING' },
  })

  // Categorías de infraestructura (Infrastructure Types)
  await prisma.infrastructureType.create({
    data: { name: 'Centros Sociales', description: 'Centros sociales y comunitarios', icon: 'Users' },
  })
  await prisma.infrastructureType.create({
    data: { name: 'Fuentes', description: 'Fuentes ornamentales y de agua', icon: 'Droplet' },
  })
  await prisma.infrastructureType.create({
    data: { name: 'Pistas Deportivas', description: 'Instalaciones y pistas deportivas públicas', icon: 'Activity' },
  })
  await prisma.infrastructureType.create({
    data: { name: 'Dependencias Municipales', description: 'Edificios públicos y dependencias del ayuntamiento', icon: 'Building2' },
  })
  await prisma.infrastructureType.create({
    data: { name: 'Colegios', description: 'Centros educativos y colegios públicos', icon: 'GraduationCap' },
  })

  // Configuración del sistema
  await prisma.systemSetting.createMany({
    data: [
      { key: 'default_latitude', value: '38.9863' },
      { key: 'default_longitude', value: '-3.9291' },
      { key: 'default_location_name', value: 'Ciudad Real' },
    ]
  })

  console.log('Seed completado.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
