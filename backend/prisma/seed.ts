import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Borrar en orden seguro (FK constraints)
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
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      passwordHash: hash,
      fullName: 'Admin Mantenimiento',
      roleId: managerRole.id,
      mustChangePassword: false,
    },
  })

  const editorHash = await bcrypt.hash('editor1234', 10)
  const editorUser = await prisma.user.create({
    data: {
      email: 'editor@example.com',
      passwordHash: editorHash,
      fullName: 'Técnico Operario',
      roleId: editorRole.id,
      mustChangePassword: false,
    },
  })

  // Categorías de infraestructura (Infrastructure Types)
  const hospitalCat = await prisma.infrastructureType.create({
    data: { name: 'Hospital', description: 'Centros médicos, clínicas y complejos hospitalarios', icon: '🏥', color: '#EF4444' },
  })
  const parkCat = await prisma.infrastructureType.create({
    data: { name: 'Parque', description: 'Parques públicos, jardines urbanos y áreas recreativas', icon: '🌳', color: '#10B981' },
  })
  const officeCat = await prisma.infrastructureType.create({
    data: { name: 'Edificio', description: 'Edificios corporativos, oficinas y sedes centrales', icon: '🏢', color: '#8B5CF6' },
  })
  const factoryCat = await prisma.infrastructureType.create({
    data: { name: 'Planta Industrial', description: 'Fábricas, naves industriales y almacenes de distribución', icon: '🏭', color: '#F59E0B' },
  })

  // Tipos de material (Material Types)
  const hvac = await prisma.materialType.create({
    data: { code: 'sistema_hvac', name: 'Sistema Climatización', description: 'Equipos e intercambiadores de climatización industrial (HVAC/CRAC)' },
  })
  const generator = await prisma.materialType.create({
    data: { code: 'grupo_electrogeno', name: 'Grupo Electrógeno', description: 'Generadores eléctricos diésel de emergencia y respaldo' },
  })
  const pump = await prisma.materialType.create({
    data: { code: 'bomba_hidraulica', name: 'Bomba Hidráulica', description: 'Bombas de agua de recirculación, succión o presión' },
  })
  const ledLight = await prisma.materialType.create({
    data: { code: 'foco_led', name: 'Foco LED Exterior', description: 'Proyectores y luminarias LED exteriores de alta potencia' },
  })
  const sensor = await prisma.materialType.create({
    data: { code: 'sensor_iot', name: 'Sensor IoT', description: 'Sensores de temperatura, humedad y variables ambientales con conexión de red' },
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

  // --- UBICACIONES (Locations Hierarchy) ---
  
  // 1. HOSPITAL CLÍNICO
  const hospital = await prisma.location.create({
    data: {
      name: 'Hospital Clínico San Carlos',
      description: 'Complejo hospitalario del sector central',
      infraTypeId: hospitalCat.id,
      latitude: 40.4429,
      longitude: -3.7275,
    },
  })
  await prisma.location.update({
    where: { id: hospital.id },
    data: { path: `/${hospital.id}/` },
  })

  const centralTermica = await prisma.location.create({
    data: {
      name: 'Central Térmica (Sótano)',
      description: 'Sala técnica de calderas, enfriadoras y grupos electrógenos',
      infraTypeId: hospitalCat.id,
      parentId: hospital.id,
      latitude: 40.4430,
      longitude: -3.7276,
    },
  })
  await prisma.location.update({
    where: { id: centralTermica.id },
    data: { path: `/${hospital.id}/${centralTermica.id}/` },
  })

  const planta3 = await prisma.location.create({
    data: {
      name: 'Planta 3 - Quirófanos',
      description: 'Área quirúrgica de alta esterilidad',
      infraTypeId: hospitalCat.id,
      parentId: hospital.id,
      latitude: 40.4428,
      longitude: -3.7274,
    },
  })
  await prisma.location.update({
    where: { id: planta3.id },
    data: { path: `/${hospital.id}/${planta3.id}/` },
  })

  const quirofanoQ1 = await prisma.location.create({
    data: {
      name: 'Quirófano Inteligente Q1',
      description: 'Sala de intervenciones Q1 equipada con telemetría',
      infraTypeId: hospitalCat.id,
      parentId: planta3.id,
      latitude: 40.4428,
      longitude: -3.7274,
    },
  })
  await prisma.location.update({
    where: { id: quirofanoQ1.id },
    data: { path: `/${hospital.id}/${planta3.id}/${quirofanoQ1.id}/` },
  })

  // 2. PARQUE DEL RETIRO
  const retiropark = await prisma.location.create({
    data: {
      name: 'Parque de El Retiro',
      description: 'Jardín histórico y parque público principal',
      infraTypeId: parkCat.id,
      latitude: 40.4153,
      longitude: -3.6845,
    },
  })
  await prisma.location.update({
    where: { id: retiropark.id },
    data: { path: `/${retiropark.id}/` },
  })

  const estanqueGrande = await prisma.location.create({
    data: {
      name: 'Estanque Grande del Retiro',
      description: 'Lago artificial recreativo',
      infraTypeId: parkCat.id,
      parentId: retiropark.id,
      latitude: 40.4170,
      longitude: -3.6828,
    },
  })
  await prisma.location.update({
    where: { id: estanqueGrande.id },
    data: { path: `/${retiropark.id}/${estanqueGrande.id}/` },
  })

  const estacionBombeo = await prisma.location.create({
    data: {
      name: 'Estación de Bombeo Estanque',
      description: 'Caseta técnica subterránea de control de agua y recirculación',
      infraTypeId: parkCat.id,
      parentId: estanqueGrande.id,
      latitude: 40.4172,
      longitude: -3.6826,
    },
  })
  await prisma.location.update({
    where: { id: estacionBombeo.id },
    data: { path: `/${retiropark.id}/${estanqueGrande.id}/${estacionBombeo.id}/` },
  })

  const pistaAtletismo = await prisma.location.create({
    data: {
      name: 'Pista de Atletismo Retiro',
      description: 'Área deportiva al aire libre',
      infraTypeId: parkCat.id,
      parentId: retiropark.id,
      latitude: 40.4120,
      longitude: -3.6860,
    },
  })
  await prisma.location.update({
    where: { id: pistaAtletismo.id },
    data: { path: `/${retiropark.id}/${pistaAtletismo.id}/` },
  })

  const torreIluminacion = await prisma.location.create({
    data: {
      name: 'Torre de Iluminación T1',
      description: 'Torre norte de focos para la pista de atletismo',
      infraTypeId: parkCat.id,
      parentId: pistaAtletismo.id,
      latitude: 40.4121,
      longitude: -3.6861,
    },
  })
  await prisma.location.update({
    where: { id: torreIluminacion.id },
    data: { path: `/${retiropark.id}/${pistaAtletismo.id}/${torreIluminacion.id}/` },
  })

  // 3. SEDE CORPORATIVA
  const sedeCorp = await prisma.location.create({
    data: {
      name: 'Sede Corporativa Central',
      description: 'Edificio de oficinas del grupo administrativo',
      infraTypeId: officeCat.id,
      latitude: 40.4601,
      longitude: -3.6905,
    },
  })
  await prisma.location.update({
    where: { id: sedeCorp.id },
    data: { path: `/${sedeCorp.id}/` },
  })

  const dataCenter = await prisma.location.create({
    data: {
      name: 'Centro de Datos (Sótano -2)',
      description: 'Data Center principal y nodos de red de la sede',
      infraTypeId: officeCat.id,
      parentId: sedeCorp.id,
      latitude: 40.4602,
      longitude: -3.6906,
    },
  })
  await prisma.location.update({
    where: { id: dataCenter.id },
    data: { path: `/${sedeCorp.id}/${dataCenter.id}/` },
  })

  const filaA = await prisma.location.create({
    data: {
      name: 'Fila A - Servidores',
      description: 'Racks del 01 al 12 con equipamiento de misión crítica',
      infraTypeId: officeCat.id,
      parentId: dataCenter.id,
      latitude: 40.4602,
      longitude: -3.6906,
    },
  })
  await prisma.location.update({
    where: { id: filaA.id },
    data: { path: `/${sedeCorp.id}/${dataCenter.id}/${filaA.id}/` },
  })

  // --- MATERIALES (Instances) ---

  const hvacHosp = await prisma.material.create({
    data: {
      name: 'Climatizador Principal HVAC-01',
      typeId: hvac.id,
      description: 'Unidad de climatización central de agua refrigerada para el área médica',
      locationId: centralTermica.id,
      attributes: {
        serial_number: 'CLIM-HVAC-9921',
        purchase_date: '2024-03-15',
        warranty_period: 36,
        supplier: 'ClimaCorp S.A.',
      },
    },
  })

  const genHosp = await prisma.material.create({
    data: {
      name: 'Generador de Respaldo GEN-450',
      typeId: generator.id,
      description: 'Grupo electrógeno diésel de 450kVA con arranque automático',
      locationId: centralTermica.id,
      attributes: {
        serial_number: 'GEN-DIESEL-4001',
        purchase_date: '2024-05-10',
        warranty_period: 24,
        supplier: 'Generadores del Norte',
      },
    },
  })

  const sensorQ1 = await prisma.material.create({
    data: {
      name: 'Sensor Temp/Hum IoT Q1',
      typeId: sensor.id,
      description: 'Sensor de precisión inalámbrico para monitorización de salas blancas',
      locationId: quirofanoQ1.id,
      attributes: {
        serial_number: 'SNS-TEMP-0012',
        purchase_date: '2025-02-01',
        warranty_period: 12,
        supplier: 'Sensors Inc.',
      },
    },
  })

  const bombaRetiro = await prisma.material.create({
    data: {
      name: 'Bomba de Recirculación B-01',
      typeId: pump.id,
      description: 'Bomba centrífuga sumergida de caudal variable para el estanque',
      locationId: estacionBombeo.id,
      attributes: {
        serial_number: 'BOMBA-HYDR-8891',
        purchase_date: '2025-01-20',
        warranty_period: 24,
        supplier: 'Bombas e Hidráulicos',
      },
    },
  })

  const proyectorPista = await prisma.material.create({
    data: {
      name: 'Proyector LED 200W P1',
      typeId: ledLight.id,
      description: 'Foco de alta potencia exterior estanco IP66 para áreas deportivas',
      locationId: torreIluminacion.id,
      attributes: {
        serial_number: 'LED-PROJ-7721',
        purchase_date: '2024-11-12',
        warranty_period: 60,
        supplier: 'Lumen Lux',
      },
    },
  })

  const cracSede = await prisma.material.create({
    data: {
      name: 'Aire Acondicionado de Precisión CRAC-02',
      typeId: hvac.id,
      description: 'Climatizador de expansión directa especial para CPD',
      locationId: dataCenter.id,
      attributes: {
        serial_number: 'CRAC-PREC-5512',
        purchase_date: '2023-09-08',
        warranty_period: 24,
        supplier: 'CoolingTech',
      },
    },
  })

  // --- ACCIONES (Maintenance actions) ---

  const actHosp = await prisma.action.create({
    data: {
      title: 'Instalación de Equipos de Central Térmica',
      description: 'Se realiza la descarga, anclaje y cableado del climatizador principal y el grupo de emergencia. Pruebas de arranque en carga superadas satisfactoriamente.',
      locationId: centralTermica.id,
      performedBy: adminUser.id,
      performedAt: new Date('2024-03-18T10:00:00Z'),
    },
  })

  await prisma.actionMaterial.createMany({
    data: [
      { actionId: actHosp.id, materialId: hvacHosp.id, operation: 'INSTALL' },
      { actionId: actHosp.id, materialId: genHosp.id, operation: 'INSTALL' },
    ],
  })

  const actQ1 = await prisma.action.create({
    data: {
      title: 'Calibración y Puesta en Marcha de Sensor IoT',
      description: 'Montaje de soporte de pared en Quirófano Q1, conexión a la red IoT del hospital y calibración del transductor de temperatura frente a patrón certificado.',
      locationId: quirofanoQ1.id,
      performedBy: adminUser.id,
      performedAt: new Date('2025-02-03T09:00:00Z'),
    },
  })

  await prisma.actionMaterial.create({
    data: { actionId: actQ1.id, materialId: sensorQ1.id, operation: 'INSTALL' },
  })

  const actRet = await prisma.action.create({
    data: {
      title: 'Mantenimiento Preventivo de Bomba Estanque',
      description: 'Extracción de la bomba centrífuga sumergida, limpieza manual de la rejilla de aspiración, comprobación de la holgura del rodete e inspección de sellos mecánicos.',
      locationId: estacionBombeo.id,
      performedBy: editorUser.id,
      performedAt: new Date('2025-05-10T08:30:00Z'),
    },
  })

  await prisma.actionMaterial.create({
    data: { actionId: actRet.id, materialId: bombaRetiro.id, operation: 'INSTALL' },
  })

  const actPist = await prisma.action.create({
    data: {
      title: 'Adecuación de Iluminación Deportiva',
      description: 'Sustitución de proyector de vapor de sodio fundido de 400W por nueva luminaria LED de 200W en la Torre T1. Se ajusta la orientación para optimizar el haz luminoso.',
      locationId: torreIluminacion.id,
      performedBy: editorUser.id,
      performedAt: new Date('2024-11-15T15:00:00Z'),
    },
  })

  await prisma.actionMaterial.create({
    data: { actionId: actPist.id, materialId: proyectorPista.id, operation: 'INSTALL' },
  })

  const actCp = await prisma.action.create({
    data: {
      title: 'Montaje de Climatizador Precisión CPD',
      description: 'Instalación de la unidad interna evaporadora CRAC-02. Conexión de tubería de refrigerante ecológico R410A y pruebas de estanqueidad de nitrógeno.',
      locationId: dataCenter.id,
      performedBy: adminUser.id,
      performedAt: new Date('2023-09-12T11:00:00Z'),
    },
  })

  await prisma.actionMaterial.create({
    data: { actionId: actCp.id, materialId: cracSede.id, operation: 'INSTALL' },
  })

  console.log('Seed completado.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
