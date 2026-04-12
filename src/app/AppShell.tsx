import { NavLink, Outlet, useParams } from 'react-router-dom'
import { useMemo } from 'react'
import { useAppStore } from './store/useAppStore'
import { AvatarStack } from './components/AvatarStack'

const nav = [
  { key: 'boards', label: 'Workspace', to: 'boards', working: true },
  { key: 'projects', label: 'Projects', to: 'projects', working: false },
  { key: 'tasks', label: 'Tasks', to: 'tasks', working: false },
  { key: 'files', label: 'Files', to: 'files', working: false },
  { key: 'calendar', label: 'Calendar', to: 'calendar', working: false },
  { key: 'clients', label: 'Clients', to: 'clients', working: false },
  { key: 'billing', label: 'Billing', to: 'billing', working: false },
  { key: 'settings', label: 'Settings', to: 'settings', working: false },
]

export function AppShell() {
  const { workspaceId } = useParams()
  const ensureSeeded = useAppStore((s) => s.ensureSeeded)
  const ws = useAppStore((s) => (workspaceId ? s.getWorkspace(workspaceId) : undefined))
  const users = useAppStore((s) => s.users)

  useMemo(() => ensureSeeded(), [ensureSeeded])

  const members = useMemo(() => {
    if (!ws) return []
    return ws.memberIds.map((id) => users[id]).filter(Boolean)
  }, [ws, users])

  return (
    <div className="h-full w-full flex">
      <aside className="w-64 shrink-0 border-r border-border bg-panel/60 backdrop-blur">
        <div className="p-4">
          <div className="text-sm text-muted">Workspace</div>
          <div className="mt-1 text-lg font-semibold leading-tight">
            {ws?.name ?? '…'}
          </div>
          <div className="mt-3">
            <div className="text-xs text-muted mb-2">Who’s here</div>
            <AvatarStack users={members} />
          </div>
        </div>
        <nav className="px-2 pb-4">
          {nav.map((n) => (
            <NavLink
              key={n.key}
              to={n.to}
              className={({ isActive }) =>
                [
                  'flex items-center justify-between rounded-md px-3 py-2 text-sm',
                  isActive ? 'bg-white/10 text-text' : 'text-muted hover:text-text hover:bg-white/5',
                ].join(' ')
              }
              end
            >
              <span>{n.label}</span>
              {!n.working && (
                <span className="text-[10px] rounded bg-white/10 px-2 py-0.5 text-muted">soon</span>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-12 border-b border-border bg-panel/40 backdrop-blur flex items-center justify-between px-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-2 w-2 rounded-full bg-green-400" title="Local persistent" />
            <div className="text-sm text-muted truncate">Prototype • local persistent • 10 boards max • 100 cards/board</div>
          </div>
          <div className="flex items-center gap-2">
            <button className="text-xs rounded border border-border px-2 py-1 text-muted hover:text-text hover:bg-white/5" disabled>
              Search
            </button>
            <button className="text-xs rounded border border-border px-2 py-1 text-muted hover:text-text hover:bg-white/5" disabled>
              Notifications
            </button>
          </div>
        </header>

        <main className="flex-1 min-h-0 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
