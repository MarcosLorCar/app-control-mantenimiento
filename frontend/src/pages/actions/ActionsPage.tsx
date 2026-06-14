import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, Plus, Calendar as CalendarIcon, List as ListIcon, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { useActions } from '../../hooks/useActions'
import { useLocations } from '../../hooks/useLocations'
import { RoleGuard } from '../../components/RoleGuard'
import { Modal } from '../../components/ui/Modal'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export function ActionsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: actions = [], isLoading: loadingActions } = useActions()
  const { data: locations = [] } = useLocations(undefined) // Fetch all for dropdown filter

  const [search, setSearch] = useState('')
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [selectedDayActions, setSelectedDayActions] = useState<{ date: Date; actions: any[] } | null>(null)

  const selectedLocationId = searchParams.get('locationId') ? Number(searchParams.get('locationId')) : null
  const currentView = searchParams.get('view') === 'calendar' ? 'calendar' : 'list'

  const selectedLoc = locations.find(l => l.id === selectedLocationId)

  // Filter actions based on search input and location hierarchy selection
  const filtered = actions.filter(a => {
    const matchesSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      (a.description ?? '').toLowerCase().includes(search.toLowerCase()) ||
      a.materials.some(am => am.material.name.toLowerCase().includes(search.toLowerCase())) ||
      (a.location?.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (a.performer?.fullName ?? '').toLowerCase().includes(search.toLowerCase())

    // Recursive location filtering: exact match or location path match
    const matchesLocation =
      !selectedLocationId ||
      a.locationId === selectedLocationId ||
      (selectedLoc && a.location?.path?.startsWith(selectedLoc.path))

    return matchesSearch && matchesLocation
  })

  const handleLocationChange = (locId: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (locId) {
        next.set('locationId', locId)
      } else {
        next.delete('locationId')
      }
      return next
    })
  }

  const setView = (view: 'list' | 'calendar') => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (view === 'list') {
        next.delete('view')
      } else {
        next.set('view', 'calendar')
      }
      return next
    })
  }

  // Monthly Calendar Grid Calculations
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1)
  const startDayOfWeek = firstDayOfMonth.getDay() // 0 = Sunday, 1 = Monday...
  const firstDayOffset = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const calendarDays: { date: Date; isCurrentMonth: boolean }[] = []

  // Prev month overflow days
  for (let i = firstDayOffset - 1; i >= 0; i--) {
    calendarDays.push({
      date: new Date(year, month - 1, daysInPrevMonth - i),
      isCurrentMonth: false,
    })
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({
      date: new Date(year, month, i),
      isCurrentMonth: true,
    })
  }

  // Next month overflow days
  const remainingCells = 42 - calendarDays.length
  for (let i = 1; i <= remainingCells; i++) {
    calendarDays.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false,
    })
  }

  const getActionsForDay = (date: Date) => {
    return filtered.filter(a => {
      const actionDate = new Date(a.performedAt)
      return (
        actionDate.getFullYear() === date.getFullYear() &&
        actionDate.getMonth() === date.getMonth() &&
        actionDate.getDate() === date.getDate()
      )
    })
  }

  const prevMonth = () =>
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  const nextMonth = () =>
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))

  // Months that have at least one action — for smart navigation
  const monthsWithActions = useMemo(() => {
    const seen = new Set<string>()
    const result: { year: number; month: number }[] = []
    for (const action of filtered) {
      const d = new Date(action.performedAt)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      if (!seen.has(key)) {
        seen.add(key)
        result.push({ year: d.getFullYear(), month: d.getMonth() })
      }
    }
    return result.sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month)
  }, [filtered])

  const prevWithActions = useMemo(() =>
    [...monthsWithActions].reverse().find(
      m => m.year < year || (m.year === year && m.month < month)
    ) ?? null
  , [monthsWithActions, year, month])

  const nextWithActions = useMemo(() =>
    monthsWithActions.find(
      m => m.year > year || (m.year === year && m.month > month)
    ) ?? null
  , [monthsWithActions, year, month])

  const isToday = (date: Date) => {
    const today = new Date()
    return (
      today.getFullYear() === date.getFullYear() &&
      today.getMonth() === date.getMonth() &&
      today.getDate() === date.getDate()
    )
  }

  const monthHeader = `${monthNames[month]} ${year}`

  return (
    <div className="flex flex-col min-h-full -m-5 md:-m-8">
      {/* Barra superior */}
      <div
        className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between px-5 sm:px-7 py-3 bg-card shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
          {/* Search bar */}
          <div className="flex items-center gap-2 bg-app-bg border border-app-border rounded-lg px-3 h-9 w-full sm:w-60">
            <Search className="w-4 h-4 text-muted shrink-0" />
            <input
              type="text"
              placeholder="Buscar título, material..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-[13px] text-fg placeholder-muted outline-none"
            />
          </div>

          {/* Location filter dropdown with indentation representing tree depth */}
          <div className="flex items-center gap-2 bg-app-bg border border-app-border rounded-lg px-2.5 h-9 w-full sm:w-60 shrink-0">
            <select
              value={selectedLocationId || ''}
              onChange={e => handleLocationChange(e.target.value)}
              className="flex-1 bg-transparent text-[13px] text-fg outline-none border-none cursor-pointer"
            >
              <option value="">Todas las ubicaciones</option>
              {locations.map(l => {
                const depth = l.path.split('/').filter(Boolean).length - 1
                const indent = '\u00A0'.repeat(depth * 3)
                return (
                  <option key={l.id} value={l.id}>
                    {indent}{l.name}
                  </option>
                )
              })}
            </select>
          </div>

          {/* View switcher */}
          <div className="flex items-center border border-app-border rounded-lg p-0.5 bg-app-bg shrink-0">
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-semibold transition-all ${
                currentView === 'list'
                  ? 'bg-primary text-primary-fg shadow-sm'
                  : 'text-muted hover:text-fg'
              }`}
            >
              <ListIcon className="w-3.5 h-3.5" /> Lista
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-semibold transition-all ${
                currentView === 'calendar'
                  ? 'bg-primary text-primary-fg shadow-sm'
                  : 'text-muted hover:text-fg'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" /> Calendario
            </button>
          </div>
        </div>

        <RoleGuard require="write">
          <button
            onClick={() => navigate('/actions/new')}
            className="flex items-center justify-center gap-1.5 bg-primary text-primary-fg text-[13px] font-medium px-4 h-9 rounded-lg hover:bg-[var(--primary-hover)] transition-colors shrink-0 w-full md:w-auto"
          >
            <Plus className="w-4 h-4" />
            Nuevo Trabajo
          </button>
        </RoleGuard>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 p-5 md:p-7 gap-5">
        <div className="flex-1 min-w-0 flex flex-col">
          <p className="text-[13px] text-muted mb-3">
            {filtered.length} trabajo{filtered.length !== 1 ? 's' : ''}
          </p>

          {loadingActions ? (
            <div className="flex-1 flex items-center justify-center text-muted text-sm">Cargando...</div>
          ) : currentView === 'list' ? (
            <div className="bg-card rounded-xl border border-app-border flex flex-col">
              <div
                className="hidden md:flex items-center h-10 bg-app-bg text-[11px] font-semibold text-muted uppercase tracking-wider shrink-0"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <div className="w-14 px-4">ID</div>
                <div className="flex-1 px-3">Título</div>
                <div className="w-44 px-3">Ubicación</div>
                <div className="w-32 px-3">Materiales</div>
                <div className="w-24 px-3">Fecha</div>
              </div>

              <div>
                {filtered.length === 0 && (
                  <div className="flex items-center justify-center h-24 text-muted text-sm">
                    {search ? 'Sin resultados.' : 'No hay trabajos registrados.'}
                  </div>
                )}
                {filtered.map(action => (
                  <div
                    key={action.id}
                    onClick={() => navigate(`/actions/${action.id}`)}
                    className="flex flex-col md:flex-row md:items-center min-h-[52px] py-3 md:py-0 text-[13px] cursor-pointer hover:bg-app-bg transition-colors px-4 md:px-0"
                    style={{ borderBottom: '1px solid var(--border)' }}
                  >
                    <div className="flex items-center justify-between md:justify-start md:w-14 md:px-4 mb-1 md:mb-0">
                      <span className="text-muted font-mono">#{action.id}</span>
                      {/* Mobile date badge */}
                      <span className="text-muted text-[11px] md:hidden">{formatDate(action.performedAt)}</span>
                    </div>
                    <div className="flex-1 md:px-3 text-fg font-medium truncate mb-1 md:mb-0 text-[14px] md:text-[13px]">
                      {action.title}
                    </div>
                    
                    {/* Mobile metadata detail block */}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted md:hidden mb-1 md:mb-0">
                      {action.location?.name && (
                        <span>Ubicación: <span className="text-fg-secondary font-medium">{action.location.name}</span></span>
                      )}
                      {action.materials.length > 0 && (
                        <span>
                          Materiales:{' '}
                          <span className="text-primary font-semibold">
                            {action.materials.length === 1
                              ? action.materials[0].material.name
                              : `${action.materials.length} materiales`}
                          </span>
                        </span>
                      )}
                    </div>

                    <div className="hidden md:block w-44 px-3 text-fg-secondary truncate">
                      {action.location?.name ?? <span className="text-muted">—</span>}
                    </div>
                    <div className="hidden md:block w-32 px-3 text-fg-secondary truncate">
                      {action.materials.length === 0 ? (
                        <span className="text-muted">—</span>
                      ) : action.materials.length === 1 ? (
                        action.materials[0].material.name
                      ) : (
                        <span className="font-semibold text-primary">{action.materials.length} materiales</span>
                      )}
                    </div>
                    <div className="hidden md:block w-24 px-3 text-muted">{formatDate(action.performedAt)}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-app-border p-5 flex flex-col shadow-sm">
              {/* Month header & navigation */}
              <div className="flex items-center justify-between mb-4 shrink-0">
                <div className="flex items-center gap-1">
                  {/* Skip to prev month with actions */}
                  <button
                    onClick={() => prevWithActions && setCurrentDate(new Date(prevWithActions.year, prevWithActions.month, 1))}
                    disabled={!prevWithActions}
                    title={prevWithActions ? `Ir a ${monthNames[prevWithActions.month]} ${prevWithActions.year}` : 'No hay meses anteriores con trabajos'}
                    className="p-1.5 border border-app-border rounded-lg transition-colors disabled:opacity-25 disabled:cursor-not-allowed text-primary hover:bg-primary/10 hover:border-primary/40"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>

                  <button
                    onClick={prevMonth}
                    className="p-1.5 hover:bg-app-bg border border-app-border rounded-lg text-fg-secondary hover:text-fg transition-colors"
                    title="Mes anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1.5 mx-1">
                    {/* Month Selector */}
                    <select
                      value={month}
                      onChange={e => setCurrentDate(new Date(year, Number(e.target.value), 1))}
                      className="bg-card text-sm font-bold text-fg border border-app-border rounded-lg px-2.5 py-1.5 outline-none cursor-pointer focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                    >
                      {monthNames.map((name, i) => (
                        <option key={i} value={i}>{name}</option>
                      ))}
                    </select>

                    {/* Year Selector */}
                    <select
                      value={year}
                      onChange={e => setCurrentDate(new Date(Number(e.target.value), month, 1))}
                      className="bg-card text-sm font-bold text-fg border border-app-border rounded-lg px-2.5 py-1.5 outline-none cursor-pointer focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                    >
                      {Array.from({ length: 26 }, (_, i) => {
                        const yr = new Date().getFullYear() - 15 + i
                        return <option key={yr} value={yr}>{yr}</option>
                      })}
                    </select>
                  </div>

                  <button
                    onClick={nextMonth}
                    className="p-1.5 hover:bg-app-bg border border-app-border rounded-lg text-fg-secondary hover:text-fg transition-colors"
                    title="Siguiente mes"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {/* Skip to next month with actions */}
                  <button
                    onClick={() => nextWithActions && setCurrentDate(new Date(nextWithActions.year, nextWithActions.month, 1))}
                    disabled={!nextWithActions}
                    title={nextWithActions ? `Ir a ${monthNames[nextWithActions.month]} ${nextWithActions.year}` : 'No hay meses siguientes con trabajos'}
                    className="p-1.5 border border-app-border rounded-lg transition-colors disabled:opacity-25 disabled:cursor-not-allowed text-primary hover:bg-primary/10 hover:border-primary/40"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="text-xs font-semibold text-primary hover:underline px-3 py-1.5 rounded-lg border border-app-border hover:bg-app-bg transition-all"
                >
                  Hoy
                </button>
              </div>

              {/* Weekdays header */}
              <div className="grid grid-cols-7 text-center font-bold text-muted text-[11px] uppercase tracking-wider border-b border-app-border pb-2 shrink-0">
                {dayNames.map(d => (
                  <div key={d} className="py-1">{d}</div>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 divide-x divide-y divide-app-border/40 border-l border-b border-r border-app-border/40">
                {calendarDays.map((cell, idx) => {
                  const cellActions = getActionsForDay(cell.date)
                  const active = isToday(cell.date)
                  const hasActions = cellActions.length > 0

                  const handleCellClick = () => {
                    if (cellActions.length === 1) {
                      navigate(`/actions/${cellActions[0].id}`)
                    } else if (cellActions.length > 1) {
                      setSelectedDayActions({ date: cell.date, actions: cellActions })
                    }
                  }

                  return (
                    <div
                      key={idx}
                      onClick={handleCellClick}
                      className={`min-h-[75px] md:min-h-[95px] p-2 flex flex-col gap-1 transition-colors cursor-pointer ${
                        cell.isCurrentMonth
                          ? hasActions
                            ? 'bg-primary-tint bg-primary-tint-hover'
                            : 'bg-card hover:bg-app-bg/30'
                          : 'bg-app-bg/25 text-muted/65 hover:bg-app-bg/30'
                      } ${hasActions ? 'border-l-4 border-l-primary' : ''}`}
                    >
                      {/* Day Number */}
                      <div className="flex items-center justify-between shrink-0">
                        <span
                          className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                            active
                              ? 'bg-primary text-primary-fg'
                              : 'text-fg-secondary'
                          }`}
                        >
                          {cell.date.getDate()}
                        </span>
                      </div>

                      {/* Desktop Actions List */}
                      <div className="hidden md:flex flex-1 flex-col min-h-0 overflow-y-auto space-y-1 pr-0.5">
                        {cellActions.map(action => (
                          <div
                            key={action.id}
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/actions/${action.id}`)
                            }}
                            className="truncate text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-all font-semibold cursor-pointer border border-primary/15"
                            title={`${action.title} - ${action.location?.name || ''}`}
                          >
                            {action.title}
                          </div>
                        ))}
                      </div>

                      {/* Mobile Actions Badge (Centered, no scroll) */}
                      {hasActions && (
                        <div className="md:hidden flex-1 flex items-center justify-center overflow-visible">
                          <span className="w-7 h-7 rounded-full bg-primary text-primary-fg flex items-center justify-center text-xs font-extrabold shadow-md shrink-0">
                            {cellActions.length}
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions of the Day Modal (mostly for mobile/tablet) */}
      {selectedDayActions && (
        <Modal
          title={`Trabajos del ${selectedDayActions.date.getDate()} de ${monthNames[selectedDayActions.date.getMonth()]}`}
          onClose={() => setSelectedDayActions(null)}
        >
          <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-3">
            {selectedDayActions.actions.map(action => (
              <div
                key={action.id}
                onClick={() => {
                  setSelectedDayActions(null)
                  navigate(`/actions/${action.id}`)
                }}
                className="p-3 bg-card hover:bg-app-bg border border-app-border rounded-lg cursor-pointer transition-colors space-y-1 hover:border-primary/40"
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="font-semibold text-sm text-fg">{action.title}</span>
                  <span className="text-[10px] text-muted font-mono shrink-0">#{action.id}</span>
                </div>
                {action.location && (
                  <p className="text-xs text-muted">
                    Ubicación: <span className="text-fg-secondary font-medium">{action.location.name}</span>
                  </p>
                )}
                {action.performer && (
                  <p className="text-[11px] text-muted">
                    Realizado por: {action.performer.fullName}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  )
}
