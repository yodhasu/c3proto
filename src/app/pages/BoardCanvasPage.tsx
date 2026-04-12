import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import type { Card, CardItem, ID } from '../model/types'
import { clamp, screenToWorld } from '../utils/geom'
import { CardNode, type CardPreview } from '../canvas/CardNode'
import { LinkLayer } from '../canvas/LinkLayer'
import { RightPanel } from '../canvas/RightPanel'

type WorldPt = { x: number; y: number }

function center(c: Card) {
  return { x: c.x + c.w / 2, y: c.y + c.h / 2 }
}

export function BoardCanvasPage() {
  const { workspaceId, boardId } = useParams()
  const ensureSeeded = useAppStore((s) => s.ensureSeeded)

  const board = useAppStore((s) => (boardId ? s.boards[boardId] : undefined))
  const cardsByIdAll = useAppStore((s) => s.cards)
  const itemsByIdAll = useAppStore((s) => s.items)
  const commentsByIdAll = useAppStore((s) => s.comments)
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

  const byCard = useMemo(() => {
    const items: Record<ID, CardItem[]> = {}
    const commentsCount: Record<ID, number> = {}
    const linkCount: Record<ID, number> = {}

    for (const it of Object.values(itemsByIdAll)) {
      ;(items[it.cardId] ??= []).push(it)
    }
    for (const c of Object.values(commentsByIdAll)) {
      commentsCount[c.cardId] = (commentsCount[c.cardId] ?? 0) + 1
    }
    for (const l of links) {
      linkCount[l.a] = (linkCount[l.a] ?? 0) + 1
      linkCount[l.b] = (linkCount[l.b] ?? 0) + 1
    }

    for (const list of Object.values(items)) list.sort((a, b) => a.position - b.position)

    return { items, commentsCount, linkCount }
  }, [itemsByIdAll, commentsByIdAll, links])

  const previews = useMemo(() => {
    const out: Record<ID, CardPreview> = {}
    for (const c of cards) {
      const its = byCard.items[c.id] ?? []
      const text = its.find((x) => x.type === 'text')?.content?.text ?? c.description
      const primaryText = (text ?? '').trim().split('\n').slice(0, 3).join('\n')
      const mediaIt = its.find((x) => x.type !== 'text')
      const media = mediaIt
        ? {
            kind: mediaIt.type as 'image' | 'video' | 'file',
            mediaId: mediaIt.content.mediaId,
            name: mediaIt.content.name,
          }
        : undefined

      out[c.id] = {
        primaryText,
        badgeItems: its.length,
        badgeComments: byCard.commentsCount[c.id] ?? 0,
        badgeLinks: byCard.linkCount[c.id] ?? 0,
        media,
      }
    }
    return out
  }, [cards, byCard])

  const cardsById = useMemo(() => {
    const m: Record<ID, Card> = {}
    for (const c of cards) m[c.id] = c
    return m
  }, [cards])

  const containerRef = useRef<HTMLDivElement | null>(null)
  const [viewport, setViewport] = useState({ x: 0, y: 0, scale: 1 })
  const [selectedCardId, setSelectedCardId] = useState<ID | null>(null)

  const [spaceDown, setSpaceDown] = useState(false)

  const [dragLink, setDragLink] = useState<null | { from: ID; to: WorldPt }>(null)

  const maxCards = 100

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpaceDown(true)
        // prevent page scroll
        e.preventDefault()
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpaceDown(false)
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
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [boardId, undo, redo])

  const startPan = (e: React.PointerEvent) => {
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
        w: 340,
        h: 220,
        z: Date.now(),
      })
      setSelectedCardId(id)
    })
  }

  const onCanvasDoubleClick = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) return
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

        const minW = 260
        const minH = 170

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
      }
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  if (!workspaceId || !boardId || !board) {
    return <div className="p-6">Missing board</div>
  }

  const me = users[useAppStore.getState().currentUserId]

  const linkTempLine = dragLink
    ? {
        a: center(cardsById[dragLink.from]),
        b: dragLink.to,
      }
    : null

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
            <img
              src={me?.avatarUrl}
              className="h-7 w-7 rounded-full border border-border object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="w-px h-6 bg-border mx-2" />

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
                createCardAt(el.getBoundingClientRect().left + 220, el.getBoundingClientRect().top + 220)
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
          className={
            'relative flex-1 min-h-0 overflow-hidden bg-gradient-to-br from-bg to-black ' +
            (spaceDown ? 'cursor-grab active:cursor-grabbing' : 'cursor-default')
          }
          onPointerDown={(e) => {
            // Space+drag pan only
            if (spaceDown || e.button === 1) {
              startPan(e)
              return
            }
            setSelectedCardId(null)
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

            {/* temp link line */}
            {linkTempLine && (
              <svg
                className="absolute"
                style={{ left: -20000, top: -20000, width: 40000, height: 40000 }}
                viewBox="0 0 40000 40000"
              >
                <line
                  x1={linkTempLine.a.x + 20000}
                  y1={linkTempLine.a.y + 20000}
                  x2={linkTempLine.b.x + 20000}
                  y2={linkTempLine.b.y + 20000}
                  stroke="rgba(168,85,247,.9)"
                  strokeWidth={2.5}
                />
              </svg>
            )}

            {cards.map((c) => (
              <CardNode
                key={c.id}
                card={c}
                selected={c.id === selectedCardId}
                preview={previews[c.id] ?? { primaryText: '', badgeItems: 0, badgeComments: 0, badgeLinks: 0 }}
                onSelect={() => setSelectedCardId(c.id)}
                onPointerDownDrag={makeDragHandlers(c.id)}
                onPointerDownResize={(corner) => makeResizeHandlers(c.id, corner)}
                onStartLink={startLinkDrag(c.id)}
              />
            ))}
          </div>

          <div className="absolute bottom-3 left-3 text-[11px] text-muted rounded border border-border bg-panel/50 px-2 py-1">
            Pan: Space + drag • Zoom: Ctrl/Cmd + wheel • New card: double-click
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
