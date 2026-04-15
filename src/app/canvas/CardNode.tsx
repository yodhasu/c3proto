import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAppStore } from '../store/useAppStore'
import { id as makeId } from '../utils/id'
import { putMedia } from '../store/media'
import { useMediaUrl } from './useMediaUrl'
import { CommentBubble } from './CommentBubble'
import type { Card, CardItem, ID } from '../model/types'

// ─── Props ─────────────────────────────────────────────────────────────────
type Props = {
  card: Card
  boardId: ID
  selected: boolean
  panMode: boolean
  onConvertToTask: (card: Card) => void
  onDeselect: () => void
  onPointerDownDrag: (e: React.PointerEvent) => void
  onPointerDownResize: () => (e: React.PointerEvent) => void
  onStartLink: (e: React.PointerEvent) => void
  onHeightChange: (h: number) => void
}

// ─── MediaTile ─────────────────────────────────────────────────────────────
function MediaTile({ item, onDelete }: { item: CardItem; onDelete: () => void }) {
  const url = useMediaUrl(item.content.mediaId)
  const [fullscreen, setFullscreen] = useState(false)

  // Simple escape key listener for fullscreen
  useEffect(() => {
    if (!fullscreen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [fullscreen])

  return (
    <>
      <div 
        className="media-thumb-wrap" 
        onClick={(e) => { 
          e.stopPropagation()
          if (url) setFullscreen(true)
        }}
      >
        {url
          ? <img src={url} alt={item.content.name ?? ''} className="media-tile" draggable={false} />
          : (
            <div className="media-tile-empty">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
              </svg>
            </div>
          )
        }
        <button
          className="media-thumb-wrap__delete"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          title="Remove"
        >×</button>
      </div>

      {fullscreen && url && createPortal(
        <div 
          className="media-lightbox-overlay" 
          onPointerDown={(e) => e.stopPropagation()} 
          onClick={(e) => { e.stopPropagation(); setFullscreen(false) }}
        >
          {item.content.mime?.startsWith('video/') ? (
            <video src={url} controls autoPlay className="media-lightbox-content" onClick={(e) => e.stopPropagation()} />
          ) : (
            <img src={url} alt={item.content.name ?? ''} className="media-lightbox-content" onClick={(e) => e.stopPropagation()} />
          )}
          <button 
            className="media-lightbox-close" 
            onClick={(e) => { e.stopPropagation(); setFullscreen(false) }}
            title="Close (Esc)"
          >×</button>
        </div>,
        document.body
      )}
    </>
  )
}

// ─── FileItemLine ────────────────────────────────────────────────────────────
function FileItemLine({ f, boardId, deleteItem, withHistory }: { f: CardItem, boardId: ID, deleteItem: (id: ID) => void, withHistory: (boardId: ID, fn: () => void) => void }) {
  const url = useMediaUrl(f.content.mediaId)
  const stop = (e: React.PointerEvent) => e.stopPropagation()
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '5px 8px',
      background: 'rgba(255,255,255,.03)',
      borderRadius: 'var(--r-sm)',
      border: '1px solid rgba(var(--c-border), 0.5)',
      cursor: url ? 'pointer' : 'default',
    }}
      title="Click to download"
      onPointerDown={stop}
      onClick={(e) => {
        e.stopPropagation()
        if (url) {
          const a = document.createElement('a')
          a.href = url
          a.download = f.content.name || 'download'
          a.click()
        }
      }}
    >
      <IcoFile />
      <span style={{ fontSize: 11, color: 'rgb(var(--c-text))', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {f.content.name ?? 'file'}
      </span>
      <button
        className="card-action-btn"
        onPointerDown={stop}
        onClick={(e) => { e.stopPropagation(); withHistory(boardId, () => deleteItem(f.id)) }}
        title="Remove file"
        style={{ padding: '1px 5px', color: 'rgb(var(--c-red))' }}
      >×</button>
    </div>
  )
}

// ─── Icons ─────────────────────────────────────────────────────────────────
function IcoGrip() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="8" cy="6" r="1.6"/><circle cx="16" cy="6" r="1.6"/>
      <circle cx="8" cy="12" r="1.6"/><circle cx="16" cy="12" r="1.6"/>
      <circle cx="8" cy="18" r="1.6"/><circle cx="16" cy="18" r="1.6"/>
    </svg>
  )
}
function IcoChevron({ open }: { open: boolean }) {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      style={{ transition: 'transform 0.2s', transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}>
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  )
}
function IcoComment() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  )
}
function IcoLink() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  )
}
function IcoFile() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>
    </svg>
  )
}
function IcoTrash() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/>
    </svg>
  )
}

// ─── Link handles ───────────────────────────────────────────────────────────
const LINK_HANDLES = [
  { k: 'r', style: { right: -28, top: '50%', transform: 'translateY(-50%)' } },
  { k: 'l', style: { left: -28,  top: '50%', transform: 'translateY(-50%)' } },
  { k: 't', style: { top: -28, left: '50%', transform: 'translateX(-50%)' } },
  { k: 'b', style: { bottom: -28, left: '50%', transform: 'translateX(-50%)' } },
] as const

const RESIZE_HANDLES: { c: 'tr' | 'br'; style: React.CSSProperties }[] = [
  { c: 'tr', style: { right: -5, top: -5,    cursor: 'nesw-resize' } },
  { c: 'br', style: { right: -5, bottom: -5, cursor: 'nwse-resize' } },
]

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// ─── Section header ─────────────────────────────────────────────────────────
function SectionHeader({
  label, icon, count, open, onToggle, onComment,
}: {
  label: string; icon: React.ReactNode; count: number
  open: boolean; onToggle: () => void; onComment: () => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <button
        className="card-section-header"
        style={{ flex: 1 }}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); onToggle() }}
      >
        <IcoChevron open={open} />
        {icon}
        <span style={{ flex: 1 }}>{label}</span>
        {count > 0 && (
          <span style={{
            background: 'rgba(var(--c-brand), 0.18)',
            color: 'rgb(var(--c-brand-hi))',
            borderRadius: 8,
            padding: '0 6px',
            fontSize: 10,
            fontWeight: 700,
          }}>{count}</span>
        )}
      </button>
      <button
        className="card-action-btn"
        style={{ marginRight: 6 }}
        title="Comments"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); onComment() }}
      >
        <IcoComment />
      </button>
    </div>
  )
}

// ─── CardNode ───────────────────────────────────────────────────────────────
export function CardNode({
  card, boardId, selected, panMode,
  onConvertToTask, onDeselect, onPointerDownDrag, onPointerDownResize, onStartLink, onHeightChange,
}: Props) {
  // ── Store: read items/comments for this card ────────────────────────────
  const allItems    = useAppStore((s) => s.items)
  const allComments = useAppStore((s) => s.comments)
  const allLinks    = useAppStore((s) => s.links)

  const updateCard  = useAppStore((s) => s.updateCard)
  const setCardNote = useAppStore((s) => s.setCardNote)
  const withHistory = useAppStore((s) => s.withHistory)
  const addMediaItem = useAppStore((s) => s.addMediaItem)
  const deleteItem  = useAppStore((s) => s.deleteItem)
  const deleteCard  = useAppStore((s) => s.deleteCard)

  const items = useMemo(
    () => Object.values(allItems).filter((i) => i.cardId === card.id).sort((a, b) => a.position - b.position),
    [allItems, card.id],
  )
  const commentCount = useMemo(
    () => Object.values(allComments).filter((c) => c.cardId === card.id).length,
    [allComments, card.id],
  )
  const linkCount = useMemo(
    () => Object.values(allLinks).filter((l) => l.a === card.id || l.b === card.id).length,
    [allLinks, card.id],
  )

  const mediaItems = useMemo(() => items.filter((i) => i.type === 'image' || i.type === 'video'), [items])
  const fileItems  = useMemo(() => items.filter((i) => i.type === 'file'), [items])
  const hasIngestedTitle = useMemo(
    () => items.some((item) => item.content.name && item.content.name === card.title),
    [items, card.title],
  )

  // ── Local UI state ──────────────────────────────────────────────────────
  const [openText,  setOpenText]  = useState(true)
  const [openMedia, setOpenMedia] = useState(true)
  const [openFiles, setOpenFiles] = useState(true)
  const [commentOpen, setCommentOpen] = useState(false)
  const [mediaDragOver, setMediaDragOver] = useState(false)
  const [filesDragOver, setFilesDragOver] = useState(false)

  // ── Refs ────────────────────────────────────────────────────────────────
  const rootRef       = useRef<HTMLDivElement>(null)
  const mediaInputRef = useRef<HTMLInputElement>(null)
  const filesInputRef = useRef<HTMLInputElement>(null)

  // ── ResizeObserver: sync auto-height back to store ──────────────────────
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const h = Math.round(entry.contentRect.height)
      if (Math.abs(h - card.h) > 2) onHeightChange(h)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [card.h, onHeightChange])

  // ── Media helpers ────────────────────────────────────────────────────────
  const attachFiles = async (files: FileList | null) => {
    if (!files) return
    for (const f of Array.from(files)) {
      const mediaId = makeId('m')
      await putMedia(mediaId, f)
      const kind = f.type.startsWith('video/') ? 'video' as const
                 : f.type.startsWith('image/') ? 'image' as const
                 : 'file' as const
      withHistory(boardId, () =>
        addMediaItem(card.id, kind, { mediaId, name: f.name, mime: f.type || 'application/octet-stream' })
      )
    }
  }

  const stop = (e: React.PointerEvent) => e.stopPropagation()

  // ─── COMPACT MODE ─────────────────────────────────────────────────────────
  if (!selected) {
    const visibleMedia = mediaItems.slice(0, 3)
    const overflow     = mediaItems.length - 3

    return (
      <div
        ref={rootRef}
        className={`canvas-card ${panMode ? 'canvas-card--pan' : ''}`}
        style={{ left: card.x, top: card.y, width: card.w, zIndex: card.z, cursor: panMode ? 'default' : 'grab' }}
        onDoubleClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => {
          if (panMode) return
          e.preventDefault()
          e.stopPropagation()
          onPointerDownDrag(e)
        }}
      >
        {/* Header */}
        <div style={{ padding: '13px 14px 10px' }}>
          <div className={`card-compact-title${hasIngestedTitle ? ' card-compact-title--filename' : ''}`}>{card.title || 'Untitled'}</div>
          {card.description && <div className="card-compact-desc">{card.description}</div>}
        </div>

        {/* Note preview */}
        {card.note && (
          <>
            <div className="card-divider" />
            <div className="card-compact-note" style={{ padding: '9px 14px' }}>{card.note}</div>
          </>
        )}

        {/* Media thumbnails */}
        {mediaItems.length > 0 && (
          <>
            <div className="card-divider" />
            <div style={{ padding: '8px 10px', display: 'flex', gap: 6 }}>
              {visibleMedia.map((m, i) =>
                i === 2 && overflow > 0
                  ? <div key={i} className="media-tile-overflow">+{overflow + 1}</div>
                  : (
                    <div key={i} className="media-thumb-wrap" style={{ pointerEvents: 'none' }}>
                      <CompactMediaTile mediaId={m.content.mediaId} name={m.content.name} />
                    </div>
                  )
              )}
            </div>
          </>
        )}

        {/* File pills */}
        {fileItems.length > 0 && (
          <>
            <div className="card-divider" />
            <div style={{ padding: '8px 10px', display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {fileItems.map((f) => (
                <span key={f.id} className="file-pill">
                  <IcoFile />
                  <span className="file-pill__label">{f.content.name ?? 'file'}</span>
                </span>
              ))}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="card-footer-stat">
          {commentCount > 0 && (
            <span className="card-footer-stat__item"><IcoComment /> {commentCount}</span>
          )}
          {linkCount > 0 && (
            <span className="card-footer-stat__item" style={{ color: 'rgb(var(--c-cyan-hi))' }}>
              <IcoLink /> {linkCount}
            </span>
          )}
          <span style={{ marginLeft: 'auto', opacity: 0.6 }}>{formatDate(card.updatedAt)}</span>
        </div>

        {/* Link handles */}
        {LINK_HANDLES.map((h) => (
          <button key={h.k} className="canvas-card__handle" title="Drag to link"
            style={h.style as React.CSSProperties}
            onPointerDown={(e) => {
              if (panMode) return
              e.preventDefault(); e.stopPropagation()
              onStartLink(e)
            }}
          >
            <svg width="7" height="7" viewBox="0 0 24 24" fill="rgb(var(--c-brand-hi))" stroke="none">
              <circle cx="12" cy="12" r="6"/>
            </svg>
          </button>
        ))}

        {/* Resize handles */}
        {RESIZE_HANDLES.map(({ c, style }) => (
          <div key={c} className="canvas-card__resize" style={style}
            onPointerDown={(e) => {
              if (panMode) return
              e.preventDefault(); e.stopPropagation()
              onPointerDownResize()(e)
            }}
          />
        ))}
      </div>
    )
  }

  // ─── EXPANDED MODE ────────────────────────────────────────────────────────
  return (
    <div
      ref={rootRef}
      className="canvas-card canvas-card--selected"
      style={{ left: card.x, top: card.y, width: card.w, zIndex: card.z }}
      onDoubleClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* ── Grip drag header ───────────────────────────────────────────── */}
      <div
        className="card-grip-header"
        onPointerDown={(e) => {
          if (panMode) return
          e.preventDefault()
          e.stopPropagation()
          onPointerDownDrag(e)
        }}
      >
        <span style={{ color: 'rgb(var(--c-faint))' }}><IcoGrip /></span>
        <span style={{ fontSize: 10, color: 'rgb(var(--c-faint))', flex: 1 }}>drag to move</span>

        {/* Delete card */}
        <button
          className="card-action-btn"
          title="Delete card"
          onPointerDown={stop}
          onClick={(e) => {
            e.stopPropagation()
            withHistory(boardId, () => deleteCard(card.id))
          }}
          style={{ color: 'rgb(var(--c-red))' }}
        >
          <IcoTrash /><span style={{ fontSize: 10 }}>Delete</span>
        </button>

        <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />

        {/* Close/Deselect card */}
        <button
          className="card-action-btn"
          title="Close / Unfocus card"
          onPointerDown={stop}
          onClick={(e) => {
            e.stopPropagation()
            onDeselect()
          }}
          style={{ color: 'rgb(var(--c-text))' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      {/* ── Title + Description ────────────────────────────────────────── */}
      <div style={{ padding: '10px 14px 10px' }}>
        <input
          className="card-input card-title-input"
          value={card.title}
          placeholder="Card title"
          onPointerDown={stop}
          onChange={(e) => updateCard(card.id, { title: e.target.value })}
          onBlur={() => withHistory(boardId, () => updateCard(card.id, { title: card.title }))}
        />
        <input
          className="card-input card-desc-input"
          value={card.description}
          placeholder="Short description…"
          onPointerDown={stop}
          onChange={(e) => updateCard(card.id, { description: e.target.value })}
          onBlur={() => withHistory(boardId, () => updateCard(card.id, { description: card.description }))}
        />
      </div>

      {/* ── TEXT section ──────────────────────────────────────────────── */}
      <div className="card-section">
        <SectionHeader
          label="Text"
          icon={<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="10" x2="20" y2="10"/><line x1="4" y1="14" x2="14" y2="14"/></svg>}
          count={card.note ? 1 : 0}
          open={openText}
          onToggle={() => setOpenText((p) => !p)}
          onComment={() => setCommentOpen((p) => !p)}
        />
        {openText && (
          <div className="card-section-body">
            <textarea
              className="card-note-textarea"
              value={card.note ?? ''}
              placeholder="Write a note or task…"
              onPointerDown={stop}
              onChange={(e) => setCardNote(card.id, e.target.value)}
              onBlur={() => withHistory(boardId, () => setCardNote(card.id, card.note ?? ''))}
            />
          </div>
        )}
      </div>

      {/* ── MEDIA section ─────────────────────────────────────────────── */}
      <div className="card-section">
        <SectionHeader
          label="Media"
          icon={<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>}
          count={mediaItems.length}
          open={openMedia}
          onToggle={() => setOpenMedia((p) => !p)}
          onComment={() => setCommentOpen((p) => !p)}
        />
        {openMedia && (
          <div className="card-section-body">
            {/* Media grid */}
            {mediaItems.length > 0 && (
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                {mediaItems.map((m) => (
                  <MediaTile key={m.id} item={m}
                    onDelete={() => withHistory(boardId, () => deleteItem(m.id))}
                  />
                ))}
              </div>
            )}

            {/* Drop zone */}
            <div
              className={`card-drop-zone${mediaDragOver ? ' drag-over' : ''}`}
              onPointerDown={stop}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setMediaDragOver(true) }}
              onDragLeave={() => setMediaDragOver(false)}
              onDrop={async (e) => {
                e.preventDefault(); e.stopPropagation(); setMediaDragOver(false)
                await attachFiles(e.dataTransfer.files)
              }}
              onClick={() => mediaInputRef.current?.click()}
              style={{ cursor: 'pointer' }}
            >
              {mediaDragOver ? '⬇ Drop images / videos here' : '+ Drop or click to add images / videos'}
            </div>
            <input
              ref={mediaInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => attachFiles(e.target.files).then(() => { if(mediaInputRef.current) mediaInputRef.current.value = '' })}
            />
          </div>
        )}
      </div>

      {/* ── FILES section ─────────────────────────────────────────────── */}
      <div className="card-section">
        <SectionHeader
          label="Files"
          icon={<IcoFile />}
          count={fileItems.length}
          open={openFiles}
          onToggle={() => setOpenFiles((p) => !p)}
          onComment={() => setCommentOpen((p) => !p)}
        />
        {openFiles && (
          <div className="card-section-body">
            {/* File list */}
            {fileItems.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 8 }}>
                {fileItems.map((f) => (
                  <FileItemLine key={f.id} f={f} boardId={boardId} deleteItem={deleteItem} withHistory={withHistory} />
                ))}
              </div>
            )}

            {/* Drop zone */}
            <div
              className={`card-drop-zone${filesDragOver ? ' drag-over' : ''}`}
              onPointerDown={stop}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setFilesDragOver(true) }}
              onDragLeave={() => setFilesDragOver(false)}
              onDrop={async (e) => {
                e.preventDefault(); e.stopPropagation(); setFilesDragOver(false)
                await attachFiles(e.dataTransfer.files)
              }}
              onClick={() => filesInputRef.current?.click()}
              style={{ cursor: 'pointer' }}
            >
              {filesDragOver ? '⬇ Drop files here' : '+ Drop or click to attach files'}
            </div>
            <input
              ref={filesInputRef}
              type="file"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => attachFiles(e.target.files).then(() => { if(filesInputRef.current) filesInputRef.current.value = '' })}
            />
          </div>
        )}
      </div>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <div className="card-footer-stat">
        <button
          className="card-action-btn"
          onPointerDown={stop}
          onClick={(e) => {
            e.stopPropagation()
            onConvertToTask(card)
          }}
          role="button"
          aria-label="Convert to Task"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span>Convert to Task</span>
        </button>
        <button
          className={`card-action-btn${commentOpen ? ' active' : ''}`}
          onPointerDown={stop}
          onClick={(e) => { e.stopPropagation(); setCommentOpen((p) => !p) }}
          title="Comments"
        >
          <IcoComment />
          <span>{commentCount}</span>
        </button>
        {linkCount > 0 && (
          <span className="card-footer-stat__item" style={{ color: 'rgb(var(--c-cyan-hi))' }}>
            <IcoLink /> {linkCount}
          </span>
        )}
        <span style={{ marginLeft: 'auto', opacity: 0.6 }}>{formatDate(card.updatedAt)}</span>
      </div>

      {/* ── Comment bubble ────────────────────────────────────────────── */}
      {commentOpen && (
        <CommentBubble
          cardId={card.id}
          boardId={boardId}
          onClose={() => setCommentOpen(false)}
        />
      )}

      {/* ── Link handles ──────────────────────────────────────────────── */}
      {LINK_HANDLES.map((h) => (
        <button key={h.k} className="canvas-card__handle" title="Drag to link"
          style={h.style as React.CSSProperties}
          onPointerDown={(e) => {
            if (panMode) return
            e.preventDefault(); e.stopPropagation()
            onStartLink(e)
          }}
        >
          <svg width="7" height="7" viewBox="0 0 24 24" fill="rgb(var(--c-brand-hi))" stroke="none">
            <circle cx="12" cy="12" r="6"/>
          </svg>
        </button>
      ))}

      {/* ── Resize handles ────────────────────────────────────────────── */}
      {RESIZE_HANDLES.map(({ c, style }) => (
        <div key={c} className="canvas-card__resize" style={style}
          onPointerDown={(e) => {
            if (panMode) return
            e.preventDefault(); e.stopPropagation()
            onPointerDownResize()(e)
          }}
        />
      ))}
    </div>
  )
}

// ── Compact media tile (no delete button) ────────────────────────────────────
function CompactMediaTile({ mediaId, name }: { mediaId?: ID; name?: string }) {
  const url = useMediaUrl(mediaId)
  if (!url) {
    return (
      <div className="media-tile-empty">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
        </svg>
      </div>
    )
  }
  return <img src={url} alt={name ?? ''} className="media-tile" draggable={false} />
}
