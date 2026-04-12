import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { useMemo } from 'react'
import { AppShell } from './AppShell'
import { useAppStore } from './store/useAppStore'
import { BoardsPage } from './pages/BoardsPage'
import { BoardCanvasPage } from './pages/BoardCanvasPage'
import { StubPage } from './pages/StubPage'

function BootRedirect() {
  const ensureSeeded = useAppStore((s) => s.ensureSeeded)
  const workspaces = useAppStore((s) => s.workspaces)

  useMemo(() => ensureSeeded(), [ensureSeeded])

  const first = Object.keys(workspaces)[0]
  if (!first) return <div className="p-6">Seeding…</div>
  return <Navigate to={`/w/${first}/boards`} replace />
}

function WorkspaceIndex() {
  const { workspaceId } = useParams()
  if (!workspaceId) return <Navigate to="/" replace />
  return <Navigate to={`/w/${workspaceId}/boards`} replace />
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<BootRedirect />} />

      <Route path="/w/:workspaceId" element={<AppShell />}>
        <Route index element={<WorkspaceIndex />} />
        <Route path="boards" element={<BoardsPage />} />
        <Route path="boards/:boardId" element={<BoardCanvasPage />} />

        <Route path="projects" element={<StubPage title="Projects" />} />
        <Route path="tasks" element={<StubPage title="Tasks" />} />
        <Route path="files" element={<StubPage title="Files" />} />
        <Route path="calendar" element={<StubPage title="Calendar" />} />
        <Route path="clients" element={<StubPage title="Clients" />} />
        <Route path="billing" element={<StubPage title="Billing" />} />
        <Route path="settings" element={<StubPage title="Settings" />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
