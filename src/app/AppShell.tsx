import { NavLink, Outlet, useParams } from 'react-router-dom'
import { useEffect, useMemo } from 'react'
import { useAppStore } from './store/useAppStore'

// ─── Icons ────────────────────────────────────────────────────────────────────
function IconHome() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )
}
function IconFolders() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
  )
}
function IconCalendar() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  )
}
function IconBilling() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  )
}
function IconSettings() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  )
}

// ─── Nav sections ──────────────────────────────────────────────────────────────
const PRIMARY_NAV = [
  { key: 'dashboard', label: 'Dashboard', to: 'dashboard', icon: <IconHome />, working: true },
  { key: 'projects', label: 'Projects',  to: 'projects',  icon: <IconFolders />, working: true },
  { key: 'calendar', label: 'Calendar',  to: 'calendar',  icon: <IconCalendar />, working: true },
  { key: 'billing',  label: 'Billing',   to: 'billing',   icon: <IconBilling />, working: true },
]

const SETTINGS_NAV = [
  { key: 'settings', label: 'Settings',  to: 'settings',  icon: <IconSettings />, working: false },
]

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ url, name }: { url?: string; name?: string }) {
  return (
    <div title={name} style={{
      width: 24, height: 24, borderRadius: '50%',
      border: '1.5px solid rgb(var(--c-border))',
      overflow: 'hidden',
      flexShrink: 0,
      background: 'rgb(var(--c-surface))',
    }}>
      {url && <img src={url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />}
    </div>
  )
}

// ─── NavSection ───────────────────────────────────────────────────────────────
function NavSection({ items, workspaceId }: {
  items: typeof PRIMARY_NAV
  workspaceId: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {items.map((n) => (
        <NavLink
          key={n.key}
          to={`/w/${workspaceId}/${n.to}`}
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          end={n.key === 'dashboard'}
        >
          <span style={{ display: 'flex', flexShrink: 0 }}>{n.icon}</span>
          <span style={{ flex: 1 }}>{n.label}</span>
          {!n.working && <span className="badge-soon">soon</span>}
        </NavLink>
      ))}
    </div>
  )
}

// ─── AppShell ─────────────────────────────────────────────────────────────────
export function AppShell() {
  const { workspaceId } = useParams()
  const ensureSeeded = useAppStore((s) => s.ensureSeeded)
  const ws            = useAppStore((s) => (workspaceId ? s.getWorkspace(workspaceId) : undefined))
  const users         = useAppStore((s) => s.users)

  useEffect(() => { ensureSeeded() }, [ensureSeeded])

  const members = useMemo(() => {
    if (!ws) return []
    return ws.memberIds.map((id) => users[id]).filter(Boolean)
  }, [ws, users])

  if (!workspaceId) return null

  return (
    <div style={{ height: '100%', width: '100%', display: 'flex', overflow: 'hidden' }}>

      {/* ── Sidebar ── */}
      <aside className="animate-slide-in" style={{
        width: 220,
        flexShrink: 0,
        position: 'relative',
        zIndex: 'var(--z-sidebar)',
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(var(--c-surface), 0.88)',
        backdropFilter: 'blur(12px)',
        borderRight: '1px solid rgb(var(--c-border))',
        overflow: 'hidden',
      }}>

        {/* Workspace header */}
        <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid rgb(var(--c-border))' }}>
          {/* Studio logotype */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'linear-gradient(135deg, rgb(var(--c-brand)) 0%, rgba(34,211,238,.8) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0,
              fontFamily: 'Outfit, sans-serif',
              boxShadow: '0 2px 8px rgba(139,92,246,.4)',
            }}>
              S
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, fontFamily: 'Outfit, sans-serif', color: 'rgb(var(--c-text))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {ws?.name ?? '…'}
              </div>
              <div style={{ fontSize: 10, color: 'rgb(var(--c-faint))', marginTop: 1 }}>Studio Workspace</div>
            </div>
          </div>

          {/* Active members */}
          {members.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 500, color: 'rgb(var(--c-faint))', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Who's active
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {members.slice(0, 5).map((u) => (
                  <Avatar key={u.id} url={u.avatarUrl} name={u.name} />
                ))}
                {members.length > 5 && (
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgb(var(--c-panel))', border: '1.5px solid rgb(var(--c-border))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: 'rgb(var(--c-muted))' }}>
                    +{members.length - 5}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Primary nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 10px' }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgb(var(--c-faint))', padding: '4px 12px', marginBottom: 4 }}>
            Studio
          </div>
          <NavSection items={PRIMARY_NAV} workspaceId={workspaceId} />
        </nav>

        {/* Bottom settings + status */}
        <div style={{ borderTop: '1px solid rgb(var(--c-border))', padding: '10px' }}>
          <NavSection items={SETTINGS_NAV} workspaceId={workspaceId} />
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgb(var(--c-green))', boxShadow: '0 0 6px rgba(52,211,153,.6)' }} />
            <span style={{ fontSize: 10, color: 'rgb(var(--c-faint))' }}>Local · prototype</span>
          </div>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <main style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
