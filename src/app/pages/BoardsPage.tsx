import { Link, useParams } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'

export function BoardsPage() {
  const { workspaceId } = useParams()
  const ws = useAppStore((s) => (workspaceId ? s.getWorkspace(workspaceId) : undefined))
  const boards = useAppStore((s) => (workspaceId ? s.listBoards(workspaceId) : []))
  const createBoard = useAppStore((s) => s.createBoard)

  if (!workspaceId || !ws) return <div className="p-6">Missing workspace</div>

  return (
    <div className="h-full p-8 overflow-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Boards</h1>
          <div className="mt-1 text-sm text-muted">Freeform canvas boards inside {ws.name}</div>
        </div>
        <button
          className="rounded bg-brand px-3 py-2 text-sm font-medium text-white hover:opacity-90"
          onClick={() => {
            if (boards.length >= 10) return
            const id = createBoard(workspaceId, `New board ${boards.length + 1}`)
            // navigate via href, simplest for prototype
            window.location.href = `/w/${workspaceId}/boards/${id}`
          }}
          disabled={boards.length >= 10}
          title={boards.length >= 10 ? 'Max 10 boards in prototype' : 'Create board'}
        >
          + New board
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {boards.map((b) => (
          <Link
            key={b.id}
            to={`/w/${workspaceId}/boards/${b.id}`}
            className="rounded-lg border border-border bg-panel p-4 hover:bg-white/5"
          >
            <div className="text-sm text-muted">Board</div>
            <div className="mt-1 text-lg font-semibold">{b.title}</div>
            <div className="mt-2 text-xs text-muted">Updated {new Date(b.updatedAt).toLocaleString()}</div>
          </Link>
        ))}
      </div>

      {boards.length === 0 && (
        <div className="mt-10 text-muted">No boards yet.</div>
      )}
    </div>
  )
}
