import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import { AppShell } from './AppShell'
import { useAppStore } from './store/useAppStore'
import { DashboardPage } from './pages/DashboardPage'
import { BoardCanvasPage } from './pages/BoardCanvasPage'
import { CalendarPage } from './pages/CalendarPage'
import { BoardsPage } from './pages/BoardsPage'
import { BillingPage } from './pages/BillingPage'
import { StubPage } from './pages/StubPage'

/** On first load: seed data, then redirect to the first workspace's dashboard */
function BootRedirect() {
  const ensureSeeded = useAppStore((s) => s.ensureSeeded)
  const workspaces   = useAppStore((s) => s.workspaces)

  useEffect(() => { ensureSeeded() }, [ensureSeeded])

  const first = Object.keys(workspaces)[0]
  if (!first) return <div style={{ padding: 32, color: 'rgb(var(--c-muted))' }}>Loading…</div>
  return <Navigate to={`/w/${first}/dashboard`} replace />
}

/** Redirect `/w/:id` → `/w/:id/dashboard` */
function WorkspaceIndex() {
  const { workspaceId } = useParams()
  if (!workspaceId) return <Navigate to="/" replace />
  return <Navigate to={`/w/${workspaceId}/dashboard`} replace />
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Boot */}
      <Route path="/" element={<BootRedirect />} />

      <Route path="/w/:workspaceId" element={<AppShell />}>
        {/* Default redirect inside workspace */}
        <Route index element={<WorkspaceIndex />} />

        {/* ── Macro: Dashboard (home) ── */}
        <Route path="dashboard" element={<DashboardPage />} />

        {/* ── Micro: Project canvas ── */}
        <Route path="project/:boardId" element={<BoardCanvasPage />} />

        {/* ── Stubs (coming soon) ── */}
        <Route path="projects"  element={<BoardsPage />} />
        <Route path="calendar"  element={<CalendarPage />} />
        <Route path="billing"   element={<BillingPage />} />
        <Route path="settings"  element={<StubPage title="Settings" />} />

        {/* Keep old /boards URLs working during transition */}
        <Route path="boards"             element={<Navigate to="../dashboard" replace />} />
        <Route path="boards/:boardId"    element={<BoardRedirect />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

/** Redirects old `/boards/:id` links to new `/project/:id` */
function BoardRedirect() {
  const { workspaceId, boardId } = useParams()
  if (!workspaceId || !boardId) return <Navigate to="/" replace />
  return <Navigate to={`/w/${workspaceId}/project/${boardId}`} replace />
}
