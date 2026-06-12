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
  const dependenciasCat = await prisma.infrastructureType.create({
    data: { name: 'Dependencias Municipales', description: 'Edificios públicos y dependencias del ayuntamiento', icon: 'Building2' },
  })

  const fuentesCat = await prisma.infrastructureType.create({
    data: { name: 'Fuentes', description: 'Fuentes ornamentales y de agua', icon: 'Droplet' },
  })

  const colegiosCat = await prisma.infrastructureType.create({
    data: { name: 'Colegios', description: 'Centros educativos y colegios públicos', icon: 'GraduationCap' },
  })

  // Tipos de material (Material Types)
  const mtBomba = await prisma.materialType.create({
    data: {
      code: 'bomba',
      name: 'Bomba Hidráulica',
      description: 'Bombas de recirculación, succión o caudal de agua',
      infraTypeId: fuentesCat.id,
      customAttributes: [
        { code: 'marca', name: 'Marca', type: 'STRING' },
        { code: 'modelo', name: 'Modelo', type: 'STRING' },
        { code: 'potencia_cv', name: 'Potencia (CV)', type: 'NUMBER' },
        { code: 'caudal_max_lh', name: 'Caudal Máx. (l/h)', type: 'NUMBER' },
        { code: 'voltaje', name: 'Voltaje', type: 'STRING' },
        { code: 'corriente_nominal_a', name: 'Corriente Nominal (A)', type: 'NUMBER' }
      ]
    },
  })
  const mtMotor = await prisma.materialType.create({
    data: {
      code: 'motor',
      name: 'Motor Eléctrico',
      description: 'Motores eléctricos trifásicos o monofásicos de accionamiento',
      infraTypeId: fuentesCat.id,
      customAttributes: [
        { code: 'marca', name: 'Marca', type: 'STRING' },
        { code: 'modelo', name: 'Modelo', type: 'STRING' },
        { code: 'potencia_kw', name: 'Potencia (kW)', type: 'NUMBER' },
        { code: 'rpm', name: 'R.P.M.', type: 'NUMBER' },
        { code: 'tension_v', name: 'Tensión (V)', type: 'STRING' }
      ]
    },
  })
  const mtAlumbrado = await prisma.materialType.create({
    data: { code: 'alumbrado', name: 'Alumbrado / Proyector', description: 'Focos subacuáticos e iluminación ornamental', infraTypeId: fuentesCat.id },
  })
  const mtSondaNivel = await prisma.materialType.create({
    data: { code: 'sonda_nivel', name: 'Sonda de Nivel', description: 'Sondas conductivas de nivel de agua', infraTypeId: fuentesCat.id },
  })
  const mtBoyaNivel = await prisma.materialType.create({
    data: { code: 'boya_nivel', name: 'Boya de Nivel', description: 'Interruptor de flotador mecánico de nivel', infraTypeId: fuentesCat.id },
  })
  const mtMagnetotermico = await prisma.materialType.create({
    data: { code: 'magnetotermico', name: 'Interruptor Magnetotérmico', description: 'Interruptores de protección eléctrica contra sobrecargas y cortocircuitos', infraTypeId: fuentesCat.id },
  })
  const mtDiferencial = await prisma.materialType.create({
    data: { code: 'diferencial', name: 'Interruptor Diferencial', description: 'Dispositivos de protección contra derivaciones y contactos directos', infraTypeId: fuentesCat.id },
  })
  const mtSeccionador = await prisma.materialType.create({
    data: { code: 'seccionador', name: 'Interruptor de Maniobra / Seccionador', description: 'Interruptor general rotativo de corte y maniobra en carga', infraTypeId: fuentesCat.id },
  })
  const mtContactor = await prisma.materialType.create({
    data: { code: 'contactor', name: 'Contactor', description: 'Contactor de potencia para arranque y control de cargas', infraTypeId: fuentesCat.id },
  })
  const mtRelojProgramador = await prisma.materialType.create({
    data: { code: 'reloj_programador', name: 'Reloj Programador', description: 'Interruptor horario analógico o digital para programaciones temporales', infraTypeId: fuentesCat.id },
  })
  const mtSelector = await prisma.materialType.create({
    data: { code: 'selector', name: 'Selector de Posición', description: 'Selectores giratorios manuales de modo (Manual/Off/Automático)', infraTypeId: fuentesCat.id },
  })
  const mtReleControl = await prisma.materialType.create({
    data: { code: 'rele_control', name: 'Relé de Control', description: 'Relés electrónicos auxiliares (control de nivel, sondas, etc.)', infraTypeId: fuentesCat.id },
  })
  const mtTransformador = await prisma.materialType.create({
    data: { code: 'transformador', name: 'Transformador', description: 'Transformadores de aislamiento y seguridad de tensión', infraTypeId: fuentesCat.id },
  })

  // --- UBICACIONES (Locations Hierarchy) ---
  // Root Location: Fuente del Torreón
  const torreonRoot = await prisma.location.create({
    data: {
      name: 'Fuente del Torreón',
      description: 'Fuente ornamental histórica del parque del Torreón',
      infraTypeId: fuentesCat.id,
      latitude: 40.4188,
      longitude: -3.6841,
    },
  })
  await prisma.location.update({
    where: { id: torreonRoot.id },
    data: { path: `/${torreonRoot.id}/` },
  })

  // Sub-location 1: Fuente (Vaso y maquinaria de agua)
  const vasoFuente = await prisma.location.create({
    data: {
      name: 'Fuente (Vaso y Maquinaria)',
      description: 'Vaso de la fuente, tuberías, bombas y elementos hidráulicos',
      infraTypeId: fuentesCat.id,
      parentId: torreonRoot.id,
      latitude: 40.4188,
      longitude: -3.6841,
    },
  })
  await prisma.location.update({
    where: { id: vasoFuente.id },
    data: { path: `/${torreonRoot.id}/${vasoFuente.id}/` },
  })

  // Sub-location 2: Cuadro de mando y protección
  const cuadroMando = await prisma.location.create({
    data: {
      name: 'Cuadro de Mando y Protección',
      description: 'Armario de control eléctrico y protecciones de la fuente',
      infraTypeId: fuentesCat.id,
      parentId: torreonRoot.id,
      latitude: 40.4189,
      longitude: -3.6840,
    },
  })
  await prisma.location.update({
    where: { id: cuadroMando.id },
    data: { path: `/${torreonRoot.id}/${cuadroMando.id}/` },
  })

  // --- INSTALACIÓN DE MATERIALES ---

  // 1. En la ubicación: Fuente
  const matBomba = await prisma.material.create({
    data: {
      name: 'Bomba',
      typeId: mtBomba.id,
      description: 'Bomba centrífuga sumergida de recirculación de caudal',
      locationId: vasoFuente.id,
      attributes: {
        serial_number: 'BOMBA-ESP-9988',
        purchase_date: '2025-02-10',
        warranty_period: 36,
        supplier: 'Suministros Hidráulicos S.L.',
        marca: 'Espa',
        modelo: 'Silen S 100',
        potencia_cv: 1.0,
        caudal_max_lh: 15000,
        voltaje: '230V',
        corriente_nominal_a: 4.5
      }
    }
  })

  const matMotor = await prisma.material.create({
    data: {
      name: 'Motor',
      typeId: mtMotor.id,
      description: 'Motor eléctrico acoplado a la bomba de recirculación',
      locationId: vasoFuente.id,
      attributes: {
        serial_number: 'MOT-SIEM-4433',
        purchase_date: '2025-02-10',
        warranty_period: 36,
        supplier: 'Suministros Hidráulicos S.L.',
        marca: 'Siemens',
        modelo: '1LA7083',
        potencia_kw: 0.75,
        rpm: 1420,
        tension_v: '230/400V',
        cos_phi: 0.82
      }
    }
  })

  const matAlumbrado = await prisma.material.create({
    data: {
      name: 'Alumbrado',
      typeId: mtAlumbrado.id,
      description: 'Conjunto de proyectores LED de iluminación subacuática',
      locationId: vasoFuente.id,
      attributes: {
        serial_number: 'LUM-LED-VASO-01',
        purchase_date: '2025-02-10',
        warranty_period: 24,
        supplier: 'Electricidad Retiro',
        marca: 'AstralPool',
        modelo: 'LED Blanco 12V',
        potencia_w: 24,
        lumenes: 1485,
        tipo_led: 'Subacuático IP68'
      }
    }
  })

  const matSondaLlenado = await prisma.material.create({
    data: {
      name: 'Sondas de llenado',
      typeId: mtSondaNivel.id,
      description: 'Sondas conductivas superiores para el control de llenado automático del vaso',
      locationId: vasoFuente.id,
      attributes: {
        serial_number: 'SND-LLENADO-01',
        purchase_date: '2025-03-01',
        warranty_period: 24,
        supplier: 'Toscano Control',
        marca: 'Toscano',
        modelo: 'SN-1',
        tipo: 'Varilla / Conductiva',
        material: 'Acero Inoxidable'
      }
    }
  })

  const matSondaMin = await prisma.material.create({
    data: {
      name: 'Sondas de nivel mínimo',
      typeId: mtSondaNivel.id,
      description: 'Sondas conductivas de nivel crítico inferior de agua',
      locationId: vasoFuente.id,
      attributes: {
        serial_number: 'SND-NIVMIN-02',
        purchase_date: '2025-03-01',
        warranty_period: 24,
        supplier: 'Toscano Control',
        marca: 'Toscano',
        modelo: 'SN-1',
        tipo: 'Varilla / Conductiva',
        material: 'Acero Inoxidable'
      }
    }
  })

  const matBoyaLlenado = await prisma.material.create({
    data: {
      name: 'Boya de llenado',
      typeId: mtBoyaNivel.id,
      description: 'Boya de flotador mecánica de llenado automático de seguridad',
      locationId: vasoFuente.id,
      attributes: {
        serial_number: 'BOYA-LLEN-01',
        purchase_date: '2025-02-10',
        warranty_period: 12,
        supplier: 'Suministros Hidráulicos S.L.',
        marca: 'Kari',
        modelo: 'Kari-1',
        tipo: 'Boya flotante de cable',
        longitud_cable_m: 5
      }
    }
  })

  const matBoyaMin = await prisma.material.create({
    data: {
      name: 'Boya de nivel mínimo',
      typeId: mtBoyaNivel.id,
      description: 'Boya flotante de seguridad para protección de marcha en seco de la bomba',
      locationId: vasoFuente.id,
      attributes: {
        serial_number: 'BOYA-NIVMIN-02',
        purchase_date: '2025-02-10',
        warranty_period: 12,
        supplier: 'Suministros Hidráulicos S.L.',
        marca: 'Kari',
        modelo: 'Kari-1',
        tipo: 'Boya flotante de cable',
        longitud_cable_m: 5
      }
    }
  })

  // 2. En la ubicación: Cuadro de mando y protección
  const matIGM = await prisma.material.create({
    data: {
      name: 'Interruptor General magnetotermico',
      typeId: mtMagnetotermico.id,
      description: 'Interruptor General Automático (IGA) principal del cuadro de mando',
      locationId: cuadroMando.id,
      attributes: {
        serial_number: 'IGA-SCHN-25A',
        purchase_date: '2025-02-10',
        warranty_period: 36,
        supplier: 'Electricidad Retiro',
        marca: 'Schneider',
        modelo: 'iC60N 2P 25A',
        intensidad_a: 25,
        polos: '2P',
        curva: 'C',
        poder_corte_ka: 6
      }
    }
  })

  const matIGD = await prisma.material.create({
    data: {
      name: 'Interruptor General diferencial',
      typeId: mtDiferencial.id,
      description: 'Interruptor diferencial general para protección de derivaciones a tierra',
      locationId: cuadroMando.id,
      attributes: {
        serial_number: 'ID-SCHN-40A',
        purchase_date: '2025-02-10',
        warranty_period: 36,
        supplier: 'Electricidad Retiro',
        marca: 'Schneider',
        modelo: 'iID 2P 40A 30mA',
        intensidad_a: 40,
        sensibilidad_ma: 30,
        polos: '2P',
        tipo: 'AC'
      }
    }
  })

  const matIGMM = await prisma.material.create({
    data: {
      name: 'Interruptor general mando y maniobra',
      typeId: mtSeccionador.id,
      description: 'Seccionador rotativo general de mando exterior',
      locationId: cuadroMando.id,
      attributes: {
        serial_number: 'SEC-ABB-32A',
        purchase_date: '2025-02-10',
        warranty_period: 36,
        supplier: 'Electricidad Retiro',
        marca: 'ABB',
        modelo: 'OT32F3',
        intensidad_a: 32,
        polos: '3P'
      }
    }
  })

  const matPMB = await prisma.material.create({
    data: {
      name: 'Interruptor magnetotermico protección de bomba',
      typeId: mtMagnetotermico.id,
      description: 'Magnetotérmico individual de protección de la línea de bomba/motor',
      locationId: cuadroMando.id,
      attributes: {
        serial_number: 'MAG-BOMB-10A',
        purchase_date: '2025-02-10',
        warranty_period: 36,
        supplier: 'Electricidad Retiro',
        marca: 'Schneider',
        modelo: 'iC60N 1P+N 10A',
        intensidad_a: 10,
        polos: '1P+N',
        curva: 'C'
      }
    }
  })

  const matPMA = await prisma.material.create({
    data: {
      name: 'Interruptor magnetotermico protección de alumbrado',
      typeId: mtMagnetotermico.id,
      description: 'Magnetotérmico individual de protección de línea del transformador de luces',
      locationId: cuadroMando.id,
      attributes: {
        serial_number: 'MAG-ALUM-6A',
        purchase_date: '2025-02-10',
        warranty_period: 36,
        supplier: 'Electricidad Retiro',
        marca: 'Schneider',
        modelo: 'iC60N 1P+N 6A',
        intensidad_a: 6,
        polos: '1P+N',
        curva: 'C'
      }
    }
  })

  const matContactorBomba = await prisma.material.create({
    data: {
      name: 'Contactor bomba',
      typeId: mtContactor.id,
      description: 'Contactor electromecánico de arranque del motor de la bomba',
      locationId: cuadroMando.id,
      attributes: {
        serial_number: 'CONT-BOMB-01',
        purchase_date: '2025-02-10',
        warranty_period: 36,
        supplier: 'Electricidad Retiro',
        marca: 'Schneider',
        modelo: 'LC1D09P7',
        bobina_v: '230V AC',
        intensidad_max_a: 9,
        contactos: '3NO+1NO+1NC'
      }
    }
  })

  const matContactorAlum = await prisma.material.create({
    data: {
      name: 'Contactor alumbrado',
      typeId: mtContactor.id,
      description: 'Contactor electromecánico para maniobra de encendido de luces',
      locationId: cuadroMando.id,
      attributes: {
        serial_number: 'CONT-ALUM-02',
        purchase_date: '2025-02-10',
        warranty_period: 36,
        supplier: 'Electricidad Retiro',
        marca: 'Schneider',
        modelo: 'LC1D09P7',
        bobina_v: '230V AC',
        intensidad_max_a: 9,
        contactos: '3NO+1NO+1NC'
      }
    }
  })

  const matReloj = await prisma.material.create({
    data: {
      name: 'Reloj',
      typeId: mtRelojProgramador.id,
      description: 'Reloj temporizador diario analógico para programar encendidos de bomba y luces',
      locationId: cuadroMando.id,
      attributes: {
        serial_number: 'TEMP-ORB-DIARIO',
        purchase_date: '2025-02-10',
        warranty_period: 24,
        supplier: 'Electricidad Retiro',
        marca: 'Orbis',
        modelo: 'Tempus',
        tipo: 'Analógico diario',
        reserva_marcha_h: 150
      }
    }
  })

  const matSelectorBomba = await prisma.material.create({
    data: {
      name: 'Manual bomba',
      typeId: mtSelector.id,
      description: 'Selector manual - 0 - automático para maniobra de bomba',
      locationId: cuadroMando.id,
      attributes: {
        serial_number: 'SEL-BOMB-01',
        purchase_date: '2025-02-10',
        warranty_period: 24,
        supplier: 'Electricidad Retiro',
        marca: 'Giovenzana',
        modelo: 'P0120008S',
        posiciones: 'Manual - 0 - Automático',
        diametro_mm: 22
      }
    }
  })

  const matSelectorAlum = await prisma.material.create({
    data: {
      name: 'Manual alumbrado',
      typeId: mtSelector.id,
      description: 'Selector manual - 0 - automático para maniobra de iluminación',
      locationId: cuadroMando.id,
      attributes: {
        serial_number: 'SEL-ALUM-02',
        purchase_date: '2025-02-10',
        warranty_period: 24,
        supplier: 'Electricidad Retiro',
        marca: 'Giovenzana',
        modelo: 'P0120008S',
        posiciones: 'Manual - 0 - Automático',
        diametro_mm: 22
      }
    }
  })

  const matReleLlenado = await prisma.material.create({
    data: {
      name: 'Rele llenado',
      typeId: mtReleControl.id,
      description: 'Relé electrónico de control de nivel para regulación automática de llenado por sondas',
      locationId: cuadroMando.id,
      attributes: {
        serial_number: 'RELE-LLEN-TH1',
        purchase_date: '2025-03-01',
        warranty_period: 24,
        supplier: 'Toscano Control',
        marca: 'Toscano',
        modelo: 'TH-1',
        funcion: 'Control de llenado por sondas',
        alimentacion_v: '230V AC'
      }
    }
  })

  const matSelectorLlenado = await prisma.material.create({
    data: {
      name: 'Manual llenado',
      typeId: mtSelector.id,
      description: 'Selector manual - 0 - automático para maniobra de electroválvula de llenado',
      locationId: cuadroMando.id,
      attributes: {
        serial_number: 'SEL-LLEN-03',
        purchase_date: '2025-03-01',
        warranty_period: 24,
        supplier: 'Electricidad Retiro',
        marca: 'Giovenzana',
        modelo: 'P0120008S',
        posiciones: 'Manual - 0 - Automático',
        diametro_mm: 22
      }
    }
  })

  const matTransfoLlenado = await prisma.material.create({
    data: {
      name: 'Transformador electroválvula de llenado',
      typeId: mtTransformador.id,
      description: 'Transformador reductor de tensión de seguridad para mando de electroválvula a 24V AC',
      locationId: cuadroMando.id,
      attributes: {
        serial_number: 'TRA-LLEN-24V',
        purchase_date: '2025-03-01',
        warranty_period: 36,
        supplier: 'Electricidad Retiro',
        marca: 'Polylux',
        modelo: 'P24',
        potencia_va: 50,
        tension_primario_v: '230V',
        tension_secundario_v: '24V'
      }
    }
  })

  const matTransfoAlum = await prisma.material.create({
    data: {
      name: 'Transformador salida alumbrado',
      typeId: mtTransformador.id,
      description: 'Transformador reductor de seguridad de alta potencia para proyectores LED de 12V AC',
      locationId: cuadroMando.id,
      attributes: {
        serial_number: 'TRA-ALUM-12V',
        purchase_date: '2025-02-10',
        warranty_period: 36,
        supplier: 'Electricidad Retiro',
        marca: 'Polylux',
        modelo: 'P12',
        potencia_va: 100,
        tension_primario_v: '230V',
        tension_secundario_v: '12V'
      }
    }
  })

  // --- REGISTRO DE TRABAJOS / ACCIONES HISTÓRICAS ---
  // Las acciones se asocian a la ubicación raíz: Fuente del Torreón

  // Acción 1: Puesta en marcha e instalación de equipos
  const actInstalacion = await prisma.action.create({
    data: {
      title: 'Puesta en marcha e instalación inicial de equipos',
      description: 'Se completan las conexiones eléctricas en el cuadro, anclaje de bomba y motor, colocación de sondas de nivel y verificación de presiones. Arranque de prueba exitoso.',
      locationId: torreonRoot.id,
      performedBy: adminUser.id,
      performedAt: new Date('2025-02-15T09:00:00Z'),
    },
  })

  // Vinculamos todos los materiales instalados al momento de esta puesta en marcha
  const materialsToLink = [
    matBomba, matMotor, matAlumbrado, matSondaLlenado, matSondaMin,
    matBoyaLlenado, matBoyaMin, matIGM, matIGD, matIGMM, matPMB, matPMA,
    matContactorBomba, matContactorAlum, matReloj, matSelectorBomba,
    matSelectorAlum, matReleLlenado, matSelectorLlenado, matTransfoLlenado, matTransfoAlum
  ]

  await prisma.actionMaterial.createMany({
    data: materialsToLink.map(mat => ({
      actionId: actInstalacion.id,
      materialId: mat.id,
      operation: 'INSTALL'
    }))
  })

  // Acción 2: Limpieza y calibración de sensores de vaso
  const actMantenimientoSondas = await prisma.action.create({
    data: {
      title: 'Limpieza periódica y calibración de sondas de nivel',
      description: 'Se limpian las varillas de las sondas de llenado y nivel mínimo por acumulación de cal. Se verifica la activación correcta del relé de llenado y boyas de seguridad.',
      locationId: torreonRoot.id,
      performedBy: editorUser.id,
      performedAt: new Date('2025-05-12T10:30:00Z'),
    },
  })

  await prisma.actionMaterial.createMany({
    data: [
      { actionId: actMantenimientoSondas.id, materialId: matSondaLlenado.id, operation: 'UPDATE' },
      { actionId: actMantenimientoSondas.id, materialId: matSondaMin.id, operation: 'UPDATE' },
      { actionId: actMantenimientoSondas.id, materialId: matBoyaLlenado.id, operation: 'UPDATE' },
      { actionId: actMantenimientoSondas.id, materialId: matBoyaMin.id, operation: 'UPDATE' },
    ]
  })

  // Acción 3: Sustitución de Magnetotérmico de Alumbrado por fallo
  const actSustitucionMag = await prisma.action.create({
    data: {
      title: 'Sustitución de interruptor magnetotérmico de protección de alumbrado',
      description: 'Se detectó que el magnetotérmico de luces saltaba esporádicamente incluso sin carga activa. Se sustituyó por un repuesto nuevo idéntico de Schneider 6A.',
      locationId: torreonRoot.id,
      performedBy: editorUser.id,
      performedAt: new Date('2025-06-01T16:00:00Z'),
    },
  })

  await prisma.actionMaterial.create({
    data: {
      actionId: actSustitucionMag.id,
      materialId: matPMA.id,
      operation: 'UPDATE'
    }
  })

  console.log('Seed completado.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
