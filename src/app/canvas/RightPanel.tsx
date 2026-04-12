import { useMemo, useRef, useState } from 'react'
import type { CardComment, CardItem, ID } from '../model/types'
import { useAppStore } from '../store/useAppStore'
import { id as makeId } from '../utils/id'
import { putMedia } from '../store/media'
import { useMediaUrl } from './useMediaUrl'
import { Modal } from '../components/Modal'

function isMediaFile(f: File) {
  return f.type.startsWith('image/') || f.type.startsWith('video/')
}

function mediaKind(f: File): 'image' | 'video' {
  return f.type.startsWith('video/') ? 'video' : 'image'
}

function MediaThumb({ mediaId, name }: { mediaId?: ID; name?: string }) {
  const url = useMediaUrl(mediaId)
  if (!url) {
    return (
      <div className="h-10 w-10 rounded border border-border bg-black/30 flex items-center justify-center text-[10px] text-muted">
        …
      </div>
    )
  }
  return <img src={url} alt={name ?? ''} className="h-10 w-10 rounded border border-border object-cover" />
}

function Container({
  title,
  subtitle,
  count,
  previews,
  onOpen,
  children,
}: {
  title: string
  subtitle: string
  count: number
  previews: React.ReactNode
  onOpen: () => void
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-border bg-white/5">
      <button
        className="w-full px-3 py-3 flex items-center justify-between gap-3 hover:bg-white/5"
        onClick={onOpen}
        title="Open"
      >
        <div className="min-w-0 text-left">
          <div className="text-sm font-semibold">{title}</div>
          <div className="text-[11px] text-muted truncate">{subtitle}</div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex gap-1">{previews}</div>
          <div className="text-[11px] rounded border border-border bg-white/5 px-2 py-1 text-muted">
            {count}
          </div>
          <div className="text-muted">▾</div>
        </div>
      </button>
      <div className="px-3 pb-3">{children}</div>
    </div>
  )
}

export function RightPanel({ boardId, cardId, onClose }: { boardId: ID; cardId: ID; onClose: () => void }) {
  const card = useAppStore((s) => s.cards[cardId])
  const itemsById = useAppStore((s) => s.items)
  const commentsById = useAppStore((s) => s.comments)
  const users = useAppStore((s) => s.users)

  const updateCard = useAppStore((s) => s.updateCard)
  const withHistory = useAppStore((s) => s.withHistory)
  const addTextItem = useAppStore((s) => s.addTextItem)
  const updateItem = useAppStore((s) => s.updateItem)
  const deleteItem = useAppStore((s) => s.deleteItem)
  const addMediaItem = useAppStore((s) => s.addMediaItem)
  const addComment = useAppStore((s) => s.addComment)
  const deleteCard = useAppStore((s) => s.deleteCard)

  const items = useMemo(() => {
    return Object.values(itemsById)
      .filter((it) => it.cardId === cardId)
      .sort((a, b) => a.position - b.position)
  }, [itemsById, cardId])

  const textItems = useMemo(() => items.filter((i) => i.type === 'text'), [items])
  const mediaItems = useMemo(() => items.filter((i) => i.type === 'image' || i.type === 'video'), [items])
  const fileItems = useMemo(() => items.filter((i) => i.type === 'file'), [items])

  const comments = useMemo(() => {
    return Object.values(commentsById)
      .filter((cm) => cm.cardId === cardId)
      .sort((a, b) => a.createdAt - b.createdAt)
  }, [commentsById, cardId])

  const [commentDraft, setCommentDraft] = useState('')

  const [modal, setModal] = useState<null | 'text' | 'media' | 'file'>(null)

  const textDraftRef = useRef<HTMLTextAreaElement | null>(null)
  const mediaPickerRef = useRef<HTMLInputElement | null>(null)
  const filePickerRef = useRef<HTMLInputElement | null>(null)

  if (!card) return null

  const authorName = users[useAppStore.getState().currentUserId]?.name ?? 'You'

  const attachMedia = async (f: File) => {
    if (!isMediaFile(f)) {
      alert('This is not an image/video. Use Files container.')
      return
    }
    const mediaId = makeId('m')
    await putMedia(mediaId, f)
    withHistory(boardId, () => {
      addMediaItem(cardId, mediaKind(f), { mediaId, name: f.name, mime: f.type || 'application/octet-stream' })
    })
  }

  const attachFile = async (f: File) => {
    if (isMediaFile(f)) {
      alert('Images/videos belong in Media container.')
      return
    }
    const mediaId = makeId('m')
    await putMedia(mediaId, f)
    withHistory(boardId, () => {
      addMediaItem(cardId, 'file', { mediaId, name: f.name, mime: f.type || 'application/octet-stream' })
    })
  }

  const addText = () => {
    const el = textDraftRef.current
    const text = (el?.value ?? '').trim()
    if (!text) return
    withHistory(boardId, () => {
      const id = addTextItem(cardId)
      updateItem(id, { content: { text } })
    })
    if (el) el.value = ''
  }
  const textPreviews = (
    <>
      {(textItems.slice(0, 3) as CardItem[]).map((t) => (
        <div key={t.id} className="h-10 w-10 rounded border border-border bg-black/25 p-1 text-[10px] text-muted overflow-hidden">
          {(t.content.text ?? '…').slice(0, 14)}
        </div>
      ))}
      {textItems.length === 0 && (
        <div className="h-10 w-10 rounded border border-border bg-black/25 flex items-center justify-center text-[10px] text-muted">
          T
        </div>
      )}
    </>
  )

  const mediaPreviews = (
    <>
      {mediaItems.slice(0, 3).map((m) => (
        <MediaThumb key={m.id} mediaId={m.content.mediaId} name={m.content.name} />
      ))}
      {mediaItems.length === 0 && (
        <div className="h-10 w-10 rounded border border-border bg-black/25 flex items-center justify-center text-[10px] text-muted">
          M
        </div>
      )}
    </>
  )

  const filePreviews = (
    <>
      {fileItems.slice(0, 3).map((f) => (
        <div key={f.id} className="h-10 w-10 rounded border border-border bg-black/25 p-1 text-[10px] text-muted overflow-hidden">
          {(f.content.name ?? 'file').slice(0, 10)}
        </div>
      ))}
      {fileItems.length === 0 && (
        <div className="h-10 w-10 rounded border border-border bg-black/25 flex items-center justify-center text-[10px] text-muted">
          F
        </div>
      )}
    </>
  )

  return (
    <div className="w-[420px] shrink-0 border-l border-border bg-panel/70 backdrop-blur h-full flex flex-col">
      <div className="h-12 px-4 flex items-center justify-between border-b border-border">
        <div className="text-sm font-semibold truncate">Card details</div>
        <button className="text-xs text-muted hover:text-text" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-5">
        <div>
          <div className="text-xs text-muted mb-1">Title</div>
          <input
            value={card.title}
            onChange={(e) => updateCard(cardId, { title: e.target.value })}
            onBlur={() => withHistory(boardId, () => updateCard(cardId, { title: card.title }))}
            className="w-full rounded border border-border bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </div>

        <div>
          <div className="text-xs text-muted mb-1">Description</div>
          <textarea
            value={card.description}
            onChange={(e) => updateCard(cardId, { description: e.target.value })}
            onBlur={() => withHistory(boardId, () => updateCard(cardId, { description: card.description }))}
            rows={4}
            className="w-full rounded border border-border bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </div>

        <div>
          <div className="text-xs text-muted mb-2">Items</div>
          <div className="space-y-3">
            <Container
              title="Text"
              subtitle="Notes, tasks, checklists (prototype: plain text)"
              count={textItems.length}
              previews={textPreviews}
              onOpen={() => setModal('text')}
            >
              <textarea
                ref={textDraftRef}
                placeholder="Write a note or task…"
                rows={3}
                className="w-full rounded border border-border bg-white/5 px-2 py-2 text-sm outline-none focus:border-brand"
              />
              <div className="mt-2 flex justify-end">
                <button className="rounded bg-brand px-3 py-2 text-xs font-medium text-white hover:opacity-90" onClick={addText}>
                  Add text
                </button>
              </div>
            </Container>

            <Container
              title="Media"
              subtitle="Images and videos"
              count={mediaItems.length}
              previews={mediaPreviews}
              onOpen={() => setModal('media')}
            >
              <div
                className="rounded border border-border bg-white/5 p-3 text-xs text-muted"
                onDragOver={(e) => {
                  const files = Array.from(e.dataTransfer.files ?? [])
                  if (files.length > 0 && files.every(isMediaFile)) {
                    e.preventDefault()
                    e.dataTransfer.dropEffect = 'copy'
                  }
                }}
                onDrop={async (e) => {
                  e.preventDefault()
                  const files = Array.from(e.dataTransfer.files ?? []).filter(isMediaFile)
                  for (const f of files) await attachMedia(f)
                }}
              >
                Drop images/videos here
                <div className="mt-2">
                  <button
                    className="rounded border border-border px-2 py-1 text-xs text-muted hover:text-text hover:bg-white/5"
                    onClick={() => mediaPickerRef.current?.click()}
                  >
                    Choose media…
                  </button>
                  <input
                    ref={mediaPickerRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    onChange={async (e) => {
                      const files = Array.from(e.target.files ?? [])
                      for (const f of files) await attachMedia(f)
                      e.currentTarget.value = ''
                    }}
                  />
                </div>
              </div>
            </Container>

            <Container
              title="Files"
              subtitle="Documents and other attachments"
              count={fileItems.length}
              previews={filePreviews}
              onOpen={() => setModal('file')}
            >
              <div
                className="rounded border border-border bg-white/5 p-3 text-xs text-muted"
                onDragOver={(e) => {
                  const files = Array.from(e.dataTransfer.files ?? [])
                  if (files.length > 0 && files.every((f) => !isMediaFile(f))) {
                    e.preventDefault()
                    e.dataTransfer.dropEffect = 'copy'
                  }
                }}
                onDrop={async (e) => {
                  e.preventDefault()
                  const files = Array.from(e.dataTransfer.files ?? []).filter((f) => !isMediaFile(f))
                  for (const f of files) await attachFile(f)
                }}
              >
                Drop files here
                <div className="mt-2">
                  <button
                    className="rounded border border-border px-2 py-1 text-xs text-muted hover:text-text hover:bg-white/5"
                    onClick={() => filePickerRef.current?.click()}
                  >
                    Choose files…
                  </button>
                  <input
                    ref={filePickerRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={async (e) => {
                      const files = Array.from(e.target.files ?? [])
                      for (const f of files) await attachFile(f)
                      e.currentTarget.value = ''
                    }}
                  />
                </div>
              </div>
            </Container>
          </div>
        </div>

        <div>
          <div className="text-xs text-muted mb-2">Comments</div>
          <div className="space-y-2">
            {comments.map((c: CardComment) => (
              <div key={c.id} className="rounded border border-border bg-white/5 p-2">
                <div className="text-[10px] text-muted">
                  {users[c.authorId]?.name ?? 'User'} • {new Date(c.createdAt).toLocaleString()}
                </div>
                <div className="text-sm mt-1 whitespace-pre-wrap">{c.body}</div>
              </div>
            ))}
            {comments.length === 0 && <div className="text-xs text-muted">No comments yet.</div>}
          </div>

          <div className="mt-2">
            <div className="text-[10px] text-muted mb-1">Comment as {authorName}</div>
            <textarea
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
              rows={3}
              className="w-full rounded border border-border bg-white/5 px-2 py-1 text-sm outline-none focus:border-brand"
            />
            <button
              className="mt-2 rounded bg-brand px-3 py-2 text-sm font-medium text-white hover:opacity-90"
              onClick={() => {
                if (!commentDraft.trim()) return
                withHistory(boardId, () => addComment(cardId, commentDraft.trim()))
                setCommentDraft('')
              }}
            >
              Post
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <button
            className="rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200 hover:bg-red-500/20"
            onClick={() => {
              if (!confirm('Delete this card?')) return
              withHistory(boardId, () => deleteCard(cardId))
              onClose()
            }}
          >
            Delete card
          </button>
        </div>
      </div>

      <Modal
        open={modal === 'text'}
        title={`Text items (${textItems.length})`}
        onClose={() => setModal(null)}
        widthClass="w-[760px]"
      >
        <div className="space-y-3">
          {textItems.length === 0 && <div className="text-sm text-muted">No text items.</div>}
          {textItems.map((it) => (
            <div key={it.id} className="rounded border border-border bg-white/5 p-3">
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted">Text</div>
                <button
                  className="text-xs rounded border border-border px-2 py-1 text-muted hover:text-text hover:bg-white/5"
                  onClick={() => {
                    if (!confirm('Delete this text item?')) return
                    withHistory(boardId, () => deleteItem(it.id))
                  }}
                >
                  Delete
                </button>
              </div>
              <textarea
                value={it.content.text ?? ''}
                onChange={(e) => updateItem(it.id, { content: { ...it.content, text: e.target.value } })}
                onBlur={() => withHistory(boardId, () => updateItem(it.id, { content: { ...it.content } }))}
                rows={4}
                className="mt-2 w-full rounded border border-border bg-transparent px-2 py-2 text-sm outline-none focus:border-brand"
              />
            </div>
          ))}
        </div>
      </Modal>

      <Modal
        open={modal === 'media'}
        title={`Media items (${mediaItems.length})`}
        onClose={() => setModal(null)}
        widthClass="w-[860px]"
      >
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {mediaItems.length === 0 && <div className="text-sm text-muted">No media items.</div>}
          {mediaItems.map((it) => (
            <div key={it.id} className="rounded border border-border bg-white/5 p-2">
              <div className="flex items-center justify-between">
                <div className="text-[11px] text-muted truncate">{it.content.name ?? it.type}</div>
                <button
                  className="text-[11px] rounded border border-border px-2 py-0.5 text-muted hover:text-text hover:bg-white/5"
                  onClick={() => {
                    if (!confirm('Delete this item?')) return
                    withHistory(boardId, () => deleteItem(it.id))
                  }}
                >
                  Delete
                </button>
              </div>
              <div className="mt-2">
                <MediaThumb mediaId={it.content.mediaId} name={it.content.name} />
              </div>
              <div className="mt-2 text-[11px] text-muted">{it.type.toUpperCase()}</div>
            </div>
          ))}
        </div>
      </Modal>

      <Modal
        open={modal === 'file'}
        title={`Files (${fileItems.length})`}
        onClose={() => setModal(null)}
        widthClass="w-[860px]"
      >
        <div className="space-y-2">
          {fileItems.length === 0 && <div className="text-sm text-muted">No files.</div>}
          {fileItems.map((it) => (
            <div key={it.id} className="rounded border border-border bg-white/5 p-2 flex items-center justify-between">
              <div className="min-w-0">
                <div className="text-sm truncate">{it.content.name ?? 'file'}</div>
                <div className="text-[11px] text-muted truncate">{it.content.mime ?? ''}</div>
              </div>
              <button
                className="text-xs rounded border border-border px-2 py-1 text-muted hover:text-text hover:bg-white/5"
                onClick={() => {
                  if (!confirm('Delete this file?')) return
                  withHistory(boardId, () => deleteItem(it.id))
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}
