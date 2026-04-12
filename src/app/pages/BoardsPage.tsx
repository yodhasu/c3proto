import { Link, useParams } from 'react-router-dom'
import { useMemo } from 'react'
import { useAppStore } from '../store/useAppStore'

export function BoardsPage() {
  const { workspaceId } = useParams()

  const ws = useAppStore((s) => (workspaceId ? s.workspaces[workspaceId] : undefined))
  const boardsById = useAppStore((s) => s.boards)
  const createBoard = useAppStore((s) => s.createBoard)
  const renameBoard = useAppStore((s) => s.renameBoard)
  const deleteBoard = useAppStore((s) => s.deleteBoard)

  const boards = useMemo(() => {
    if (!workspaceId) return []
    return Object.values(boardsById)
      .filter((b) => b.workspaceId === workspaceId)
      .sort((a, b) => b.updatedAt - a.updatedAt)
  }, [boardsById, workspaceId])

  if (!workspaceId || !ws) return <div className="p-6">Missing workspace</div>

  const boardMenu = (boardId: string, currentTitle: string) => {
    const action = prompt('Board action: r = rename, d = delete', 'r')
    if (!action) return
    const a = action.trim().toLowerCase()
    if (a === 'r') {
      const title = prompt('Rename board', currentTitle)
      if (!title) return
      renameBoard(boardId, title)
      return
    }
    if (a === 'd') {
      if (!confirm('Delete this board and all its cards?')) return
      deleteBoard(boardId)
    }
  }

  return (
    <div className="h-full p-8 overflow-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Boards</h1>
          <div className="mt-1 text-sm text-muted">Moodboard + taskboard in one canvas.</div>
        </div>
        <button
          className="rounded bg-brand px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          onClick={() => {
            if (boards.length >= 10) return
            const id = createBoard(workspaceId, `New board ${boards.length + 1}`)
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
          <div key={b.id} className="rounded-lg border border-border bg-panel p-4 hover:bg-white/5">
            <div className="flex items-start justify-between gap-3">
              <Link to={`/w/${workspaceId}/boards/${b.id}`} className="min-w-0 flex-1">
                <div className="text-[11px] text-muted">Board</div>
                <div className="mt-1 text-lg font-semibold truncate">{b.title}</div>
                <div className="mt-2 text-xs text-muted">Updated {new Date(b.updatedAt).toLocaleString()}</div>
              </Link>
              <button
                className="text-sm rounded border border-border px-2 py-1 text-muted hover:text-text hover:bg-white/5"
                title="Board settings"
                onClick={() => boardMenu(b.id, b.title)}
              >
                ⋯
              </button>
            </div>
          </div>
        ))}
      </div>

      {boards.length === 0 && <div className="mt-10 text-muted">No boards yet.</div>}

      <div className="mt-10 text-xs text-muted">
        Tips: open a board, double-click empty space to add cards. Click a link line, then press Delete to remove it.
      </div>
    </div>
  )
}
