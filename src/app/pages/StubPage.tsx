import { useParams } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { Breadcrumbs } from '../components/Breadcrumbs'

export function StubPage({ title }: { title: string }) {
  const { workspaceId } = useParams()
  const workspace = useAppStore((s) => (workspaceId ? s.workspaces[workspaceId] : undefined))

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '32px 36px' }}>
      <div style={{ maxWidth: 760 }}>
        <Breadcrumbs items={[{ label: workspace?.name ?? 'Workspace', to: workspaceId ? `/w/${workspaceId}/dashboard` : undefined }, { label: title }]} />
        <div className="glass-panel" style={{ marginTop: 18, padding: 28, borderRadius: 24 }}>
          <h1 className="font-display" style={{ fontSize: 28, fontWeight: 800 }}>{title}</h1>
          <p style={{ marginTop: 10, color: 'rgb(var(--c-muted))' }}>
            This module is still in preview. The next studio-facing priority is resource booking for shared gear and rooms.
          </p>
          <div style={{ marginTop: 22, display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost" disabled>Create</button>
            <button className="btn btn-ghost" disabled>Import</button>
            <button className="btn btn-ghost" disabled>Export</button>
          </div>
        </div>
      </div>
    </div>
  )
}
