import { useState } from 'react'
import type { Card, CardLink, ID } from '../model/types'

function center(c: Card) {
  return { x: c.x + c.w / 2, y: c.y + c.h / 2 }
}

/** Compute a cubic bezier control-point offset (horizontal bias) */
function bezierPath(x1: number, y1: number, x2: number, y2: number) {
  const dx = Math.abs(x2 - x1) * 0.5 + 60
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`
}

export function LinkLayer({
  cards,
  links,
  selectedCardId,
  selectedLinkId,
  onLinkClick,
  onDeleteLink,
  onUpdateLinkLabel,
}: {
  cards: Record<ID, Card>
  links: CardLink[]
  selectedCardId?: ID | null
  selectedLinkId?: ID | null
  onLinkClick?: (linkId: ID) => void
  onDeleteLink?: (linkId: ID) => void
  onUpdateLinkLabel?: (linkId: ID, label: string) => void
}) {
  const [editingLinkId, setEditingLinkId] = useState<ID | null>(null)

  // Derive if we should be editing based on internal state + external selection
  const activeEditingId = selectedLinkId === editingLinkId ? editingLinkId : null

  const cardList = Object.values(cards)
  if (cardList.length === 0) return null

  let minX = Infinity,  minY = Infinity
  let maxX = -Infinity, maxY = -Infinity
  for (const c of cardList) {
    minX = Math.min(minX, c.x)
    minY = Math.min(minY, c.y)
    maxX = Math.max(maxX, c.x + c.w)
    maxY = Math.max(maxY, c.y + c.h)
  }
  const pad = 800
  minX -= pad; minY -= pad; maxX += pad; maxY += pad

  const w = Math.max(1, maxX - minX)
  const h = Math.max(1, maxY - minY)

  return (
    <svg
      className="absolute"
      style={{
        left: minX, top: minY, width: w, height: h,
        overflow: 'visible',
        pointerEvents: 'none' // FIX: Let clicks pass through to canvas background
      }}
      viewBox={`0 0 ${w} ${h}`}
    >
      <defs>
        {/* Glow filter for selected/hot links */}
        <filter id="link-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {links.map((l) => {
        const a = cards[l.a]
        const b = cards[l.b]
        if (!a || !b) return null

        const p1 = center(a)
        const p2 = center(b)
        const x1 = p1.x - minX
        const y1 = p1.y - minY
        const x2 = p2.x - minX
        const y2 = p2.y - minY

        const isHot = !!(selectedCardId && (l.a === selectedCardId || l.b === selectedCardId))
        const isSel = selectedLinkId === l.id
        const isEditing = activeEditingId === l.id

        const path = bezierPath(x1, y1, x2, y2)

        // Midpoints for menu placement
        const midX = (x1 + x2) / 2
        const midY = (y1 + y2) / 2

        // Layered rendering: glow under + crisp line on top
        return (
          <g key={l.id}>
            {/* Glow halo (behind) */}
            {(isSel || isHot) && (
              <path
                d={path}
                fill="none"
                stroke={isSel ? 'rgba(139,92,246,.5)' : 'rgba(34,211,238,.25)'}
                strokeWidth={isSel ? 8 : 6}
                strokeLinecap="round"
                filter="url(#link-glow)"
                pointerEvents="none"
              />
            )}

            {/* Hit area (invisible, wide) */}
            <path
              d={path}
              fill="none"
              stroke="transparent"
              strokeWidth={14}
              style={{ cursor: onLinkClick ? 'pointer' : undefined, pointerEvents: 'stroke' }}
              onClick={(e) => { e.stopPropagation(); onLinkClick?.(l.id) }}
              onDoubleClick={(e) => {
                e.stopPropagation()
                onLinkClick?.(l.id)
                setEditingLinkId(l.id)
              }}
            />

            {/* Visible line */}
            <path
              d={path}
              fill="none"
              stroke={
                isSel ? 'rgba(139,92,246,.95)'
                : isHot ? 'rgba(34,211,238,.75)'
                : 'rgba(148,163,184,.3)'
              }
              strokeWidth={isSel ? 2.5 : isHot ? 2 : 1.5}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              pointerEvents="none"
              style={{
                transition: 'stroke 0.2s, stroke-width 0.2s',
              }}
            />

            {/* Endpoint dots */}
            {(isSel || isHot) && (
              <>
                <circle cx={x1} cy={y1} r={4} fill={isSel ? 'rgb(139,92,246)' : 'rgb(34,211,238)'} opacity={0.8} pointerEvents="none" />
                <circle cx={x2} cy={y2} r={4} fill={isSel ? 'rgb(139,92,246)' : 'rgb(34,211,238)'} opacity={0.8} pointerEvents="none" />
              </>
            )}

            {/* Label / Action popover overlay */}
            {(isSel || l.label) && (
              <foreignObject
                x={midX - 80}
                y={midY - 30}
                width={160}
                height={60}
                style={{ overflow: 'visible', pointerEvents: 'none' }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none'
                }}>
                  
                  {/* The Menu Wrap handles the collapse animation via CSS classes */}
                  <div
                    className={`link-menu-wrap ${isSel && !isEditing ? 'link-menu-wrap--visible' : ''}`}
                    style={{ pointerEvents: 'none' }}
                  >
                    <button
                      className="link-menu-btn"
                      aria-label="Name relationship"
                      style={{ pointerEvents: 'auto' }}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => { e.stopPropagation(); setEditingLinkId(l.id) }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button
                      className="link-menu-btn"
                      aria-label="Delete link"
                      style={{ pointerEvents: 'auto', color: 'rgb(var(--c-red))' }}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => { e.stopPropagation(); onDeleteLink?.(l.id) }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    </button>
                  </div>

                  {/* Rename Input Mode */}
                  {isEditing && (
                    <div
                      className="link-menu-input-wrap"
                      style={{ pointerEvents: 'auto' }}
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      <input
                        autoFocus
                        className="link-menu-input"
                        placeholder="Type label..."
                        value={l.label || ''}
                        onChange={(e) => onUpdateLinkLabel?.(l.id, e.target.value)}
                        onBlur={() => setEditingLinkId(null)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === 'Escape') e.currentTarget.blur()
                        }}
                      />
                    </div>
                  )}

                  {/* Passive Label Badge (visible when not selected or when editing) */}
                  {!isSel && l.label && (
                    <div className="link-label-badge" style={{ pointerEvents: 'none' }}>
                      {l.label}
                    </div>
                  )}

                </div>
              </foreignObject>
            )}
          </g>
        )
      })}
    </svg>
  )
}
