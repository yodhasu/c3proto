import clsx from 'clsx'
import type { Card } from '../model/types'

type Props = {
  card: Card
  selected: boolean
  onSelect: () => void
  onPointerDownDrag: (e: React.PointerEvent) => void
  onPointerDownResize: (corner: 'br' | 'tr' | 'bl' | 'tl') => (e: React.PointerEvent) => void
}

export function CardNode({ card, selected, onSelect, onPointerDownDrag, onPointerDownResize }: Props) {
  return (
    <div
      className={clsx(
        'absolute rounded-lg border bg-panel/80 backdrop-blur',
        selected ? 'border-brand shadow-panel' : 'border-border',
      )}
      style={{ left: card.x, top: card.y, width: card.w, height: card.h, zIndex: card.z }}
      onPointerDown={(e) => {
        e.stopPropagation()
        onSelect()
      }}
    >
      <div
        className={clsx(
          'h-9 px-3 flex items-center justify-between cursor-grab active:cursor-grabbing',
          'border-b border-border/70 rounded-t-lg',
        )}
        onPointerDown={(e) => {
          e.stopPropagation()
          onSelect()
          onPointerDownDrag(e)
        }}
      >
        <div className="text-sm font-medium truncate">{card.title || 'Untitled'}</div>
        <div className="text-[10px] text-muted">card</div>
      </div>

      <div className="p-3 text-xs text-muted overflow-hidden" style={{ height: card.h - 36 }}>
        {card.description || '…'}
      </div>

      {/* resize handles */}
      {(['tl', 'tr', 'bl', 'br'] as const).map((c) => (
        <div
          key={c}
          className={clsx(
            'absolute h-3 w-3 rounded-sm bg-white/10 border border-border',
            c === 'tl' && '-left-1 -top-1 cursor-nwse-resize',
            c === 'tr' && '-right-1 -top-1 cursor-nesw-resize',
            c === 'bl' && '-left-1 -bottom-1 cursor-nesw-resize',
            c === 'br' && '-right-1 -bottom-1 cursor-nwse-resize',
          )}
          onPointerDown={(e) => {
            e.stopPropagation()
            onSelect()
            onPointerDownResize(c)(e)
          }}
        />
      ))}
    </div>
  )
}
