import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Upsert the three standard roles — safe to re-run
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: { name: 'admin', description: 'Administrador', canWrite: true, canManage: true },
  })
  await prisma.role.upsert({
    where: { name: 'editor' },
    update: {},
    create: { name: 'editor', description: 'Editor', canWrite: true, canManage: false },
  })
  await prisma.role.upsert({
    where: { name: 'viewer' },
    update: {},
    create: { name: 'viewer', description: 'Lector', canWrite: false, canManage: false },
  })
  console.log('Roles sincronizados.')

  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminEmail || !adminPassword) {
    console.log('ADMIN_EMAIL / ADMIN_PASSWORD no configurados — se omite la creación del admin.')
    return
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10)

  await prisma.user.upsert({
    where: { email: adminEmail },
    // Never overwrite an existing admin's password on re-deploy
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      fullName: 'Administrador',
      roleId: adminRole.id,
      mustChangePassword: true,
    },
  })
  console.log(`Admin listo: ${adminEmail} (deberá cambiar contraseña al primer login)`)
}

main()
  .catch((e) => {
    console.error('Bootstrap falló:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
