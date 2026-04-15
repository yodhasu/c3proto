import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import type { Card, ID } from '../model/types'
import { clamp, screenToWorld } from '../utils/geom'
import { CardNode } from '../canvas/CardNode'
import { LinkLayer } from '../canvas/LinkLayer'
import { putMedia } from '../store/media'
import { id as makeId } from '../utils/id'
import { Breadcrumbs } from '../components/Breadcrumbs'
import { Tooltip } from '../components/Tooltip'
import { ConfirmModal } from '../components/ConfirmModal'

type WorldPt = { x: number; y: number }

function center(c: Card) {
  return { x: c.x + c.w / 2, y: c.y + c.h / 2 }
}

function isEditableTarget(t: EventTarget | null) {
  const el = t as HTMLElement | null
  if (!el) return false
  const tag = el.tagName?.toLowerCase()
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true
  if (el.isContentEditable) return true
  return false
}

const GRID_SIZE = 8

function snapToGrid(value: number) {
  return Math.round(value / GRID_SIZE) * GRID_SIZE
}

export function BoardCanvasPage() {
  const { workspaceId, boardId } = useParams()
  const navigate = useNavigate()
  const ensureSeeded = useAppStore((s) => s.ensureSeeded)
  const workspace = useAppStore((s) => (workspaceId ? s.workspaces[workspaceId] : undefined))

  const board = useAppStore((s) => (boardId ? s.boards[boardId] : undefined))
  const cardsByIdAll = useAppStore((s) => s.cards)
  const linksByIdAll = useAppStore((s) => s.links)
  const users = useAppStore((s) => s.users)

  const withHistory = useAppStore((s) => s.withHistory)
  const createCard = useAppStore((s) => s.createCard)
  const addMediaItem = useAppStore((s) => s.addMediaItem)
  const updateCard = useAppStore((s) => s.updateCard)
  const createLink = useAppStore((s) => s.createLink)
  const updateLink = useAppStore((s) => s.updateLink)
  const deleteLink = useAppStore((s) => s.deleteLink)
  const undo = useAppStore((s) => s.undo)
  const redo = useAppStore((s) => s.redo)

  useEffect(() => {
    ensureSeeded()
  }, [ensureSeeded])

  const cards = useMemo(() => {
    if (!boardId) return [] as Card[]
    return Object.values(cardsByIdAll)
      .filter((c) => c.boardId === boardId)
      .sort((a, b) => a.z - b.z)
  }, [cardsByIdAll, boardId])

  const links = useMemo(() => {
    if (!boardId) return []
    return Object.values(linksByIdAll).filter((l) => l.boardId === boardId)
  }, [linksByIdAll, boardId])



  const cardsById = useMemo(() => {
    const m: Record<ID, Card> = {}
    for (const c of cards) m[c.id] = c
    return m
  }, [cards])

  const containerRef = useRef<HTMLDivElement | null>(null)
  const panCleanupRef = useRef<null | (() => void)>(null)
  const [viewport, setViewport] = useState({ x: 0, y: 0, scale: 1 })
  const [selectedCardId, setSelectedCardId] = useState<ID | null>(null)
  const [selectedLinkId, setSelectedLinkId] = useState<ID | null>(null)
  const [pendingDeleteLinkId, setPendingDeleteLinkId] = useState<ID | null>(null)

  const [spaceDown, setSpaceDown] = useState(false)
  const [uploadFeedback, setUploadFeedback] = useState<null | { count: number; label: string }>(null)

  const [dragLink, setDragLink] = useState<null | { from: ID; to: WorldPt }>(null)

  const maxCards = 100
  const LARGE_MEDIA_THRESHOLD = 500 * 1024

  const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms))

  const resolveSpawnPosition = (x: number, y: number) => {
    let nextX = snapToGrid(x)
    let nextY = snapToGrid(y)
    while (cards.some((card) => card.x === nextX && card.y === nextY)) {
      nextX += 20
      nextY += 20
    }
    return { x: nextX, y: nextY }
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        if (isEditableTarget(e.target)) return
        setSpaceDown(true)
        e.preventDefault()
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpaceDown(false)
        if (isEditableTarget(e.target)) return
        e.preventDefault()
      }
    }
    window.addEventListener('keydown', onKeyDown, { passive: false })
    window.addEventListener('keyup', onKeyUp, { passive: false })
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onWheel = (e: WheelEvent) => {
      // zoom: ctrl/cmd + wheel
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      const mouse = { x: e.clientX, y: e.clientY }
      const before = screenToWorld(mouse, viewport, rect)
      const nextScale = clamp(viewport.scale * (e.deltaY > 0 ? 0.9 : 1.1), 0.25, 2.5)
      const nextX = viewport.x + (before.x * viewport.scale - before.x * nextScale)
      const nextY = viewport.y + (before.y * viewport.scale - before.y * nextScale)
      setViewport({ x: nextX, y: nextY, scale: nextScale })
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [viewport])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!boardId) return
      const isUndo = (e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z'
      const isRedo = (e.ctrlKey || e.metaKey) && (e.shiftKey ? e.key.toLowerCase() === 'z' : e.key.toLowerCase() === 'y')
      if (isUndo) {
        e.preventDefault()
        undo(boardId)
      }
      if (isRedo) {
        e.preventDefault()
        redo(boardId)
      }
      if (e.key === 'Escape') {
        setDragLink(null)
        setSelectedLinkId(null)
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedLinkId) {
        e.preventDefault()
        setPendingDeleteLinkId(selectedLinkId)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [boardId, undo, redo, selectedLinkId, deleteLink, withHistory])

  const startPan = (e: React.PointerEvent) => {
    const el = containerRef.current
    if (!el) return

    // clear any stuck listeners from previous pan
    panCleanupRef.current?.()
    panCleanupRef.current = null

    const start = { x: e.clientX, y: e.clientY }
    const v0 = viewport
    el.setPointerCapture(e.pointerId)

    const cleanup = () => {
      try {
        el.releasePointerCapture(e.pointerId)
      } catch { /* pointer may already be released */ }
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      window.removeEventListener('blur', onUp)
      panCleanupRef.current = null
    }

    const onMove = (ev: PointerEvent) => {
      // if mouse button is no longer pressed, stop (prevents ghost-panning)
      if (typeof ev.buttons === 'number' && ev.buttons === 0) {
        cleanup()
        return
      }
      const dx = ev.clientX - start.x
      const dy = ev.clientY - start.y
      setViewport({ ...v0, x: v0.x + dx, y: v0.y + dy })
    }

    const onUp = () => cleanup()

    panCleanupRef.current = cleanup
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    window.addEventListener('blur', onUp)
  }

  const createCardAt = (clientX: number, clientY: number) => {
    if (!boardId || !containerRef.current) return
    if (cards.length >= maxCards) return
    const rect = containerRef.current.getBoundingClientRect()
    const p = screenToWorld({ x: clientX, y: clientY }, viewport, rect)
    const spawn = resolveSpawnPosition(Math.round(p.x), Math.round(p.y))

    withHistory(boardId, () => {
      const nid = createCard(boardId, {
        title: 'New card',
        description: '',
        x: spawn.x,
        y: spawn.y,
        w: 280,
        h: 120,   // auto-height will override this after first render
        z: Date.now(),
      })
      setSelectedCardId(nid)
    })
  }

  const onCanvasDoubleClick = (e: React.MouseEvent) => {
    createCardAt(e.clientX, e.clientY)
  }

  const worldPointFromEvent = (ev: { clientX: number; clientY: number }) => {
    const el = containerRef.current
    if (!el) return { x: 0, y: 0 }
    const rect = el.getBoundingClientRect()
    return screenToWorld({ x: ev.clientX, y: ev.clientY }, viewport, rect)
  }

  const hitCardAtWorld = (p: WorldPt): ID | null => {
    // top-most first
    const sorted = [...cards].sort((a, b) => b.z - a.z)
    for (const c of sorted) {
      if (p.x >= c.x && p.x <= c.x + c.w && p.y >= c.y && p.y <= c.y + c.h) return c.id
    }
    return null
  }

  const maybeSimulateUpload = async (files: File[]) => {
    const hasLargeMedia = files.some((file) => file.size > LARGE_MEDIA_THRESHOLD)
    if (!hasLargeMedia) return
    setUploadFeedback({
      count: files.length,
      label: files.length > 1 ? 'Processing media files...' : 'Processing media...',
    })
    await wait(520)
  }

  const makeDragHandlers = (cardId: ID) => {
    return (e: React.PointerEvent) => {
      if (!boardId || !containerRef.current) return
      const el = containerRef.current
      const c0 = cardsById[cardId]
      if (!c0) return
      const start = { x: e.clientX, y: e.clientY }
      const base = { x: c0.x, y: c0.y }

      withHistory(boardId, () => {
        updateCard(cardId, { z: Date.now() })
      })

      el.setPointerCapture(e.pointerId)
      const onMove = (ev: PointerEvent) => {
        const dx = (ev.clientX - start.x) / viewport.scale
        const dy = (ev.clientY - start.y) / viewport.scale
        updateCard(cardId, { x: snapToGrid(base.x + dx), y: snapToGrid(base.y + dy) })
      }
      const onUp = (ev: PointerEvent) => {
        const dx = ev.clientX - start.x
        const dy = ev.clientY - start.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        el.releasePointerCapture(e.pointerId)
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)

        // Only select/expand if the movement was very small (a simple click)
        if (dist < 6) {
          setSelectedCardId(cardId)
        }
      }
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
    }
  }

  // Right-edge-only resize: both 'tr' and 'br' change width only
  const makeResizeHandlers = (cardId: ID) => {
    return (e: React.PointerEvent) => {
      if (!boardId || !containerRef.current) return
      const el = containerRef.current
      const c0 = cardsById[cardId]
      if (!c0) return
      const start = { x: e.clientX }
      const base  = { x: c0.x, w: c0.w }

      withHistory(boardId, () => { updateCard(cardId, { z: Date.now() }) })

      el.setPointerCapture(e.pointerId)
      const onMove = (ev: PointerEvent) => {
        const dx   = (ev.clientX - start.x) / viewport.scale
        const minW = 200
        const w    = Math.max(minW, snapToGrid(base.w + dx))
        updateCard(cardId, { w })
      }
      const onUp = () => {
        el.releasePointerCapture(e.pointerId)
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
      }
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
    }
  }

  const startLinkDrag = (fromId: ID) => (e: React.PointerEvent) => {
    if (!boardId || !containerRef.current) return
    const el = containerRef.current
    const startWorld = worldPointFromEvent(e)
    setDragLink({ from: fromId, to: startWorld })

    el.setPointerCapture(e.pointerId)

    const onMove = (ev: PointerEvent) => {
      setDragLink((cur) => {
        if (!cur) return null
        return { ...cur, to: worldPointFromEvent(ev) }
      })
    }

    const onUp = (ev: PointerEvent) => {
      el.releasePointerCapture(e.pointerId)
      const end = worldPointFromEvent(ev)
      const target = hitCardAtWorld(end)
      setDragLink(null)
      if (target && target !== fromId) {
        withHistory(boardId, () => {
          createLink(boardId, fromId, target)
        })
      } else {
        // drop on empty space: auto-create linked card
        if (cards.length < maxCards) {
          const spawn = resolveSpawnPosition(Math.round(end.x), Math.round(end.y))
          withHistory(boardId, () => {
            const newId = createCard(boardId, {
              title: 'New card',
              description: '',
              x: spawn.x,
              y: spawn.y,
              w: snapToGrid(280),
              h: 120,
              z: Date.now(),
            })
            createLink(boardId, fromId, newId)
            setSelectedCardId(newId)
          })
        }
      }
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  if (!workspaceId || !boardId || !board) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgb(var(--c-muted))', fontSize: 14 }}>
        Board not found
      </div>
    )
  }

  const me = users[useAppStore.getState().currentUserId]

  const linkTempLine = dragLink
    ? {
        a: center(cardsById[dragLink.from]),
        b: dragLink.to,
      }
    : null

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Canvas Toolbar Header ── */}
      <div style={{
        height: 48, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px',
        background: 'rgba(var(--c-surface), 0.9)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgb(var(--c-border))',
      }}>

        {/* Left: breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <button
            className="btn-icon"
            onClick={() => navigate(`/w/${workspaceId}/dashboard`)}
            title="Back to workspace dashboard"
            style={{ padding: 6 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div style={{ width: 1, height: 18, background: 'rgb(var(--c-border))' }} />
          <Breadcrumbs
            items={[
              { label: workspace?.name ?? 'Workspace', to: `/w/${workspaceId}/dashboard` },
              { label: 'Projects', to: `/w/${workspaceId}/projects` },
              { label: board.title },
            ]}
          />
        </div>

        {/* Center: user avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {me?.avatarUrl && (
            <img
              src={me.avatarUrl}
              referrerPolicy="no-referrer"
              style={{ width: 26, height: 26, borderRadius: '50%', border: '1.5px solid rgb(var(--c-border-hi))', objectFit: 'cover' }}
              title={me.name}
            />
          )}
        </div>

        {/* Right: actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Tooltip content="Undo">
            <button className="btn-icon" onClick={() => undo(boardId)} aria-label="Undo">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>
            </button>
          </Tooltip>
          <Tooltip content="Redo">
            <button className="btn-icon" onClick={() => redo(boardId)} aria-label="Redo">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 0 1 4-4h12"/></svg>
            </button>
          </Tooltip>
          <div style={{ width: 1, height: 20, background: 'rgb(var(--c-border))' }} />
          <button
            className="btn btn-primary"
            style={{ padding: '5px 12px', fontSize: 12 }}
            onClick={() => {
              const el = containerRef.current
              if (!el) return
              createCardAt(el.getBoundingClientRect().left + 220, el.getBoundingClientRect().top + 220)
            }}
            disabled={cards.length >= maxCards}
            aria-label="Add card"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Card
          </button>
        </div>
      </div>

      {/* ── Canvas + RightPanel ── */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>
        <div
          ref={containerRef}
          className="canvas-bg"
          style={{
            flex: 1, minWidth: 0,
            position: 'relative',
            overflow: 'hidden',
            cursor: spaceDown ? 'grab' : 'default',
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={async (e) => {
            e.preventDefault()
            if (!boardId) return
            const files = Array.from(e.dataTransfer.files ?? [])
            if (files.length === 0) return
            const drop = { clientX: e.clientX, clientY: e.clientY }
            const base = worldPointFromEvent(drop)

            const remaining = Math.max(0, maxCards - cards.length)
            const use = files.slice(0, remaining)
            if (use.length === 0) return

            try {
              await maybeSimulateUpload(use)

              for (let i = 0; i < use.length; i++) {
                const f = use[i]
                const mediaId = makeId('m')
                await putMedia(mediaId, f)
                const kind: 'image' | 'video' | 'file' = f.type.startsWith('image/') ? 'image' : f.type.startsWith('video/') ? 'video' : 'file'
                const spawn = resolveSpawnPosition(Math.round(base.x + i * 40), Math.round(base.y + i * 40))
                withHistory(boardId, () => {
                  const newId = createCard(boardId, {
                    title: f.name, description: '',
                    x: spawn.x, y: spawn.y,
                    w: 360, h: 260, z: Date.now(),
                  })
                  addMediaItem(newId, kind, { mediaId, name: f.name, mime: f.type || 'application/octet-stream' })
                  setSelectedCardId(newId)
                })
              }
            } finally {
              setUploadFeedback(null)
            }
          }}
          onPointerDown={(e) => {
            if (spaceDown || e.button === 1) { startPan(e); return }
            setSelectedCardId(null)
            setSelectedLinkId(null)
          }}
          onDoubleClick={onCanvasDoubleClick}
        >
          {/* Transformed world */}
          <div
            style={{
              position: 'absolute', left: 0, top: 0,
              transformOrigin: 'top left',
              transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
            }}
          >
            {/* Dot grid layer */}
            <div style={{
              position: 'absolute',
              left: -20000, top: -20000, width: 40000, height: 40000,
              backgroundImage:
                'radial-gradient(rgba(139,92,246,.1) 1px, transparent 1px),' +
                'radial-gradient(rgba(34,211,238,.04) 1px, transparent 1px)',
              backgroundSize: '32px 32px, 96px 96px',
              pointerEvents: 'none',
            }} />

            <LinkLayer
              cards={cardsById}
              links={links}
              selectedCardId={selectedCardId}
              selectedLinkId={selectedLinkId}
              onLinkClick={(id) => setSelectedLinkId(id)}
              onDeleteLink={(linkId) => {
                setSelectedLinkId(linkId)
                setPendingDeleteLinkId(linkId)
              }}
              onUpdateLinkLabel={(linkId, label) => {
                withHistory(boardId!, () => updateLink(linkId, { label }))
              }}
            />

            {/* Temp drag-link bezier */}
            {linkTempLine && (() => {
              const { a, b } = linkTempLine
              const dx = Math.abs(b.x - a.x) * 0.5 + 60
              return (
                <svg style={{ position: 'absolute', left: -20000, top: -20000, width: 40000, height: 40000, overflow: 'visible' }} viewBox="0 0 40000 40000">
                  <path
                    d={`M ${a.x + 20000} ${a.y + 20000} C ${a.x + 20000 + dx} ${a.y + 20000}, ${b.x + 20000 - dx} ${b.y + 20000}, ${b.x + 20000} ${b.y + 20000}`}
                    fill="none"
                    stroke="rgba(139,92,246,.8)"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    strokeLinecap="round"
                  />
                  <circle cx={b.x + 20000} cy={b.y + 20000} r={5} fill="rgba(139,92,246,.8)" />
                </svg>
              )
            })()}

            {cards.map((c) => (
              <CardNode
                key={c.id}
                card={c}
                boardId={boardId!}
                selected={c.id === selectedCardId}
                panMode={spaceDown}
                onConvertToTask={(card) => {
                  const sanitizedTitle = card.title.trim().toLowerCase() === 'new card' ? '' : card.title
                  navigate(`/w/${workspaceId}/calendar`, {
                    state: {
                      draftSchedule: {
                        boardId,
                        linkedCardId: card.id,
                        title: sanitizedTitle,
                        note: [card.description, card.note].filter(Boolean).join('\n\n'),
                      },
                    },
                  })
                }}
                onDeselect={() => setSelectedCardId(null)}
                onPointerDownDrag={makeDragHandlers(c.id)}
                onPointerDownResize={() => makeResizeHandlers(c.id)}
                onStartLink={startLinkDrag(c.id)}
                onHeightChange={(h) => updateCard(c.id, { h })}
              />
            ))}
          </div>

          {uploadFeedback && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 'var(--z-modal)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 24,
                background: 'rgba(3, 6, 16, 0.28)',
                backdropFilter: 'blur(2px)',
                WebkitBackdropFilter: 'blur(2px)',
              }}
            >
              <div
                className="glass-panel"
                style={{
                  minWidth: 280,
                  maxWidth: 360,
                  padding: 22,
                  borderRadius: 22,
                  display: 'grid',
                  gap: 10,
                  justifyItems: 'center',
                  textAlign: 'center',
                }}
              >
                <div className="glass-loader__spinner" />
                <div className="font-display" style={{ fontSize: 18, fontWeight: 700, color: 'rgb(var(--c-text))' }}>
                  {uploadFeedback.label}
                </div>
                <div style={{ fontSize: 13, color: 'rgb(var(--c-muted))', lineHeight: 1.5 }}>
                  Preparing {uploadFeedback.count} asset{uploadFeedback.count > 1 ? 's' : ''} for the board.
                </div>
              </div>
            </div>
          )}

          {/* ── Bottom HUD ── */}
          <div style={{
            position: 'absolute', bottom: 14, left: 14,
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 10px',
            background: 'rgba(var(--c-panel), 0.85)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(var(--c-border),.6)',
            borderRadius: 'var(--r-sm)',
            fontSize: 11, color: 'rgb(var(--c-faint))',
          }}>
            <kbd style={{ fontFamily: 'inherit', background: 'rgba(255,255,255,.06)', padding: '1px 5px', borderRadius: 3, fontSize: 10 }}>Space</kbd>
            <span>+drag pan</span>
            <span style={{ color: 'rgb(var(--c-border-hi))' }}>·</span>
            <kbd style={{ fontFamily: 'inherit', background: 'rgba(255,255,255,.06)', padding: '1px 5px', borderRadius: 3, fontSize: 10 }}>Ctrl</kbd>
            <span>+scroll zoom</span>
            <span style={{ color: 'rgb(var(--c-border-hi))' }}>·</span>
            <span>double-click to add card</span>
          </div>

          {/* ── Card counter ── */}
          <div style={{
            position: 'absolute', bottom: 14, right: 14,
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 10px',
            background: 'rgba(var(--c-panel), 0.85)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(var(--c-border),.6)',
            borderRadius: 'var(--r-sm)',
            fontSize: 11, color: 'rgb(var(--c-faint))',
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            <span style={{ color: cards.length >= maxCards ? 'rgb(var(--c-red))' : 'rgb(var(--c-muted))' }}>
              {cards.length}
            </span>
            <span>/ {maxCards} cards</span>
          </div>
        </div>
      </div>
      <ConfirmModal
        open={!!pendingDeleteLinkId}
        title="Remove board link?"
        message="This connection will be removed from the canvas. The linked cards will stay in place, but the relationship line and label will be cleared."
        confirmLabel="Remove Link"
        tone="danger"
        onClose={() => setPendingDeleteLinkId(null)}
        onConfirm={() => {
          if (!pendingDeleteLinkId || !boardId) return
          withHistory(boardId, () => deleteLink(pendingDeleteLinkId))
          setSelectedLinkId(null)
          setPendingDeleteLinkId(null)
        }}
      />
    </div>
  )
}
