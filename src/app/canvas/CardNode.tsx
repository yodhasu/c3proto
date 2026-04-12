import clsx from 'clsx'
import { useMediaUrl } from './useMediaUrl'
import type { Card, ID } from '../model/types'

export type CardPreview = {
  primaryText: string
  badgeItems: number
  badgeComments: number
  badgeLinks: number
  note: string
  mediaThumbs: { kind: 'image' | 'video'; mediaId?: ID; name?: string }[]
  fileThumbs: { name?: string }[]
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
  onToggle: (section: 'text' | 'media' | 'files') => void
}

function TinyImg({ mediaId, name }: { mediaId?: ID; name?: string }) {
  const url = useMediaUrl(mediaId)
  if (!url) return <div className="h-8 w-8 rounded border border-border bg-black/25" />
  return <img src={url} alt={name ?? ''} className="h-8 w-8 rounded border border-border object-cover" draggable={false} />
}

function Row({
  label,
  open,
  hint,
  onToggle,
}: {
  label: string
  open: boolean
  hint?: React.ReactNode
  onToggle: () => void
}) {
  return (
    <button
      className={clsx(
        'w-full flex items-center justify-between gap-2',
        'text-[12px] rounded border border-border bg-white/5 px-2 py-1.5',
        'hover:bg-white/10',
      )}
      onPointerDown={(e) => {
        e.stopPropagation()
        e.preventDefault()
        onToggle()
      }}
      title={`Toggle ${label}`}
    >
      <span className="text-muted">{label}</span>
      <span className="flex items-center gap-2 text-muted">
        {hint}
        <span>{open ? '▾' : '▸'}</span>
      </span>
    </button>
  )
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
  onToggle,
}: Props) {
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
      {/* Title */}
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

      {/* Body: stacked dropdown rows */}
      <div className="px-3 pb-3" style={{ height: Math.max(0, card.h - 74) }}>
        <div className="h-full rounded-md border border-border/70 bg-black/20 overflow-hidden">
          <div className="h-full p-2 flex flex-col gap-2">
            <Row
              label="Text"
              open={card.openText}
              hint={<span className="text-[10px]">{preview.note.trim() ? '1' : '0'}</span>}
              onToggle={() => onToggle('text')}
            />
            {card.openText && (
              <div className="text-[11px] text-muted rounded border border-border bg-black/20 p-2 whitespace-pre-wrap max-h-24 overflow-auto">
                {preview.note || '…'}
              </div>
            )}

            <Row
              label="Media"
              open={card.openMedia}
              hint={<span className="text-[10px]">{preview.mediaThumbs.length}</span>}
              onToggle={() => onToggle('media')}
            />
            {card.openMedia && (
              <div className="flex gap-2 flex-wrap">
                {preview.mediaThumbs.length === 0 ? (
                  <div className="text-[11px] text-muted">No media</div>
                ) : (
                  preview.mediaThumbs.map((m, i) => <TinyImg key={i} mediaId={m.mediaId} name={m.name} />)
                )}
              </div>
            )}

            <Row
              label="Files"
              open={card.openFiles}
              hint={<span className="text-[10px]">{preview.fileThumbs.length}</span>}
              onToggle={() => onToggle('files')}
            />
            {card.openFiles && (
              <div className="space-y-1 max-h-20 overflow-auto">
                {preview.fileThumbs.length === 0 ? (
                  <div className="text-[11px] text-muted">No files</div>
                ) : (
                  preview.fileThumbs.map((f, i) => (
                    <div key={i} className="text-[11px] text-muted truncate">
                      {f.name}
                    </div>
                  ))
                )}
              </div>
            )}

            {!selected && (
              <div className="mt-auto text-[10px] text-muted">Select to interact</div>
            )}
          </div>
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
