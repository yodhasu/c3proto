import clsx from 'clsx'
import { useMediaUrl } from './useMediaUrl'
import type { Card, ID } from '../model/types'

export type CardPreview = {
  primaryText: string
  badgeItems: number
  badgeComments: number
  badgeLinks: number
  media?: { kind: 'image' | 'video' | 'file'; mediaId?: ID; name?: string }
}

type Props = {
  card: Card
  selected: boolean
  panMode: boolean
  preview: CardPreview
  onSelect: () => void
  onPointerDownDrag: (e: React.PointerEvent) => void
  onPointerDownResize: (corner: 'br' | 'tr' | 'bl' | 'tl') => (e: React.PointerEvent) => void
  onStartLink: (e: React.PointerEvent) => void
}

export function CardNode({
  card,
  selected,
  panMode,
  preview,
  onSelect,
  onPointerDownDrag,
  onPointerDownResize,
  onStartLink,
}: Props) {
  const mediaUrl = useMediaUrl(preview.media?.mediaId)

  return (
    <div
      className={clsx(
        'absolute rounded-lg border bg-panel/85 backdrop-blur select-none group',
        selected ? 'border-brand shadow-panel' : 'border-border',
        panMode ? 'pointer-events-none' : 'cursor-grab active:cursor-grabbing',
      )}
      style={{ left: card.x, top: card.y, width: card.w, height: card.h, zIndex: card.z }}
      onDoubleClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => {
        if (panMode) return
        e.preventDefault()
        e.stopPropagation()
        onSelect()
        onPointerDownDrag(e)
      }}
    >
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-sm font-semibold leading-tight truncate">{card.title || 'Untitled'}</div>
            <div className="mt-1 text-[11px] text-muted line-clamp-2 whitespace-pre-wrap">
              {preview.primaryText || '…'}
            </div>
          </div>
          <div className="shrink-0 flex flex-col items-end gap-2">
            <div className="flex gap-1 text-[10px] text-muted">
              <span className="rounded border border-border bg-white/5 px-1.5 py-0.5" title="Items">
                {preview.badgeItems}i
              </span>
              <span className="rounded border border-border bg-white/5 px-1.5 py-0.5" title="Comments">
                {preview.badgeComments}c
              </span>
              <span className="rounded border border-border bg-white/5 px-1.5 py-0.5" title="Links">
                {preview.badgeLinks}l
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-3 pb-3" style={{ height: Math.max(0, card.h - 74) }}>
        <div className="h-full rounded-md border border-border/70 bg-black/20 overflow-hidden flex items-center justify-center">
          {preview.media ? (
            preview.media.kind === 'image' && mediaUrl ? (
              <img src={mediaUrl} className="h-full w-full object-cover" alt={preview.media.name ?? ''} draggable={false} />
            ) : preview.media.kind === 'video' ? (
              <div className="text-xs text-muted">
                VIDEO{preview.media.name ? `: ${preview.media.name}` : ''}
              </div>
            ) : (
              <div className="text-xs text-muted">
                FILE{preview.media.name ? `: ${preview.media.name}` : ''}
              </div>
            )
          ) : (
            <div className="text-xs text-muted">Double-click empty space to add cards. Drop media via panel.</div>
          )}
        </div>
      </div>

      {/* link handles (hover) */}
      {([
        { k: 'r', cls: '-right-2 top-1/2 -translate-y-1/2' },
        { k: 'l', cls: '-left-2 top-1/2 -translate-y-1/2' },
        { k: 't', cls: 'left-1/2 -translate-x-1/2 -top-2' },
        { k: 'b', cls: 'left-1/2 -translate-x-1/2 -bottom-2' },
      ] as const).map((h) => (
        <button
          key={h.k}
          className={clsx(
            'absolute h-5 w-5 rounded-full border transition-opacity',
            h.cls,
            'opacity-0 group-hover:opacity-100',
            selected ? 'border-brand bg-brand/20' : 'border-border bg-panel',
          )}
          title="Drag to link"
          onPointerDown={(e) => {
            if (panMode) return
            e.preventDefault()
            e.stopPropagation()
            onSelect()
            onStartLink(e)
          }}
        />
      ))}

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
            if (panMode) return
            e.preventDefault()
            e.stopPropagation()
            onSelect()
            onPointerDownResize(c)(e)
          }}
        />
      ))}
    </div>
  )
}
