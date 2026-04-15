import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { Breadcrumbs } from '../components/Breadcrumbs'
import { Modal } from '../components/Modal'

function currency(value: number) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="glass-panel" style={{ padding: 18, borderRadius: 20 }}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgb(var(--c-muted))', marginBottom: 8 }}>
        {label}
      </div>
      <div className="font-display" style={{ fontSize: 28, fontWeight: 800, lineHeight: 1 }}>{value}</div>
      <div style={{ marginTop: 8, color: 'rgb(var(--c-muted))', fontSize: 12 }}>{detail}</div>
    </div>
  )
}

const BOARD_COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899']

export function DashboardPage() {
  const { workspaceId } = useParams()
  const navigate = useNavigate()
  const ws = useAppStore((s) => (workspaceId ? s.workspaces[workspaceId] : undefined))
  const boardsById = useAppStore((s) => s.boards)
  const scheduleItems = useAppStore((s) => s.scheduleItems)
  const transactions = useAppStore((s) => s.transactions)
  const createBoard = useAppStore((s) => s.createBoard)

  const [projectModalOpen, setProjectModalOpen] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [projectColor, setProjectColor] = useState(BOARD_COLORS[0])
  const [isCreatingProject, setIsCreatingProject] = useState(false)

  const projects = useMemo(() => {
    if (!workspaceId) return []
    return Object.values(boardsById)
      .filter((b) => b.workspaceId === workspaceId)
      .sort((a, b) => b.updatedAt - a.updatedAt)
  }, [boardsById, workspaceId])

  const projectMetrics = useMemo(() => {
    const byBoard = new Map<string, { total: number; completed: number }>()
    for (const board of projects) byBoard.set(board.id, { total: 0, completed: 0 })
    for (const item of Object.values(scheduleItems)) {
      if (!item.boardId || !byBoard.has(item.boardId) || item.workspaceId !== workspaceId) continue
      const target = byBoard.get(item.boardId)!
      target.total += 1
      if (item.status === 'Finalizing' || item.status === 'Complete') target.completed += 1
    }
    return byBoard
  }, [projects, scheduleItems, workspaceId])

  const billingMetrics = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    let balance = 0
    let monthlyRevenue = 0
    let monthlyExpenses = 0

    const recent = Object.values(transactions)
      .filter((transaction) => transaction.workspaceId === workspaceId)
      .sort((a, b) => b.date - a.date)

    for (const transaction of recent) {
      const date = new Date(transaction.date)
      const isThisMonth = date.getMonth() === currentMonth && date.getFullYear() === currentYear
      if (transaction.type === 'income') {
        balance += transaction.amount
        if (isThisMonth) monthlyRevenue += transaction.amount
      } else {
        balance -= transaction.amount
        if (isThisMonth) monthlyExpenses += transaction.amount
      }
    }

    return { balance, monthlyRevenue, monthlyExpenses, recent: recent.slice(0, 3) }
  }, [transactions, workspaceId])

  const upcoming = useMemo(() => {
    const now = Date.now()
    return Object.values(scheduleItems)
      .filter((item) => item.workspaceId === workspaceId && item.endDate >= now)
      .sort((a, b) => a.endDate - b.endDate)
      .slice(0, 3)
  }, [scheduleItems, workspaceId])

  if (!workspaceId || !ws) return null

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '32px 36px' }} className="animate-fade-in">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
        <Breadcrumbs items={[{ label: ws.name }, { label: 'Dashboard' }]} />
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgb(var(--c-muted))', marginBottom: 6 }}>
              Studio Command Center
            </div>
            <h1 className="font-display" style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.05 }}>{ws.name}</h1>
            <p style={{ marginTop: 8, fontSize: 13, color: 'rgb(var(--c-muted))' }}>
              A live overview of project progress, schedule pressure, and studio cashflow.
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => setProjectModalOpen(true)} disabled={projects.length >= 10}>
            New Project
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard label="Projects" value={String(projects.length)} detail="Active boards in this workspace" />
        <StatCard label="Monthly Revenue" value={currency(billingMetrics.monthlyRevenue)} detail="Income booked this month" />
        <StatCard label="Monthly Expenses" value={currency(billingMetrics.monthlyExpenses)} detail="Outflow booked this month" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.45fr) minmax(320px, 0.85fr)', gap: 20, alignItems: 'start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 className="font-display" style={{ fontSize: 20, fontWeight: 700 }}>Projects</h2>
            <Link to={`/w/${workspaceId}/projects`} style={{ color: 'rgb(var(--c-brand-hi))', textDecoration: 'none', fontSize: 12, fontWeight: 600 }}>
              View all
            </Link>
          </div>

          {projects.length === 0 ? (
            <div className="glass-panel" style={{ padding: 30, borderRadius: 24, borderStyle: 'dashed', textAlign: 'center' }}>
              <div className="font-display" style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>No active projects</div>
              <div style={{ color: 'rgb(var(--c-muted))', marginBottom: 18 }}>Start your first production board.</div>
              <button className="btn btn-primary" onClick={() => setProjectModalOpen(true)}>Create Project</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
              {projects.map((project, index) => {
                const metrics = projectMetrics.get(project.id) ?? { total: 0, completed: 0 }
                const progress = metrics.total > 0 ? Math.round((metrics.completed / metrics.total) * 100) : 0

                return (
                  <Link key={project.id} to={`/w/${workspaceId}/project/${project.id}`} style={{ textDecoration: 'none' }}>
                    <div className="project-card animate-slide-up" style={{ animationDelay: `${index * 0.06}s` }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: project.color, opacity: 0.9 }} />
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: project.color, marginBottom: 8 }}>Project</div>
                      <div className="font-display" style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {project.title}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: 'rgb(var(--c-muted))', marginBottom: 10 }}>
                        <span>{metrics.completed} completed</span>
                        <span>{metrics.total} tasks</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,.06)', overflow: 'hidden' }}>
                        <div style={{ width: `${progress}%`, height: '100%', background: project.color, boxShadow: `0 0 16px ${project.color}99` }} />
                      </div>
                      <div style={{ marginTop: 12, color: 'rgb(var(--c-faint))', fontSize: 11 }}>
                        Updated {new Date(project.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="glass-panel" style={{ padding: 20, borderRadius: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgb(var(--c-muted))', marginBottom: 4 }}>Total Balance</div>
                <div className="font-display" style={{ fontSize: 24, fontWeight: 800 }}>{currency(billingMetrics.balance)}</div>
              </div>
              <Link to={`/w/${workspaceId}/billing`} className="btn btn-ghost" style={{ textDecoration: 'none' }}>
                Open Ledger
              </Link>
            </div>

            {billingMetrics.recent.length === 0 ? (
              <div className="glass-panel" style={{ padding: 18, borderRadius: 18, borderStyle: 'dashed', textAlign: 'center' }}>
                <div style={{ color: 'rgb(var(--c-muted))', fontSize: 12 }}>No recent transactions yet. Add the first production deposit to activate this widget.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {billingMetrics.recent.map((transaction, index) => (
                  <div key={transaction.id} className="animate-slide-up" style={{ animationDelay: `${index * 0.06}s`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 14, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(var(--c-border), 0.55)' }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{transaction.category}</div>
                      <div style={{ fontSize: 11, color: 'rgb(var(--c-muted))' }}>{transaction.note}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: transaction.type === 'income' ? 'rgb(var(--c-green))' : 'rgb(var(--c-red))' }}>
                        {transaction.type === 'income' ? '+' : '-'}{currency(transaction.amount)}
                      </div>
                      <div style={{ fontSize: 11, color: 'rgb(var(--c-faint))' }}>{new Date(transaction.date).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-panel" style={{ padding: 20, borderRadius: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgb(var(--c-muted))', marginBottom: 4 }}>Upcoming Deadlines</div>
                <div className="font-display" style={{ fontSize: 22, fontWeight: 800 }}>{upcoming.length}</div>
              </div>
              <Link to={`/w/${workspaceId}/calendar`} className="btn btn-ghost" style={{ textDecoration: 'none' }}>Open Calendar</Link>
            </div>

            {upcoming.length === 0 ? (
              <div style={{ color: 'rgb(var(--c-muted))', fontSize: 12 }}>No upcoming deadlines yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {upcoming.map((item) => {
                  const urgent = item.endDate - Date.now() <= 1000 * 60 * 60 * 48
                  return (
                    <div key={item.id} className={urgent ? 'urgent-deadline' : undefined} style={{ padding: '12px 14px', borderRadius: 16, border: '1px solid rgba(var(--c-border), 0.55)', background: item.status === 'Production' ? 'rgba(var(--c-brand), 0.12)' : 'rgba(255,255,255,.03)', boxShadow: item.status === 'Production' ? '0 0 22px rgba(139,92,246,.18)' : 'none' }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{item.title}</div>
                      <div style={{ fontSize: 11, color: 'rgb(var(--c-muted))', marginTop: 4 }}>Due {new Date(item.endDate).toLocaleDateString()}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal open={projectModalOpen} title="Create Project" onClose={() => !isCreatingProject && setProjectModalOpen(false)} widthClass="w-[560px]">
        <div className={isCreatingProject ? 'glass-loading-content' : undefined} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 12, fontWeight: 600, color: 'rgb(var(--c-muted))' }}>Project Name</label>
            <input className="input-base" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Spring campaign launch" disabled={isCreatingProject} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 12, fontWeight: 600, color: 'rgb(var(--c-muted))' }}>Brand Color</label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {BOARD_COLORS.map((color) => (
                <button
                  key={color}
                  className="btn-icon"
                  onClick={() => setProjectColor(color)}
                  style={{ width: 34, height: 34, padding: 0, background: color, borderColor: projectColor === color ? '#fff' : `${color}66` }}
                  disabled={isCreatingProject}
                />
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button className="btn btn-ghost" onClick={() => setProjectModalOpen(false)} disabled={isCreatingProject}>Cancel</button>
            <button
              className="btn btn-primary"
              disabled={!projectName.trim() || isCreatingProject}
              onClick={async () => {
                setIsCreatingProject(true)
                await new Promise((resolve) => window.setTimeout(resolve, 480))
                const id = createBoard(workspaceId, projectName.trim(), projectColor)
                setIsCreatingProject(false)
                setProjectModalOpen(false)
                setProjectName('')
                setProjectColor(BOARD_COLORS[0])
                navigate(`/w/${workspaceId}/project/${id}`)
              }}
            >
              {isCreatingProject ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
