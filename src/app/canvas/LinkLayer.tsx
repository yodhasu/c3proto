import type { Card, CardLink, ID } from '../model/types'

function center(c: Card) {
  return { x: c.x + c.w / 2, y: c.y + c.h / 2 }
}

export function LinkLayer({
  cards,
  links,
  selectedCardId,
  selectedLinkId,
  onLinkClick,
}: {
  cards: Record<ID, Card>
  links: CardLink[]
  selectedCardId?: ID | null
  selectedLinkId?: ID | null
  onLinkClick?: (linkId: ID) => void
}) {
  const cardList = Object.values(cards)
  if (cardList.length === 0) return null

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity
  for (const c of cardList) {
    minX = Math.min(minX, c.x)
    minY = Math.min(minY, c.y)
    maxX = Math.max(maxX, c.x + c.w)
    maxY = Math.max(maxY, c.y + c.h)
  }
  const pad = 800
  minX -= pad
  minY -= pad
  maxX += pad
  maxY += pad

  const w = Math.max(1, maxX - minX)
  const h = Math.max(1, maxY - minY)

  return (
    <svg
      className="absolute"
      style={{ left: minX, top: minY, width: w, height: h }}
      viewBox={`0 0 ${w} ${h}`}
    >
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

        const isHot = selectedCardId && (l.a === selectedCardId || l.b === selectedCardId)
        const isSel = selectedLinkId === l.id

        const stroke = isSel ? 'rgba(168,85,247,.95)' : isHot ? 'rgba(168,85,247,.75)' : 'rgba(148,163,184,.45)'
        const width = isSel ? 3.0 : isHot ? 2.25 : 1.5

        return (
          <line
            key={l.id}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={stroke}
            strokeWidth={width}
            style={{ cursor: onLinkClick ? 'pointer' : undefined }}
            vectorEffect="non-scaling-stroke"
            pointerEvents="stroke"
            onClick={(e) => {
              e.stopPropagation()
              onLinkClick?.(l.id)
            }}
          />
        )
      })}
    </svg>
  )
}
