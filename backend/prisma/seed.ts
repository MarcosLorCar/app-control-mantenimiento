import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Clear in FK-safe order
  await prisma.locationPhoto.deleteMany()
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

  // ── Roles ────────────────────────────────────────────────────────────────
  const adminRole = await prisma.role.create({
    data: { name: 'admin', description: 'Administrador', canWrite: true, canManage: true },
  })
  const editorRole = await prisma.role.create({
    data: { name: 'editor', description: 'Editor', canWrite: true, canManage: false },
  })
  await prisma.role.create({
    data: { name: 'viewer', description: 'Lector', canWrite: false, canManage: false },
  })

  // ── Users ────────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('admin1234', 10)
  const admin = await prisma.user.create({
    data: { email: 'admin@example.com', passwordHash: adminHash, fullName: 'Admin Mantenimiento', roleId: adminRole.id, mustChangePassword: false },
  })
  const editorHash = await bcrypt.hash('editor1234', 10)
  const editor = await prisma.user.create({
    data: { email: 'editor@example.com', passwordHash: editorHash, fullName: 'Técnico Operario', roleId: editorRole.id, mustChangePassword: false },
  })

  // ── Fixed properties ─────────────────────────────────────────────────────
  await prisma.fixedProperty.createMany({
    data: [
      { code: 'serial_number', name: 'Número de Serie', type: 'STRING' },
      { code: 'purchase_date', name: 'Fecha de Compra', type: 'DATE' },
      { code: 'warranty_period', name: 'Garantía (Meses)', type: 'NUMBER' },
      { code: 'supplier', name: 'Proveedor', type: 'STRING' },
    ],
  })

  // ── Infrastructure types ─────────────────────────────────────────────────
  const typeEdificio = await prisma.infrastructureType.create({
    data: { name: 'Dependencias Municipales', description: 'Edificios públicos y dependencias del ayuntamiento', icon: 'Building2', color: '#3B82F6' },
  })
  const typeParque = await prisma.infrastructureType.create({
    data: { name: 'Parques y Jardines', description: 'Parques públicos y zonas verdes', icon: 'Trees', color: '#10B981' },
  })
  const typePista = await prisma.infrastructureType.create({
    data: { name: 'Pistas Deportivas', description: 'Instalaciones y pistas deportivas públicas', icon: 'Activity', color: '#F59E0B' },
  })
  await prisma.infrastructureType.create({
    data: { name: 'Colegios', description: 'Centros educativos y colegios públicos', icon: 'GraduationCap', color: '#8B5CF6' },
  })

  // ── Material types ───────────────────────────────────────────────────────
  const tipoLuminaria = await prisma.materialType.create({
    data: {
      code: 'LUM',
      name: 'Luminaria',
      description: 'Puntos de luz y alumbrado',
      icon: 'Lightbulb',
      customAttributes: [
        { key: 'potencia_w', label: 'Potencia (W)', type: 'number' },
        { key: 'tecnologia', label: 'Tecnología', type: 'select', options: ['LED', 'Fluorescente', 'Halógena'] },
        { key: 'ip', label: 'Grado IP', type: 'string' },
      ],
      categories: { connect: [{ id: typeEdificio.id }, { id: typeParque.id }, { id: typePista.id }] },
    },
  })
  const tipoClimatizador = await prisma.materialType.create({
    data: {
      code: 'CLIM',
      name: 'Climatizador',
      description: 'Equipos de aire acondicionado y calefacción',
      icon: 'Wind',
      customAttributes: [
        { key: 'potencia_frig', label: 'Potencia (Frigorías)', type: 'number' },
        { key: 'marca', label: 'Marca', type: 'string' },
        { key: 'modelo', label: 'Modelo', type: 'string' },
      ],
      categories: { connect: [{ id: typeEdificio.id }] },
    },
  })
  const tipoBanco = await prisma.materialType.create({
    data: {
      code: 'MOB',
      name: 'Mobiliario Urbano',
      description: 'Bancos, papeleras y elementos de mobiliario',
      icon: 'Armchair',
      customAttributes: [
        { key: 'material', label: 'Material', type: 'select', options: ['Madera', 'Metal', 'Hormigón', 'Mixto'] },
        { key: 'color', label: 'Color', type: 'string' },
      ],
      categories: { connect: [{ id: typeParque.id }] },
    },
  })

  // ── Locations ────────────────────────────────────────────────────────────
  // Root: Ayuntamiento
  const ayto = await prisma.location.create({
    data: { name: 'Ayuntamiento', description: 'Edificio principal del ayuntamiento', infraTypeId: typeEdificio.id, latitude: 38.9863, longitude: -3.9291 },
  })
  await prisma.location.update({ where: { id: ayto.id }, data: { path: `/${ayto.id}/` } })

  const planta0 = await prisma.location.create({
    data: { name: 'Planta Baja', description: 'Atención al ciudadano y registro', infraTypeId: typeEdificio.id, parentId: ayto.id },
  })
  await prisma.location.update({ where: { id: planta0.id }, data: { path: `/${ayto.id}/${planta0.id}/` } })

  const planta1 = await prisma.location.create({
    data: { name: 'Primera Planta', description: 'Oficinas técnicas y despachos', infraTypeId: typeEdificio.id, parentId: ayto.id },
  })
  await prisma.location.update({ where: { id: planta1.id }, data: { path: `/${ayto.id}/${planta1.id}/` } })

  // Root: Parque Central
  const parque = await prisma.location.create({
    data: { name: 'Parque Central', description: 'Parque principal del municipio', infraTypeId: typeParque.id, latitude: 38.9880, longitude: -3.9310 },
  })
  await prisma.location.update({ where: { id: parque.id }, data: { path: `/${parque.id}/` } })

  const zonaJuegos = await prisma.location.create({
    data: { name: 'Zona de Juegos', description: 'Área infantil', infraTypeId: typeParque.id, parentId: parque.id },
  })
  await prisma.location.update({ where: { id: zonaJuegos.id }, data: { path: `/${parque.id}/${zonaJuegos.id}/` } })

  const paseoArbolado = await prisma.location.create({
    data: { name: 'Paseo Arbolado', description: 'Paseo principal con arbolado', infraTypeId: typeParque.id, parentId: parque.id },
  })
  await prisma.location.update({ where: { id: paseoArbolado.id }, data: { path: `/${parque.id}/${paseoArbolado.id}/` } })

  // Root: Pista Polideportiva
  const pista = await prisma.location.create({
    data: { name: 'Polideportivo Municipal', description: 'Instalación deportiva cubierta', infraTypeId: typePista.id, latitude: 38.9840, longitude: -3.9270 },
  })
  await prisma.location.update({ where: { id: pista.id }, data: { path: `/${pista.id}/` } })

  const vestidores = await prisma.location.create({
    data: { name: 'Vestuarios', description: 'Vestuarios y duchas', infraTypeId: typePista.id, parentId: pista.id },
  })
  await prisma.location.update({ where: { id: vestidores.id }, data: { path: `/${pista.id}/${vestidores.id}/` } })

  // ── Materials ────────────────────────────────────────────────────────────
  const lum1 = await prisma.material.create({
    data: { name: 'Luminaria LED Pasillo Principal', typeId: tipoLuminaria.id, locationId: planta0.id, attributes: { potencia_w: 40, tecnologia: 'LED', ip: 'IP44' } },
  })
  const lum2 = await prisma.material.create({
    data: { name: 'Luminaria LED Despacho Alcaldía', typeId: tipoLuminaria.id, locationId: planta1.id, attributes: { potencia_w: 24, tecnologia: 'LED', ip: 'IP20' } },
  })
  const clim1 = await prisma.material.create({
    data: { name: 'Climatizador Sala de Plenos', typeId: tipoClimatizador.id, locationId: planta1.id, attributes: { potencia_frig: 3000, marca: 'Daikin', modelo: 'FTXM35R' } },
  })
  const lumParque1 = await prisma.material.create({
    data: { name: 'Farola LED Paseo Norte', typeId: tipoLuminaria.id, locationId: paseoArbolado.id, attributes: { potencia_w: 60, tecnologia: 'LED', ip: 'IP65' } },
  })
  const lumParque2 = await prisma.material.create({
    data: { name: 'Farola LED Paseo Sur', typeId: tipoLuminaria.id, locationId: paseoArbolado.id, attributes: { potencia_w: 60, tecnologia: 'LED', ip: 'IP65' } },
  })
  await prisma.material.create({
    data: { name: 'Banco de Madera Zona Juegos', typeId: tipoBanco.id, locationId: zonaJuegos.id, attributes: { material: 'Madera', color: 'Verde' } },
  })
  await prisma.material.create({
    data: { name: 'Banco de Metal Paseo', typeId: tipoBanco.id, locationId: paseoArbolado.id, attributes: { material: 'Metal', color: 'Negro' } },
  })
  const lumPista = await prisma.material.create({
    data: { name: 'Luminaria Pista Principal', typeId: tipoLuminaria.id, locationId: vestidores.id, attributes: { potencia_w: 100, tecnologia: 'LED', ip: 'IP65' } },
  })
  // One uninstalled material (no locationId)
  await prisma.material.create({
    data: { name: 'Climatizador Almacén (retirado)', typeId: tipoClimatizador.id, locationId: null, attributes: { potencia_frig: 2000, marca: 'Mitsubishi', modelo: 'MSZ-HR25VF' } },
  })

  // ── Actions ──────────────────────────────────────────────────────────────
  const accion1 = await prisma.action.create({
    data: {
      title: 'Revisión anual alumbrado Ayuntamiento',
      description: 'Inspección y limpieza de luminarias de planta baja y primera planta.',
      locationId: ayto.id,
      performedBy: editor.id,
      performedAt: new Date('2026-05-10T09:00:00'),
    },
  })
  await prisma.actionMaterial.createMany({
    data: [
      { actionId: accion1.id, materialId: lum1.id, operation: 'UPDATE', snapshot: { name: lum1.name, description: lum1.description, attributes: lum1.attributes } },
      { actionId: accion1.id, materialId: lum2.id, operation: 'UPDATE', snapshot: { name: lum2.name, description: lum2.description, attributes: lum2.attributes } },
    ],
  })

  const accion2 = await prisma.action.create({
    data: {
      title: 'Sustitución climatizador Sala de Plenos',
      description: 'Retirada del equipo antiguo e instalación del nuevo climatizador Daikin.',
      locationId: ayto.id,
      performedBy: admin.id,
      performedAt: new Date('2026-06-01T11:30:00'),
    },
  })
  await prisma.actionMaterial.createMany({
    data: [
      { actionId: accion2.id, materialId: clim1.id, operation: 'INSTALL', snapshot: null },
    ],
  })

  const accion3 = await prisma.action.create({
    data: {
      title: 'Mantenimiento farolas Parque Central',
      description: 'Revisión del cableado y limpieza de farolas del paseo arbolado.',
      locationId: parque.id,
      performedBy: editor.id,
      performedAt: new Date('2026-06-12T08:00:00'),
    },
  })
  await prisma.actionMaterial.createMany({
    data: [
      { actionId: accion3.id, materialId: lumParque1.id, operation: 'UPDATE', snapshot: { name: lumParque1.name, description: lumParque1.description, attributes: lumParque1.attributes } },
      { actionId: accion3.id, materialId: lumParque2.id, operation: 'UPDATE', snapshot: { name: lumParque2.name, description: lumParque2.description, attributes: lumParque2.attributes } },
    ],
  })

  await prisma.action.create({
    data: {
      title: 'Instalación luminaria pista deportiva',
      description: 'Nueva luminaria LED instalada en vestuarios del polideportivo.',
      locationId: pista.id,
      performedBy: editor.id,
      performedAt: new Date('2026-06-14T10:00:00'),
    },
  }).then(async (a) => {
    await prisma.actionMaterial.create({
      data: { actionId: a.id, materialId: lumPista.id, operation: 'INSTALL', snapshot: null },
    })
  })

  // ── System settings ──────────────────────────────────────────────────────
  await prisma.systemSetting.createMany({
    data: [
      { key: 'default_latitude', value: '38.9863' },
      { key: 'default_longitude', value: '-3.9291' },
      { key: 'default_location_name', value: 'Ciudad Real' },
    ],
  })

  console.log('✓ Seed completado.')
  console.log('  admin@example.com / admin1234')
  console.log('  editor@example.com / editor1234')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
