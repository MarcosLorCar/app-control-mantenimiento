import { useState, useEffect } from 'react'
import {
  useInfrastructureTypes, useCreateInfrastructureType,
  useRoles,
  useMaterialTypes, useCreateMaterialType,
  useFixedProperties, useCreateFixedProperty, useDeleteFixedProperty
} from '../../hooks/useCatalog'
import { useSystemSettings, useUpdateSystemSettings } from '../../hooks/useSystemSettings'
import { useRecalcAddresses } from '../../hooks/useRecalcAddresses'
import { useHealth } from '../../hooks/useHealth'
import { useAuth } from '../../hooks/useAuth'
import { getCategoryIcon, CATEGORY_ICON_OPTIONS } from '../../utils/categoryIcons'
import { getCategoryColor } from '../../utils/categoryColors'
import { CategoryEditModal } from '../../components/forms/CategoryEditModal'
import { MaterialTypeEditModal } from '../../components/forms/MaterialTypeEditModal'
import { LocationMap } from '../../components/ui/LocationMap'
import { Modal } from '../../components/ui/Modal'
import { MapPin, Plus, Sun, Moon } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'




const inputCls = 'w-full border border-app-border rounded-lg px-3 py-2 text-sm bg-card text-fg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors'

export function Catalog() {
  const { user } = useAuth()
  const { toggleTheme, isDark } = useTheme()
  const canManage = !!user?.can_manage

  const { data: infraTypes = [] } = useInfrastructureTypes()
  const { data: materialTypes = [] } = useMaterialTypes()
  const { data: fixedProperties = [], refetch: refetchProps } = useFixedProperties()
  const { data: roles = [] } = useRoles()

  const { data: settings = [] } = useSystemSettings()
  const updateSettings = useUpdateSystemSettings()
  const { progress: recalc, run: runRecalc } = useRecalcAddresses()
  const { data: health } = useHealth()

  function handleRecalcAddresses() {
    if (recalc.running) return
    if (!confirm('Se recalcularán las direcciones de todas las ubicaciones con coordenadas. El proceso se ejecutará en segundo plano en el servidor, por lo que puedes cerrar esta pestaña o salir de la aplicación sin problema. ¿Continuar?')) return
    void runRecalc()
  }

  const defaultLat = settings.find(s => s.key === 'default_latitude')?.value ?? ''
  const defaultLng = settings.find(s => s.key === 'default_longitude')?.value ?? ''
  const defaultLocName = settings.find(s => s.key === 'default_location_name')?.value ?? ''

  const [cfgLat, setCfgLat] = useState('')
  const [cfgLng, setCfgLng] = useState('')
  const [cfgLocName, setCfgLocName] = useState('')
  const [cfgError, setCfgError] = useState('')
  const [cfgSuccess, setCfgSuccess] = useState('')
  const [isEditingSettings, setIsEditingSettings] = useState(false)

  // Map selector modal state
  const [showMapModal, setShowMapModal] = useState(false)
  const [tempLat, setTempLat] = useState<number | null>(null)
  const [tempLng, setTempLng] = useState<number | null>(null)

  // "Add" modal toggles (keep the creation forms out of the page itself)
  const [showAddInfraType, setShowAddInfraType] = useState(false)
  const [showAddMaterialType, setShowAddMaterialType] = useState(false)
  const [showAddFixedProp, setShowAddFixedProp] = useState(false)

  function openMapModal() {
    setTempLat(cfgLat ? Number(cfgLat) : null)
    setTempLng(cfgLng ? Number(cfgLng) : null)
    setShowMapModal(true)
  }

  function handleConfirmMap() {
    if (tempLat !== null && tempLng !== null) {
      setCfgLat(tempLat.toString())
      setCfgLng(tempLng.toString())
    }
    setShowMapModal(false)
  }

  useEffect(() => {
    if (settings.length > 0 && !isEditingSettings) {
      setCfgLat(defaultLat)
      setCfgLng(defaultLng)
      setCfgLocName(defaultLocName)
    }
  }, [settings, defaultLat, defaultLng, defaultLocName, isEditingSettings])

  function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault()
    setCfgError('')
    setCfgSuccess('')

    if (!cfgLat.trim() || !cfgLng.trim() || !cfgLocName.trim()) {
      setCfgError('Todos los campos son obligatorios.')
      return
    }

    if (isNaN(Number(cfgLat)) || isNaN(Number(cfgLng))) {
      setCfgError('La latitud y longitud deben ser números válidos.')
      return
    }

    updateSettings.mutate(
      {
        default_latitude: cfgLat.trim(),
        default_longitude: cfgLng.trim(),
        default_location_name: cfgLocName.trim(),
      },
      {
        onSuccess: () => {
          setCfgSuccess('Configuración guardada correctamente.')
          setIsEditingSettings(false)
          setTimeout(() => setCfgSuccess(''), 3000)
        },
        onError: (err: any) => {
          setCfgError(err?.error?.message ?? 'Error al guardar la configuración.')
        },
      }
    )
  }

  const addInfraType = useCreateInfrastructureType()
  const addMaterialType = useCreateMaterialType()
  const addFixedProp = useCreateFixedProperty()
  const deleteFixedProp = useDeleteFixedProperty()

  // InfraType form state
  const [itName, setItName] = useState('')
  const [itIcon, setItIcon] = useState('Building2')
  const [itError, setItError] = useState('')

  // MaterialType form state
  const [mtName, setMtName] = useState('')
  const [mtError, setMtError] = useState('')
  
  // Category edit state
  const [editingCat, setEditingCat] = useState<any | null>(null)

  // MaterialType properties edit state
  const [editingPropertiesMt, setEditingPropertiesMt] = useState<any | null>(null)


  // FixedProperty form state
  const [fpName, setFpName] = useState('')
  const [fpType, setFpType] = useState<'STRING' | 'DATE' | 'NUMBER' | 'BOOLEAN'>('STRING')
  const [fpError, setFpError] = useState('')

  function handleAddInfraType(e: React.FormEvent) {
    e.preventDefault()
    if (!itName.trim()) return
    setItError('')
    addInfraType.mutate(
      { name: itName.trim(), icon: itIcon },
      {
        onSuccess: () => { setItName(''); setItIcon('Building2'); setShowAddInfraType(false) },
        onError: (err: any) => setItError(err?.error?.message ?? 'Error al añadir'),
      }
    )
  }

  function handleAddMaterialType(e: React.FormEvent) {
    e.preventDefault()
    if (!mtName.trim()) return
    setMtError('')
    const generatedCode = mtName.trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9_]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 50)
    addMaterialType.mutate(
      { code: generatedCode, name: mtName.trim() },
      {
        onSuccess: () => { setMtName(''); setShowAddMaterialType(false) },
        onError: (err: any) => setMtError(err?.error?.message ?? 'Error al añadir'),
      }
    )
  }



  function handleAddFixedProp(e: React.FormEvent) {
    e.preventDefault()
    if (!fpName.trim()) return
    setFpError('')
    const generatedCode = fpName.trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9_]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 50)
    addFixedProp.mutate(
      {
        code: generatedCode,
        name: fpName.trim(),
        type: fpType
      },
      {
        onSuccess: () => {
          setFpName('')
          setFpType('STRING')
          refetchProps()
          setShowAddFixedProp(false)
        },
        onError: (err: any) => setFpError(err?.error?.message ?? 'Error al añadir propiedad'),
      }
    )
  }

  function handleDeleteFixedProp(id: number) {
    if (!confirm('¿Eliminar esta propiedad fija? Los datos de los materiales asociados a esta clave seguirán existiendo en sus fichas técnicas, pero la propiedad ya no aparecerá como predefinida.')) return
    deleteFixedProp.mutate(id, {
      onSuccess: () => refetchProps()
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

        {/* Tipos de infraestructura */}
        <div className="bg-card rounded-xl border border-app-border p-5 h-fit">
          <h2 className="text-[15px] font-semibold text-fg mb-4">Tipos de infraestructura</h2>
          <ul className="divide-y divide-app-border mb-4 max-h-[260px] overflow-y-auto pr-3">
            {infraTypes.length === 0 && (
              <li className="py-2 text-sm text-muted">Sin tipos definidos</li>
            )}
            {infraTypes.map(it => {
              const CatIcon = getCategoryIcon(it.icon)
              return (
                <li key={it.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 truncate min-w-0">
                    <CatIcon className="w-4 h-4 shrink-0" style={{ color: getCategoryColor(it.color) }} />
                    <span className="text-sm text-fg truncate">{it.name}</span>
                  </div>
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => setEditingCat(it)}
                      className="text-xs text-primary bg-primary/10 hover:bg-primary/20 px-3 py-2 rounded-lg shrink-0 font-bold transition-all active:scale-95 touch-manipulation min-h-[36px] flex items-center justify-center"
                    >
                      Editar
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
          {canManage && (
            <button
              type="button"
              onClick={() => { setItError(''); setShowAddInfraType(true) }}
              className="w-full flex items-center justify-center gap-1.5 border-t border-app-border pt-4 mt-1 text-sm font-bold text-primary hover:text-[var(--primary-hover)] transition-colors"
            >
              <Plus size={15} /> Añadir tipo
            </button>
          )}
        </div>

        {/* Tipos de material */}
        <div className="bg-card rounded-xl border border-app-border p-5 h-fit">
          <h2 className="text-[15px] font-semibold text-fg mb-4">Tipos de material</h2>
          <ul className="divide-y divide-app-border mb-4 max-h-[350px] overflow-y-auto pr-3">
            {materialTypes.length === 0 && (
              <li className="py-2 text-sm text-muted">Sin tipos definidos</li>
            )}
            {materialTypes.map(mt => (
              <li key={mt.id} className="py-3.5 flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 truncate min-w-0">
                    <span className="text-sm font-semibold text-fg truncate">{mt.name}</span>
                  </div>
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => setEditingPropertiesMt(mt)}
                      className="text-xs text-primary bg-primary/10 hover:bg-primary/20 px-3 py-2 rounded-lg shrink-0 font-bold transition-all active:scale-95 touch-manipulation min-h-[36px] flex items-center justify-center"
                    >
                      Editar
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-1 mt-0.5">
                  {mt.categories.length === 0 ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted/20 text-muted font-medium border border-app-border/20">
                      Global (Todas)
                    </span>
                  ) : (
                    mt.categories.map(cat => (
                      <span key={cat.id} className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/15 font-medium">
                        {cat.name}
                      </span>
                    ))
                  )}
                </div>
              </li>
            ))}
          </ul>
          {canManage && (
            <button
              type="button"
              onClick={() => { setMtError(''); setShowAddMaterialType(true) }}
              className="w-full flex items-center justify-center gap-1.5 border-t border-app-border pt-4 mt-1 text-sm font-bold text-primary hover:text-[var(--primary-hover)] transition-colors"
            >
              <Plus size={15} /> Añadir tipo de material
            </button>
          )}
        </div>

        {/* Propiedades Fijas Globales */}
        <div className="bg-card rounded-xl border border-app-border p-5 h-fit">
          <h2 className="text-[15px] font-semibold text-fg mb-4">Propiedades Fijas de Materiales</h2>
          <ul className="divide-y divide-app-border mb-4 max-h-[300px] overflow-y-auto pr-3">
            {fixedProperties.length === 0 && (
              <li className="py-2 text-sm text-muted">Sin propiedades registradas</li>
            )}
            {fixedProperties.map(fp => (
              <li key={fp.id} className="py-2.5 flex items-center justify-between gap-2">
                <div className="flex flex-col min-w-0">
                  <span className="text-sm text-fg font-medium truncate">{fp.name}</span>
                  <span className="text-[10px] font-mono text-muted">Clave: {fp.code} · Tipo: {fp.type}</span>
                </div>
                {canManage && (
                  <button
                    onClick={() => handleDeleteFixedProp(fp.id)}
                    className="text-[10px] text-error hover:underline shrink-0"
                  >
                    Borrar
                  </button>
                )}
              </li>
            ))}
          </ul>
          {canManage && (
            <button
              type="button"
              onClick={() => { setFpError(''); setShowAddFixedProp(true) }}
              className="w-full flex items-center justify-center gap-1.5 border-t border-app-border pt-4 mt-1 text-sm font-bold text-primary hover:text-[var(--primary-hover)] transition-colors"
            >
              <Plus size={15} /> Añadir propiedad
            </button>
          )}
        </div>

        {/* Roles */}
        <div className="bg-card rounded-xl border border-app-border p-5 h-fit">
          <h2 className="text-[15px] font-semibold text-fg mb-4">Roles de Usuario</h2>
          <ul className="divide-y divide-app-border">
            {roles.length === 0 && (
              <li className="py-2 text-sm text-muted">Sin roles definidos</li>
            )}
            {roles.map(r => (
              <li key={r.id} className="py-2 flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-fg">{r.name}</span>
                <div className="flex gap-1 shrink-0">
                  {r.canWrite && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/15">
                      escritura
                    </span>
                  )}
                  {r.canManage && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-500 border border-amber-500/15">
                      gestión
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Configuración del Sistema (Geolocalización) */}
        <div className="bg-card rounded-xl border border-app-border p-5 h-fit col-span-1 md:col-span-2 xl:col-span-1">
          <h2 className="text-[15px] font-semibold text-fg mb-4">Configuración de Geolocalización</h2>
          {!isEditingSettings ? (
            <div className="space-y-4">
              <div className="border border-app-border/40 p-4 rounded-lg bg-app-bg/30 space-y-3">
                <div>
                  <span className="block text-[10px] uppercase tracking-wider text-muted font-bold">Municipio / Ciudad</span>
                  <span className="text-sm font-semibold text-fg">{defaultLocName || 'Sin definir'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider text-muted font-bold">Latitud</span>
                    <span className="text-xs font-mono text-fg">{defaultLat || 'Sin definir'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider text-muted font-bold">Longitud</span>
                    <span className="text-xs font-mono text-fg">{defaultLng || 'Sin definir'}</span>
                  </div>
                </div>
              </div>

              {cfgSuccess && <p className="text-emerald-500 text-xs font-semibold">{cfgSuccess}</p>}

              {canManage && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setCfgLat(defaultLat)
                      setCfgLng(defaultLng)
                      setCfgLocName(defaultLocName)
                      setIsEditingSettings(true)
                    }}
                    className="px-3.5 py-2 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-all active:scale-95 touch-manipulation min-h-[36px] flex items-center justify-center shadow-sm"
                  >
                    Modificar Configuración
                  </button>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-fg-secondary mb-1">Municipio / Ciudad por defecto</label>
                <input
                  type="text"
                  value={cfgLocName}
                  onChange={e => setCfgLocName(e.target.value)}
                  placeholder="Ej: Ciudad Real"
                  className={inputCls}
                  required
                />
              </div>

              {/* Map selection — opens a full-screen modal (mobile-friendly) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-fg-secondary">Coordenadas</label>
                <button
                  type="button"
                  onClick={openMapModal}
                  className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-all active:scale-95 touch-manipulation min-h-[40px]"
                >
                  <MapPin size={14} />
                  {cfgLat && cfgLng ? 'Cambiar ubicación en el mapa' : 'Seleccionar ubicación en el mapa'}
                </button>
                <div className="flex gap-3 text-[11px] text-muted font-mono">
                  <span>Lat: {cfgLat || '—'}</span>
                  <span>Lon: {cfgLng || '—'}</span>
                </div>
              </div>

              {cfgError && <p className="text-error text-xs">{cfgError}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingSettings(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-fg-secondary border border-app-border rounded-lg hover:bg-app-bg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={updateSettings.isPending}
                  className="px-3.5 py-2 text-xs font-semibold text-primary-fg bg-primary rounded-lg hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors shadow-sm"
                >
                  {updateSettings.isPending ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Mantenimiento de direcciones */}
        {canManage && (
          <div className="bg-card rounded-xl border border-app-border p-5 h-fit col-span-1 md:col-span-2 xl:col-span-1">
            <h2 className="text-[15px] font-semibold text-fg mb-4">Direcciones</h2>
            <p className="text-xs text-fg-secondary leading-relaxed mb-4">
              Recalcula la dirección de todas las ubicaciones con coordenadas a partir de su
              posición en el mapa. Útil tras cambios en el formato de direcciones. El proceso se ejecuta
              en el servidor en segundo plano y no es necesario mantener la pestaña abierta.
            </p>

            {(recalc.running || recalc.finished) && (
              <div className="mb-4 space-y-2">
                <div className="h-2 w-full bg-app-bg rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${recalc.total ? Math.round((recalc.done / recalc.total) * 100) : 0}%` }}
                  />
                </div>
                <p className="text-[11px] text-muted font-mono">
                  {recalc.running
                    ? `Recalculando ${recalc.done}/${recalc.total}…`
                    : `Completado: ${recalc.done}/${recalc.total}${recalc.failed ? ` · ${recalc.failed} con error` : ''}`}
                </p>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleRecalcAddresses}
                disabled={recalc.running}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 disabled:opacity-50 rounded-lg transition-all active:scale-95 touch-manipulation min-h-[36px] shadow-sm"
              >
                <MapPin size={14} />
                {recalc.running ? 'Recalculando…' : 'Recalcular direcciones'}
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Tema Visual (Apariencia) */}
      <div className="bg-card rounded-xl border border-app-border p-5 max-w-md">
        <h2 className="text-[15px] font-semibold text-fg mb-2">Tema visual</h2>
        <p className="text-xs text-fg-secondary leading-relaxed mb-4">
          Personaliza el aspecto de la aplicación eligiendo entre el tema claro y oscuro.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => { if (isDark) toggleTheme() }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
              !isDark
                ? 'border-primary bg-primary/10 text-primary shadow-sm'
                : 'border-app-border text-fg-secondary hover:bg-app-bg hover:text-fg'
            }`}
          >
            <Sun className="w-4 h-4" />
            Tema claro
          </button>
          <button
            type="button"
            onClick={() => { if (!isDark) toggleTheme() }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
              isDark
                ? 'border-primary bg-primary/10 text-primary shadow-sm'
                : 'border-app-border text-fg-secondary hover:bg-app-bg hover:text-fg'
            }`}
          >
            <Moon className="w-4 h-4" />
            Tema oscuro
          </button>
        </div>
      </div>

      {health?.version && (
        <p className="text-[11px] font-mono text-muted text-right">
          Versión desplegada: {health.version.slice(0, 7)}
        </p>
      )}

      {editingCat && (
        <CategoryEditModal
          category={editingCat}
          onClose={() => setEditingCat(null)}
        />
      )}

      {editingPropertiesMt && (
        <MaterialTypeEditModal
          materialType={editingPropertiesMt}
          onClose={() => setEditingPropertiesMt(null)}
        />
      )}

      {showMapModal && (
        <Modal title="Seleccionar ubicación por defecto" onClose={() => setShowMapModal(false)} size="full">
          <div className="flex-1 flex flex-col min-h-0 space-y-4">
            <div className="text-sm text-fg-secondary">
              Haz clic en el mapa o arrastra el marcador para seleccionar la ubicación por defecto.
            </div>
            <div className="flex-1 flex flex-col min-h-0">
              <LocationMap
                latitude={tempLat}
                longitude={tempLng}
                defaultCenter={[38.9863, -3.9291]}
                onChange={(lat, lng) => {
                  setTempLat(lat)
                  setTempLng(lng)
                }}
                className="min-h-0"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2 shrink-0 border-t border-app-border">
              <button
                type="button"
                onClick={() => setShowMapModal(false)}
                className="px-4 py-2 text-sm text-fg-secondary border border-app-border rounded-lg hover:bg-app-bg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmMap}
                className="px-4 py-2 text-sm text-primary-fg bg-primary rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showAddInfraType && (
        <Modal title="Nuevo tipo de infraestructura" onClose={() => setShowAddInfraType(false)} size="lg">
          <form onSubmit={handleAddInfraType} className="space-y-3">
            <input
              type="text"
              value={itName}
              onChange={e => setItName(e.target.value)}
              placeholder="Nombre del tipo"
              className={inputCls}
              required
              autoFocus
            />
            <div>
              <label className="block text-[10px] font-semibold text-fg-secondary mb-1">Seleccionar Icono</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 border border-app-border rounded-lg p-2 bg-card/50 max-h-[280px] overflow-y-auto">
                {CATEGORY_ICON_OPTIONS.map(opt => {
                  const OptIcon = getCategoryIcon(opt.name)
                  const isSelected = itIcon === opt.name
                  return (
                    <button
                      key={opt.name}
                      type="button"
                      onClick={() => setItIcon(opt.name)}
                      className={`flex items-center gap-1 p-1.5 rounded border text-[10px] transition-all hover:bg-primary/5 ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary font-bold'
                          : 'border-app-border text-muted hover:text-fg'
                      }`}
                      title={opt.label}
                    >
                      <OptIcon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{opt.label.split(' ')[0]}</span>
                    </button>
                  )
                })}
              </div>
            </div>
            {itError && <p className="text-error text-xs">{itError}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowAddInfraType(false)} className="px-4 py-2 text-sm text-fg-secondary border border-app-border rounded-lg hover:bg-app-bg transition-colors">Cancelar</button>
              <button type="submit" disabled={!itName.trim() || addInfraType.isPending} className="px-4 py-2 text-sm text-primary-fg bg-primary rounded-lg hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors">{addInfraType.isPending ? 'Añadiendo...' : 'Añadir'}</button>
            </div>
          </form>
        </Modal>
      )}

      {showAddMaterialType && (
        <Modal title="Nuevo tipo de material" onClose={() => setShowAddMaterialType(false)} size="md">
          <form onSubmit={handleAddMaterialType} className="space-y-3">
            <input
              type="text"
              value={mtName}
              onChange={e => setMtName(e.target.value)}
              placeholder="Nombre (ej: Bombilla LED)"
              className={inputCls}
              required
              autoFocus
            />
            {mtError && <p className="text-error text-xs">{mtError}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowAddMaterialType(false)} className="px-4 py-2 text-sm text-fg-secondary border border-app-border rounded-lg hover:bg-app-bg transition-colors">Cancelar</button>
              <button type="submit" disabled={!mtName.trim() || addMaterialType.isPending} className="px-4 py-2 text-sm text-primary-fg bg-primary rounded-lg hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors">{addMaterialType.isPending ? 'Añadiendo...' : 'Añadir'}</button>
            </div>
          </form>
        </Modal>
      )}

      {showAddFixedProp && (
        <Modal title="Nueva propiedad fija" onClose={() => setShowAddFixedProp(false)} size="md">
          <form onSubmit={handleAddFixedProp} className="space-y-3">
            <input
              type="text"
              value={fpName}
              onChange={e => setFpName(e.target.value)}
              placeholder="Nombre (ej: Fecha de Compra)"
              className={inputCls}
              required
              autoFocus
            />
            <select
              value={fpType}
              onChange={e => setFpType(e.target.value as any)}
              className={inputCls}
            >
              <option value="STRING">Texto (STRING)</option>
              <option value="DATE">Fecha (DATE)</option>
              <option value="NUMBER">Número (NUMBER)</option>
              <option value="BOOLEAN">Booleano (BOOLEAN)</option>
            </select>
            {fpError && <p className="text-error text-xs">{fpError}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowAddFixedProp(false)} className="px-4 py-2 text-sm text-fg-secondary border border-app-border rounded-lg hover:bg-app-bg transition-colors">Cancelar</button>
              <button type="submit" disabled={!fpName.trim() || addFixedProp.isPending} className="px-4 py-2 text-sm text-primary-fg bg-primary rounded-lg hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors">{addFixedProp.isPending ? 'Añadiendo...' : 'Añadir'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
