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
  preview: CardPreview
  onSelect: () => void
  onPointerDownDrag: (e: React.PointerEvent) => void
  onPointerDownResize: (corner: 'br' | 'tr' | 'bl' | 'tl') => (e: React.PointerEvent) => void
  onStartLink: (e: React.PointerEvent) => void
}

export function CardNode({
  card,
  selected,
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
        'absolute rounded-lg border bg-panel/85 backdrop-blur',
        selected ? 'border-brand shadow-panel' : 'border-border',
      )}
      style={{ left: card.x, top: card.y, width: card.w, height: card.h, zIndex: card.z }}
      onPointerDown={(e) => {
        e.stopPropagation()
        onSelect()
        // drag anywhere except resize/link handle
        onPointerDownDrag(e)
      }}
    >
      <div className={clsx('px-3 pt-3 pb-2', selected ? '' : '')}>
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
              <img src={mediaUrl} className="h-full w-full object-cover" alt={preview.media.name ?? ''} />
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
            <div className="text-xs text-muted">Drop media here or add text</div>
          )}
        </div>
      </div>

      {/* link handle */}
      <button
        className={clsx(
          'absolute -right-2 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full border',
          selected ? 'border-brand bg-brand/20' : 'border-border bg-panel',
        )}
        title="Drag to link"
        onPointerDown={(e) => {
          e.stopPropagation()
          onSelect()
          onStartLink(e)
        }}
      />

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
