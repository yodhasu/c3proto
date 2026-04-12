import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import type { Card, ID } from '../model/types'
import { clamp, screenToWorld } from '../utils/geom'
import { CardNode } from '../canvas/CardNode'
import { LinkLayer } from '../canvas/LinkLayer'
import { RightPanel } from '../canvas/RightPanel'

export function BoardCanvasPage() {
  const { workspaceId, boardId } = useParams()
  const ensureSeeded = useAppStore((s) => s.ensureSeeded)

  const board = useAppStore((s) => (boardId ? s.boards[boardId] : undefined))
  const cardsByIdAll = useAppStore((s) => s.cards)
  const linksByIdAll = useAppStore((s) => s.links)
  const users = useAppStore((s) => s.users)

  const withHistory = useAppStore((s) => s.withHistory)
  const createCard = useAppStore((s) => s.createCard)
  const updateCard = useAppStore((s) => s.updateCard)
  const createLink = useAppStore((s) => s.createLink)
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
  const [viewport, setViewport] = useState({ x: 0, y: 0, scale: 1 })
  const [selectedCardId, setSelectedCardId] = useState<ID | null>(null)

  const [linkMode, setLinkMode] = useState(false)
  const [linkFrom, setLinkFrom] = useState<ID | null>(null)

  const maxCards = 100

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onWheel = (e: WheelEvent) => {
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
        setLinkMode(false)
        setLinkFrom(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [boardId, undo, redo])

  const startPan = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    const start = { x: e.clientX, y: e.clientY }
    const v0 = viewport
    const el = containerRef.current
    if (!el) return
    el.setPointerCapture(e.pointerId)

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - start.x
      const dy = ev.clientY - start.y
      setViewport({ ...v0, x: v0.x + dx, y: v0.y + dy })
    }

    const onUp = () => {
      el.releasePointerCapture(e.pointerId)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const createCardAt = (clientX: number, clientY: number) => {
    if (!boardId || !containerRef.current) return
    if (cards.length >= maxCards) return
    const rect = containerRef.current.getBoundingClientRect()
    const p = screenToWorld({ x: clientX, y: clientY }, viewport, rect)

    withHistory(boardId, () => {
      const id = createCard(boardId, {
        title: 'New card',
        description: '',
        x: Math.round(p.x),
        y: Math.round(p.y),
        w: 320,
        h: 180,
        z: Date.now(),
      })
      setSelectedCardId(id)
    })
  }

  const onCanvasDoubleClick = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) return
    createCardAt(e.clientX, e.clientY)
  }

  const onSelectCard = (id: ID) => {
    if (!boardId) return

    if (linkMode) {
      if (!linkFrom) {
        setLinkFrom(id)
        setSelectedCardId(id)
        return
      }
      if (linkFrom === id) return
      withHistory(boardId, () => {
        createLink(boardId, linkFrom, id)
      })
      setLinkFrom(null)
      setSelectedCardId(id)
      return
    }

    setSelectedCardId(id)
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
        updateCard(cardId, { x: base.x + dx, y: base.y + dy })
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

  const makeResizeHandlers = (cardId: ID, corner: 'br' | 'tr' | 'bl' | 'tl') => {
    return (e: React.PointerEvent) => {
      if (!boardId || !containerRef.current) return
      const el = containerRef.current
      const c0 = cardsById[cardId]
      if (!c0) return
      const start = { x: e.clientX, y: e.clientY }
      const base = { x: c0.x, y: c0.y, w: c0.w, h: c0.h }

      withHistory(boardId, () => {
        updateCard(cardId, { z: Date.now() })
      })

      el.setPointerCapture(e.pointerId)
      const onMove = (ev: PointerEvent) => {
        const dx = (ev.clientX - start.x) / viewport.scale
        const dy = (ev.clientY - start.y) / viewport.scale

        let x = base.x,
          y = base.y,
          w = base.w,
          h = base.h

        const minW = 200
        const minH = 120

        if (corner.includes('r')) w = Math.max(minW, base.w + dx)
        if (corner.includes('b')) h = Math.max(minH, base.h + dy)
        if (corner.includes('l')) {
          const nextW = Math.max(minW, base.w - dx)
          x = base.x + (base.w - nextW)
          w = nextW
        }
        if (corner.includes('t')) {
          const nextH = Math.max(minH, base.h - dy)
          y = base.y + (base.h - nextH)
          h = nextH
        }

        updateCard(cardId, { x, y, w, h })
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

  if (!workspaceId || !boardId || !board) {
    return <div className="p-6">Missing board</div>
  }

  const me = users[useAppStore.getState().currentUserId]

  return (
    <div className="h-full flex">
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="h-12 border-b border-border flex items-center justify-between px-4 bg-panel/40">
          <div className="min-w-0">
            <div className="text-xs text-muted">Board</div>
            <div className="text-sm font-semibold truncate">{board.title}</div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-xs text-muted">Viewer:</div>
            <div className="flex items-center gap-2">
              <img src={me?.avatarUrl} className="h-7 w-7 rounded-full border border-border object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="w-px h-6 bg-border mx-2" />

            <button
              className={
                'text-xs rounded border px-2 py-1 ' +
                (linkMode ? 'border-brand bg-brand/20 text-text' : 'border-border text-muted hover:text-text hover:bg-white/5')
              }
              onClick={() => {
                setLinkMode((v) => !v)
                setLinkFrom(null)
              }}
              title="Link mode: click two cards to connect"
            >
              Link
            </button>
            <button
              className="text-xs rounded border border-border px-2 py-1 text-muted hover:text-text hover:bg-white/5"
              onClick={() => undo(boardId)}
              title="Undo (Ctrl/Cmd+Z)"
            >
              Undo
            </button>
            <button
              className="text-xs rounded border border-border px-2 py-1 text-muted hover:text-text hover:bg-white/5"
              onClick={() => redo(boardId)}
              title="Redo (Ctrl/Cmd+Shift+Z)"
            >
              Redo
            </button>
            <button
              className="text-xs rounded bg-brand px-2 py-1 text-white hover:opacity-90 disabled:opacity-50"
              onClick={() => {
                const el = containerRef.current
                if (!el) return
                createCardAt(el.getBoundingClientRect().left + 200, el.getBoundingClientRect().top + 200)
              }}
              disabled={cards.length >= maxCards}
              title={cards.length >= maxCards ? 'Max 100 cards/board' : 'Create card'}
            >
              + Card
            </button>
          </div>
        </div>

        <div
          ref={containerRef}
          className="relative flex-1 min-h-0 overflow-hidden bg-gradient-to-br from-bg to-black"
          onPointerDown={(e) => {
            setSelectedCardId(null)
            startPan(e)
          }}
          onDoubleClick={onCanvasDoubleClick}
        >
          <div
            className="absolute left-0 top-0 origin-top-left"
            style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})` }}
          >
            <div
              className="absolute"
              style={{
                left: -20000,
                top: -20000,
                width: 40000,
                height: 40000,
                backgroundImage: 'radial-gradient(rgba(148,163,184,.12) 1px, transparent 1px)',
                backgroundSize: '28px 28px',
              }}
            />

            <LinkLayer cards={cardsById} links={links} selectedCardId={selectedCardId} />

            {cards.map((c) => (
              <CardNode
                key={c.id}
                card={c}
                selected={c.id === selectedCardId}
                onSelect={() => onSelectCard(c.id)}
                onPointerDownDrag={makeDragHandlers(c.id)}
                onPointerDownResize={(corner) => makeResizeHandlers(c.id, corner)}
              />
            ))}

            {linkMode && (
              <div className="absolute rounded border border-brand bg-brand/10 px-3 py-2 text-xs" style={{ left: 16, top: 16 }}>
                {linkFrom ? 'Select a second card to connect.' : 'Select a first card to start linking.'}
              </div>
            )}
          </div>

          <div className="absolute bottom-3 left-3 text-[11px] text-muted rounded border border-border bg-panel/50 px-2 py-1">
            Pan: drag empty space • Zoom: Ctrl/Cmd + wheel • Create: double-click
          </div>
          <div className="absolute bottom-3 right-3 text-[11px] text-muted rounded border border-border bg-panel/50 px-2 py-1">
            Cards: {cards.length}/{maxCards}
          </div>
        </div>
      </div>

      {selectedCardId && <RightPanel boardId={boardId} cardId={selectedCardId} onClose={() => setSelectedCardId(null)} />}
    </div>
  )
}
