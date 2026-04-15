import { Fragment, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import type { ID, ScheduleItem } from '../model/types'
import { Breadcrumbs } from '../components/Breadcrumbs'
import { Tooltip } from '../components/Tooltip'

type ViewMode = 'list' | 'timeline'
type DraftScheduleState = { focusBoardId?: ID; draftSchedule?: Partial<ScheduleItem> }

function IconPlus() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  )
}

function startOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function formatInputDate(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatBadgeDate(value: number) {
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function sanitizeDraftTitle(value?: string) {
  if (!value) return ''
  return value.trim().toLowerCase() === 'new card' ? '' : value
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

interface EventModalProps {
  onClose: () => void
  onSave: (data: Partial<ScheduleItem>) => Promise<void>
  initialDate?: Date
  initialEvent?: ScheduleItem
  draftSchedule?: Partial<ScheduleItem>
  boards: { id: ID; title: string }[]
  isSaving: boolean
}

function EventModal({ onClose, onSave, initialDate, initialEvent, draftSchedule, boards, isSaving }: EventModalProps) {
  const [title, setTitle] = useState(initialEvent?.title ?? sanitizeDraftTitle(draftSchedule?.title))
  const [boardId, setBoardId] = useState<ID | undefined>(initialEvent?.boardId ?? draftSchedule?.boardId ?? undefined)
  const [startDateStr, setStartDateStr] = useState(initialEvent ? formatInputDate(new Date(initialEvent.startDate)) : initialDate ? formatInputDate(initialDate) : formatInputDate(new Date()))
  const [endDateStr, setEndDateStr] = useState(initialEvent ? formatInputDate(new Date(initialEvent.endDate)) : initialDate ? formatInputDate(initialDate) : formatInputDate(new Date()))
  const [note, setNote] = useState(initialEvent?.note ?? draftSchedule?.note ?? '')
  const [status, setStatus] = useState(initialEvent?.status ?? draftSchedule?.status ?? 'Production')

  const labelStyle: CSSProperties = { display: 'block', marginBottom: 8, color: 'rgb(var(--c-muted))', fontSize: 12, fontWeight: 600, lineHeight: 1.2 }
  const inputStyle: CSSProperties = { width: '100%', minWidth: 0, boxSizing: 'border-box' }

  return (
    <div className="modal-overlay" onClick={isSaving ? undefined : onClose} style={{ position: 'fixed', inset: 0, zIndex: 'var(--z-modal)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', background: 'rgba(2,4,12,0.72)', backdropFilter: 'blur(8px)' }}>
      <div className="modal-content animate-scale-in glass-panel" onClick={(e) => e.stopPropagation()} style={{ position: 'relative', width: 'min(560px, calc(100vw - 48px))', padding: 32, borderRadius: 24 }}>
        {isSaving && (
          <div className="glass-loader">
            <div className="glass-loader__spinner" />
            <span>Saving task...</span>
          </div>
        )}

        <h2 className="font-display" style={{ marginBottom: 24, fontSize: 24, fontWeight: 800 }}>
          {initialEvent ? 'Edit Schedule Task' : 'Schedule Production Task'}
        </h2>

        <div className={isSaving ? 'glass-loading-content' : undefined} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={labelStyle}>Task Title</label>
            <input autoFocus className="input-base" value={title} style={inputStyle} onChange={(e) => setTitle(e.target.value)} placeholder="Task name" disabled={isSaving} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(160px, 0.9fr)', gap: 16 }}>
            <div>
              <label style={labelStyle}>Project</label>
              <select className="input-base" style={inputStyle} value={boardId || ''} onChange={(e) => setBoardId(e.target.value || undefined)} disabled={isSaving}>
                <option value="">General studio task</option>
                {boards.map((board) => <option key={board.id} value={board.id}>{board.title}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select className="input-base" style={inputStyle} value={status} onChange={(e) => setStatus(e.target.value)} disabled={isSaving}>
                <option value="Production">Production</option>
                <option value="Review">Review</option>
                <option value="Finalizing">Finalizing</option>
                <option value="Meeting">Meeting</option>
                <option value="Complete">Complete</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
            <div>
              <label style={labelStyle}>Start Date</label>
              <input type="date" className="input-base" style={inputStyle} value={startDateStr} onChange={(e) => setStartDateStr(e.target.value)} disabled={isSaving} />
            </div>
            <div>
              <label style={labelStyle}>End Date</label>
              <input type="date" className="input-base" style={inputStyle} value={endDateStr} onChange={(e) => setEndDateStr(e.target.value)} disabled={isSaving} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Production Notes</label>
            <textarea className="input-base" style={{ ...inputStyle, minHeight: 128, resize: 'vertical' }} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Task details and context" disabled={isSaving} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button className="btn btn-ghost" onClick={onClose} disabled={isSaving}>Cancel</button>
            <button
              className="btn btn-primary"
              disabled={!title.trim() || isSaving}
              onClick={async () => {
                await onSave({
                  title: title.trim(),
                  boardId,
                  linkedCardId: initialEvent?.linkedCardId ?? draftSchedule?.linkedCardId,
                  note,
                  status,
                  startDate: new Date(startDateStr).getTime(),
                  endDate: new Date(endDateStr).getTime(),
                })
              }}
            >
              {isSaving ? 'Saving...' : initialEvent ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function MiniCalendar({ selectedDate, onSelect, currentDate, events, focusBoardId }: { selectedDate: Date | null; onSelect: (d: Date) => void; currentDate: Date; events: ScheduleItem[]; focusBoardId?: ID }) {
  const month = currentDate.getMonth()
  const year = currentDate.getFullYear()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()
  const cells: (number | null)[] = Array(firstDay).fill(null)
  for (let i = 1; i <= daysInMonth; i++) cells.push(i)

  const boardEvents = focusBoardId ? events.filter((event) => event.boardId === focusBoardId) : events

  const getDayCoverage = (day: number, source: ScheduleItem[]) => {
    const cellDate = startOfDay(new Date(year, month, day)).getTime()
    const matching = source.find((event) => {
      const start = startOfDay(new Date(event.startDate)).getTime()
      const end = startOfDay(new Date(event.endDate)).getTime()
      return cellDate >= start && cellDate <= end
    })
    if (!matching) return { hasEvent: false, starts: false, ends: false }
    const start = startOfDay(new Date(matching.startDate)).getTime()
    const end = startOfDay(new Date(matching.endDate)).getTime()
    return { hasEvent: true, starts: cellDate === start, ends: cellDate === end }
  }

  return (
    <div className="glass-panel" style={{ borderRadius: 20, padding: 18 }}>
      <div className="font-display" style={{ textAlign: 'center', fontSize: 18, fontWeight: 700, marginBottom: 14 }}>
        {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0, textAlign: 'center' }}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
          <div key={`${day}-${index}`} style={{ fontSize: 10, color: 'rgb(var(--c-faint))', fontWeight: 700, paddingBottom: 8 }}>{day}</div>
        ))}
        {cells.map((day, index) => {
          if (!day) return <div key={index} />
          const isSelected = !!selectedDate && startOfDay(selectedDate).getTime() === startOfDay(new Date(year, month, day)).getTime()
          const focusCoverage = getDayCoverage(day, boardEvents)
          const anyCoverage = getDayCoverage(day, events)
          const radius = focusCoverage.hasEvent
            ? focusCoverage.starts && focusCoverage.ends
              ? '12px'
              : focusCoverage.starts
                ? '12px 0 0 12px'
                : focusCoverage.ends
                  ? '0 12px 12px 0'
                  : '0'
            : '12px'

          return (
            <button
              key={index}
              className="mini-calendar-cell"
              onClick={() => onSelect(new Date(year, month, day))}
              style={{
                width: '100%',
                height: 34,
                margin: 0,
                padding: 0,
                borderRadius: radius,
                border: 'none',
                background: isSelected ? 'rgba(var(--c-brand), 0.28)' : focusCoverage.hasEvent ? 'rgba(var(--c-brand), 0.2)' : 'transparent',
                boxShadow: isSelected ? 'inset 0 0 0 1px rgba(var(--c-brand), 0.75)' : 'none',
                color: anyCoverage.hasEvent ? 'rgb(var(--c-text))' : 'rgb(var(--c-muted))',
                fontSize: 11,
                fontWeight: anyCoverage.hasEvent ? 700 : 500,
                cursor: 'pointer',
              }}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function TimelineView({ boards, items, currentDate }: { boards: { id: ID; title: string; color: string }[]; items: ScheduleItem[]; currentDate: Date }) {
  const start = startOfDay(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1))
  const end = startOfDay(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0))
  const visibleDates: Date[] = []
  for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) visibleDates.push(new Date(day))

  const dayWidth = 64
  const timelineWidth = visibleDates.length * dayWidth

  return (
    <div className="glass-panel premium-scroll" style={{ borderRadius: 24, overflow: 'auto', maxHeight: 'calc(100vh - 240px)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `220px ${timelineWidth}px`, minWidth: 220 + timelineWidth }}>
        <div style={{ position: 'sticky', left: 0, zIndex: 10, padding: '16px 18px', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgb(var(--c-muted))', background: 'rgb(var(--c-surface))', borderBottom: '1px solid rgba(var(--c-border), 0.7)' }}>
          Projects
        </div>
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(var(--c-border), 0.7)' }}>
          {visibleDates.map((date) => (
            <div key={date.toISOString()} style={{ width: dayWidth, flexShrink: 0, padding: '16px 8px', textAlign: 'center', borderLeft: '1px solid rgba(var(--c-border), 0.35)', fontSize: 11, color: 'rgb(var(--c-muted))' }}>
              <div>{date.toLocaleDateString(undefined, { weekday: 'short' })}</div>
              <div style={{ marginTop: 2, fontWeight: 700, color: 'rgb(var(--c-text))' }}>{date.getDate()}</div>
            </div>
          ))}
        </div>

        {boards.map((board) => {
          const boardItems = items.filter((item) => item.boardId === board.id)
          return (
            <Fragment key={board.id}>
              <div key={`${board.id}-label`} style={{ position: 'sticky', left: 0, zIndex: 10, padding: '18px', display: 'flex', alignItems: 'center', gap: 10, background: 'rgb(var(--c-surface))', borderBottom: '1px solid rgba(var(--c-border), 0.45)' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: board.color, boxShadow: `0 0 16px ${board.color}88` }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{board.title}</div>
                  <div style={{ fontSize: 11, color: 'rgb(var(--c-muted))' }}>{boardItems.length} scheduled items</div>
                </div>
              </div>
              <div key={`${board.id}-row`} style={{ position: 'relative', width: timelineWidth, minHeight: 78, borderBottom: '1px solid rgba(var(--c-border), 0.45)' }}>
                {visibleDates.map((date, index) => (
                  <div key={`${board.id}-${date.toISOString()}`} style={{ position: 'absolute', top: 0, left: index * dayWidth, width: dayWidth, height: '100%', borderLeft: '1px solid rgba(var(--c-border), 0.25)' }} />
                ))}
                {boardItems.map((item) => {
                  const itemStart = startOfDay(new Date(item.startDate))
                  const itemEnd = startOfDay(new Date(item.endDate))
                  const offset = Math.max(0, Math.floor((itemStart.getTime() - start.getTime()) / 86400000))
                  const duration = Math.max(1, Math.floor((itemEnd.getTime() - itemStart.getTime()) / 86400000) + 1)
                  return (
                    <Tooltip key={`${item.id}-tip`} content={`${item.title} • ${formatBadgeDate(item.startDate)} to ${formatBadgeDate(item.endDate)}`}>
                      <div
                        key={item.id}
                        className={item.status === 'Production' ? 'timeline-task timeline-task--active' : 'timeline-task'}
                        style={{
                          position: 'absolute',
                          left: offset * dayWidth + 6,
                          top: 20,
                          width: duration * dayWidth - 12,
                          minWidth: 52,
                          padding: '10px 12px',
                          borderRadius: 14,
                          background: board.color,
                          color: '#fff',
                          fontSize: 12,
                          fontWeight: 700,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          boxShadow: item.status === 'Production' ? `0 0 18px ${board.color}88` : 'none',
                        }}
                      >
                        {item.title}
                      </div>
                    </Tooltip>
                  )
                })}
              </div>
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}

export function CalendarPage() {
  const { workspaceId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state as DraftScheduleState | null) ?? {}

  const workspace = useAppStore((s) => (workspaceId ? s.workspaces[workspaceId] : undefined))
  const boardsById = useAppStore((s) => s.boards)
  const scheduleItemsById = useAppStore((s) => s.scheduleItems)
  const createScheduleItem = useAppStore((s) => s.createScheduleItem)
  const updateScheduleItem = useAppStore((s) => s.updateScheduleItem)

  const [currentDate, setCurrentDate] = useState(new Date())
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(state.draftSchedule ? 'create' : null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [editingItemId, setEditingItemId] = useState<ID | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [focusBoardId, setFocusBoardId] = useState<ID | undefined>(state.focusBoardId ?? state.draftSchedule?.boardId)
  const [draftSchedule, setDraftSchedule] = useState<Partial<ScheduleItem> | undefined>(state.draftSchedule)
  const [isSavingTask, setIsSavingTask] = useState(false)

  useEffect(() => {
    if (state.focusBoardId) setFocusBoardId(state.focusBoardId)
    if (state.draftSchedule) {
      setDraftSchedule(state.draftSchedule)
      setFocusBoardId(state.draftSchedule.boardId ?? state.focusBoardId)
      setModalMode('create')
    }
  }, [state.draftSchedule, state.focusBoardId])

  const workspaceBoards = useMemo(() => Object.values(boardsById).filter((board) => board.workspaceId === workspaceId).sort((a, b) => b.updatedAt - a.updatedAt), [boardsById, workspaceId])
  const workspaceSchedule = useMemo(() => Object.values(scheduleItemsById).filter((item) => item.workspaceId === workspaceId).sort((a, b) => a.startDate - b.startDate), [scheduleItemsById, workspaceId])
  const filteredSchedule = useMemo(() => focusBoardId ? workspaceSchedule.filter((item) => item.boardId === focusBoardId) : workspaceSchedule, [workspaceSchedule, focusBoardId])

  const groupedEvents = useMemo(() => {
    const groups = new Map<string, { label: string; items: ScheduleItem[]; time: number }>()
    for (const item of filteredSchedule) {
      const date = new Date(item.startDate)
      const key = `${date.getFullYear()}-${date.getMonth()}`
      if (!groups.has(key)) {
        groups.set(key, {
          label: date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
          items: [],
          time: new Date(date.getFullYear(), date.getMonth(), 1).getTime(),
        })
      }
      groups.get(key)!.items.push(item)
    }
    return Array.from(groups.values())
      .sort((a, b) => a.time - b.time)
      .map((group) => ({ ...group, items: group.items.sort((a, b) => a.startDate - b.startDate) }))
  }, [filteredSchedule])

  const handleSave = async (data: Partial<ScheduleItem>) => {
    setIsSavingTask(true)
    await delay(520)
    if (modalMode === 'edit' && editingItemId) updateScheduleItem(editingItemId, data)
    else if (workspaceId) {
      createScheduleItem(workspaceId, data)
      if (data.boardId) setFocusBoardId(data.boardId)
    }
    setIsSavingTask(false)
    setDraftSchedule(undefined)
    setModalMode(null)
    if (location.state) navigate(location.pathname, { replace: true })
  }

  if (!workspaceId || !workspace) return null

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '32px 36px', gap: 22 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Breadcrumbs items={[{ label: workspace.name, to: `/w/${workspaceId}/dashboard` }, { label: 'Calendar' }]} />
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgb(var(--c-muted))', marginBottom: 6 }}>Production Calendar</div>
            <h1 className="font-display" style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.05 }}>Schedule</h1>
            <p style={{ marginTop: 8, color: 'rgb(var(--c-muted))', fontSize: 13 }}>Move ideas into production, track durations in a timeline, and keep each task tied to its project context.</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div className="view-switcher">
              {(['list', 'timeline'] as ViewMode[]).map((mode) => (
                <button key={mode} className={viewMode === mode ? 'view-switcher__btn active' : 'view-switcher__btn'} onClick={() => setViewMode(mode)}>
                  {mode === 'list' ? 'List' : 'Timeline'}
                </button>
              ))}
            </div>
            <button className="btn btn-primary" onClick={() => { setModalMode('create'); setEditingItemId(null) }}>
              <IconPlus /> Add Task
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: viewMode === 'list' ? 'minmax(0, 1fr) 300px' : '1fr', gap: 20, minHeight: 0, flex: 1 }}>
        {viewMode === 'list' ? (
          <>
            <div className="premium-scroll" style={{ minHeight: 0, overflowY: 'auto', paddingRight: 4 }}>
              <div className="glass-panel" style={{ borderRadius: 24, padding: 18, marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button className="btn btn-ghost" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}>Prev</button>
                  <button className="btn btn-ghost" onClick={() => setCurrentDate(new Date())}>Today</button>
                  <button className="btn btn-ghost" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}>Next</button>
                  <div className="font-display" style={{ fontSize: 22, fontWeight: 700, marginLeft: 6 }}>{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</div>
                </div>
                <select className="input-base" value={focusBoardId || ''} onChange={(e) => setFocusBoardId(e.target.value || undefined)} style={{ maxWidth: 240 }}>
                  <option value="">All Projects</option>
                  {workspaceBoards.map((board) => <option key={board.id} value={board.id}>{board.title}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {groupedEvents.length === 0 ? (
                  <div className="glass-panel" style={{ borderRadius: 24, padding: 28, textAlign: 'center' }}>
                    <div className="font-display" style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>{focusBoardId ? 'The board is clear' : 'No tasks scheduled'}</div>
                    <div style={{ color: 'rgb(var(--c-muted))' }}>{focusBoardId ? 'Promote ideas from the whiteboard to start the schedule.' : 'Choose a day from the mini calendar and add the next production task.'}</div>
                  </div>
                ) : groupedEvents.map((group) => {
                  return (
                    <div key={group.label} style={{ display: 'flex', gap: 18 }}>
                      <div className="glass-panel" style={{ width: 92, flexShrink: 0, borderRadius: 20, padding: '18px 10px', textAlign: 'center', alignSelf: 'flex-start' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgb(var(--c-muted))' }}>Month</div>
                        <div className="font-display" style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.2, marginTop: 8 }}>{group.label}</div>
                      </div>

                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {group.items.map((item, index) => {
                          const board = item.boardId ? boardsById[item.boardId] : undefined
                          return (
                            <div key={`${item.id}-${index}`} className={item.status === 'Production' ? 'schedule-card schedule-card--active' : 'schedule-card'} onClick={() => { setEditingItemId(item.id); setModalMode('edit') }} role="button" tabIndex={0}>
                              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                    <span className="badge badge-cyan">{board?.title ?? 'General Studio'}</span>
                                    <span className="badge">{item.status}</span>
                                    {item.linkedCardId && <span className="badge badge-brand">Idea linked</span>}
                                  </div>
                                  <h3 className="font-display" style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.1, marginBottom: 8 }}>{item.title}</h3>
                                  <div style={{ fontSize: 12, color: 'rgb(var(--c-muted))', marginBottom: 10 }}>{formatBadgeDate(item.startDate)} - {formatBadgeDate(item.endDate)}</div>
                                  {item.note && <div style={{ fontSize: 13, color: 'rgb(var(--c-text))', maxWidth: 640, whiteSpace: 'pre-wrap' }}>{item.note}</div>}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                                  {item.boardId && (
                                    <Link to={`/w/${workspaceId}/project/${item.boardId}`} onClick={(e) => e.stopPropagation()} className="btn btn-ghost" style={{ textDecoration: 'none' }}>
                                      Open Board
                                    </Link>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <MiniCalendar
                currentDate={currentDate}
                selectedDate={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date)
                  setDraftSchedule((current) => ({ ...current, boardId: current?.boardId ?? focusBoardId, startDate: date.getTime(), endDate: date.getTime() }))
                  setModalMode('create')
                  setEditingItemId(null)
                }}
                events={workspaceSchedule}
                focusBoardId={focusBoardId}
              />

              <div className="glass-panel" style={{ borderRadius: 20, padding: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgb(var(--c-muted))', marginBottom: 12 }}>Focus</div>
                <div style={{ fontSize: 13, color: 'rgb(var(--c-text))' }}>{focusBoardId ? boardsById[focusBoardId]?.title : 'All projects'}</div>
                <div style={{ marginTop: 8, fontSize: 12, color: 'rgb(var(--c-muted))' }}>Clicking a date creates a quick-add task anchored to that day. When a project is selected, highlighted cells show that project's workload.</div>
              </div>
            </div>
          </>
        ) : (
          <div className="premium-scroll" style={{ minHeight: 0, overflow: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginBottom: 16 }}>
              <div className="font-display" style={{ fontSize: 24, fontWeight: 700 }}>{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</div>
              <div style={{ display: 'flex', gap: 10 }}>
                <select className="input-base" value={focusBoardId || ''} onChange={(e) => setFocusBoardId(e.target.value || undefined)} style={{ minWidth: 220 }}>
                  <option value="">All Projects</option>
                  {workspaceBoards.map((board) => <option key={board.id} value={board.id}>{board.title}</option>)}
                </select>
                <button className="btn btn-ghost" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}>Prev</button>
                <button className="btn btn-ghost" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}>Next</button>
              </div>
            </div>
            {filteredSchedule.length === 0 ? (
              <div className="glass-panel" style={{ borderRadius: 24, padding: 42, minHeight: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <div>
                  <div className="font-display" style={{ fontSize: 24, fontWeight: 700, marginBottom: 10 }}>The board is clear</div>
                  <div style={{ color: 'rgb(var(--c-muted))' }}>Promote ideas from the whiteboard to start the schedule.</div>
                </div>
              </div>
            ) : (
              <TimelineView boards={focusBoardId ? workspaceBoards.filter((board) => board.id === focusBoardId) : workspaceBoards} items={filteredSchedule} currentDate={currentDate} />
            )}
          </div>
        )}
      </div>

      {modalMode && (
        <EventModal
          boards={workspaceBoards}
          initialDate={selectedDate ?? undefined}
          initialEvent={editingItemId ? scheduleItemsById[editingItemId] : undefined}
          draftSchedule={editingItemId ? undefined : draftSchedule}
          isSaving={isSavingTask}
          onClose={() => { if (isSavingTask) return; setModalMode(null); setDraftSchedule(undefined) }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
