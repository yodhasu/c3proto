import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { Breadcrumbs } from '../components/Breadcrumbs'
import { Modal } from '../components/Modal'
import { ConfirmModal } from '../components/ConfirmModal'
import { Tooltip } from '../components/Tooltip'

export function BoardsPage() {
  const { workspaceId } = useParams()
  const navigate = useNavigate()

  const ws = useAppStore((s) => (workspaceId ? s.workspaces[workspaceId] : undefined))
  const boardsById = useAppStore((s) => s.boards)
  const scheduleItems = useAppStore((s) => s.scheduleItems)
  const createBoard = useAppStore((s) => s.createBoard)
  const renameBoard = useAppStore((s) => s.renameBoard)
  const deleteBoard = useAppStore((s) => s.deleteBoard)
  const [isSavingBoard, setIsSavingBoard] = useState(false)
  const [menuBoardId, setMenuBoardId] = useState<string | null>(null)
  const [renameBoardState, setRenameBoardState] = useState<{ id: string; title: string } | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [deleteBoardState, setDeleteBoardState] = useState<{ id: string; title: string } | null>(null)

  const boards = useMemo(() => {
    if (!workspaceId) return []
    return Object.values(boardsById)
      .filter((b) => b.workspaceId === workspaceId)
      .sort((a, b) => b.updatedAt - a.updatedAt)
  }, [boardsById, workspaceId])

  const taskCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const item of Object.values(scheduleItems)) {
      if (!item.boardId) continue
      counts.set(item.boardId, (counts.get(item.boardId) ?? 0) + 1)
    }
    return counts
  }, [scheduleItems])

  if (!workspaceId || !ws) return <div className="p-6">Missing workspace</div>

  const createProject = async (title: string) => {
    setIsSavingBoard(true)
    await new Promise((resolve) => window.setTimeout(resolve, 560))
    const nextId = createBoard(workspaceId, title)
    setIsSavingBoard(false)
    navigate(`/w/${workspaceId}/project/${nextId}`)
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '32px 36px' }} className="animate-fade-in">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
        <Breadcrumbs
          items={[
            { label: ws.name, to: `/w/${workspaceId}/dashboard` },
            { label: 'Projects' },
          ]}
        />
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgb(var(--c-muted))', marginBottom: 6 }}>
              Project Library
            </div>
            <h1 className="font-display" style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.1 }}>
              Studio Boards
            </h1>
            <p style={{ marginTop: 8, color: 'rgb(var(--c-muted))', maxWidth: 620 }}>
              Organize active productions, convert ideas into schedule-ready tasks, and keep every board tied to the wider studio workflow.
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => createProject(`Project ${boards.length + 1}`)}
            disabled={boards.length >= 10 || isSavingBoard}
          >
            {isSavingBoard ? 'Saving...' : 'New Project'}
          </button>
        </div>
      </div>

      {boards.length === 0 ? (
        <div className="glass-panel" style={{ padding: 32, borderRadius: 24, textAlign: 'center' }}>
          <div className="font-display" style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>No projects yet</div>
          <div style={{ color: 'rgb(var(--c-muted))', marginBottom: 20 }}>Create the first board to start mapping work and scheduling production.</div>
          <button className="btn btn-primary" onClick={() => createProject('My First Project')} disabled={isSavingBoard}>
            {isSavingBoard ? 'Saving...' : 'Create Project'}
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
          {boards.map((board, index) => (
            <div key={board.id} className="project-card animate-slide-up" style={{ animationDelay: `${index * 0.06}s` }}>
              <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at top right, ${board.color}20 0%, transparent 42%)`, pointerEvents: 'none' }} />
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 22 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: board.color, marginBottom: 8 }}>
                    Project
                  </div>
                  <div className="font-display" style={{ fontSize: 18, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {board.title}
                  </div>
                </div>
                <div style={{ position: 'relative' }}>
                  <Tooltip content="Project settings">
                    <button
                      className="btn-icon"
                      aria-label="Project settings"
                      onClick={() => setMenuBoardId((current) => current === board.id ? null : board.id)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
                    </button>
                  </Tooltip>
                  {menuBoardId === board.id && (
                    <div
                      className="glass-panel"
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        right: 0,
                        zIndex: 'var(--z-dropdown)',
                        minWidth: 180,
                        padding: 8,
                        borderRadius: 16,
                        display: 'grid',
                        gap: 4,
                      }}
                    >
                      <button
                        className="btn btn-ghost"
                        style={{ justifyContent: 'flex-start' }}
                        onClick={() => {
                          setRenameBoardState({ id: board.id, title: board.title })
                          setRenameValue(board.title)
                          setMenuBoardId(null)
                        }}
                      >
                        Rename Project
                      </button>
                      <button
                        className="btn btn-ghost"
                        style={{ justifyContent: 'flex-start', color: 'rgb(var(--c-red))' }}
                        onClick={() => {
                          setDeleteBoardState({ id: board.id, title: board.title })
                          setMenuBoardId(null)
                        }}
                      >
                        Delete Project
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <span className="badge badge-cyan">{taskCounts.get(board.id) ?? 0} scheduled tasks</span>
                <span className="badge">{new Date(board.updatedAt).toLocaleDateString()}</span>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <Link to={`/w/${workspaceId}/project/${board.id}`} className="btn btn-primary" style={{ textDecoration: 'none' }}>
                  Open Board
                </Link>
                <Link to={`/w/${workspaceId}/calendar`} state={{ focusBoardId: board.id }} className="btn btn-ghost" style={{ textDecoration: 'none' }}>
                  Open Timeline
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!renameBoardState}
        title="Rename Project"
        onClose={() => {
          setRenameBoardState(null)
          setRenameValue('')
        }}
        widthClass="w-[520px]"
      >
        <div style={{ display: 'grid', gap: 18 }}>
          <div style={{ color: 'rgb(var(--c-muted))', lineHeight: 1.6 }}>
            Give this board a clearer production name so it reads well across the dashboard, schedule, and budgeting views.
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 12, fontWeight: 600, color: 'rgb(var(--c-muted))' }}>
              Project Name
            </label>
            <input
              autoFocus
              className="input-base"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="Project name"
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button className="btn btn-ghost" onClick={() => { setRenameBoardState(null); setRenameValue('') }}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              disabled={!renameValue.trim() || !renameBoardState}
              onClick={() => {
                if (!renameBoardState || !renameValue.trim()) return
                renameBoard(renameBoardState.id, renameValue.trim())
                setRenameBoardState(null)
                setRenameValue('')
              }}
            >
              Save Name
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteBoardState}
        title="Delete this project?"
        message={`Delete "${deleteBoardState?.title ?? 'this project'}" and all linked tasks? This action removes it from the studio timeline and board library.`}
        confirmLabel="Delete Project"
        tone="danger"
        onClose={() => setDeleteBoardState(null)}
        onConfirm={() => {
          if (!deleteBoardState) return
          deleteBoard(deleteBoardState.id)
          setDeleteBoardState(null)
        }}
      />
    </div>
  )
}
