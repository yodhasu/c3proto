import { useMemo, useState } from 'react'
import type { CardItem, ID } from '../model/types'
import { useAppStore } from '../store/useAppStore'
import { id as makeId } from '../utils/id'
import { putMedia } from '../store/media'
import { useMediaUrl } from './useMediaUrl'

function ItemRow({ item }: { item: CardItem }) {
  const url = useMediaUrl(item.content.mediaId)

  if (item.type === 'text') {
    return (
      <div className="rounded border border-border bg-white/5 p-2">
        <div className="text-[10px] text-muted mb-1">Text</div>
        <div className="text-sm whitespace-pre-wrap break-words">{item.content.text || '…'}</div>
      </div>
    )
  }

  return (
    <div className="rounded border border-border bg-white/5 p-2">
      <div className="text-[10px] text-muted mb-2">{item.type.toUpperCase()}</div>
      {url ? (
        item.type === 'image' ? (
          <img src={url} className="max-h-48 w-full object-contain rounded" />
        ) : item.type === 'video' ? (
          <video src={url} controls className="max-h-48 w-full rounded" />
        ) : (
          <a
            className="text-sm text-brand underline"
            href={url}
            download={item.content.name ?? 'file'}
          >
            Download {item.content.name ?? 'file'}
          </a>
        )
      ) : (
        <div className="text-xs text-muted">(media missing)</div>
      )}
      <div className="mt-2 text-xs text-muted truncate">{item.content.name}</div>
    </div>
  )
}

export function RightPanel({ boardId, cardId, onClose }: { boardId: ID; cardId: ID; onClose: () => void }) {
  const card = useAppStore((s) => s.cards[cardId])
  const items = useAppStore((s) => s.getCardItems(cardId))
  const comments = useAppStore((s) => s.getCardComments(cardId))
  const users = useAppStore((s) => s.users)

  const updateCard = useAppStore((s) => s.updateCard)
  const withHistory = useAppStore((s) => s.withHistory)
  const addTextItem = useAppStore((s) => s.addTextItem)
  const updateItem = useAppStore((s) => s.updateItem)
  const addMediaItem = useAppStore((s) => s.addMediaItem)
  const addComment = useAppStore((s) => s.addComment)
  const deleteCard = useAppStore((s) => s.deleteCard)

  const [commentDraft, setCommentDraft] = useState('')

  const authorName = useMemo(() => {
    const u = card ? users[useAppStore.getState().currentUserId] : undefined
    return u?.name ?? 'You'
  }, [card, users])

  if (!card) return null

  const onUpload = async (file: File, kind: 'image' | 'video' | 'file') => {
    const mediaId = makeId('m')
    await putMedia(mediaId, file)
    withHistory(boardId, () => {
      addMediaItem(cardId, kind, { mediaId, name: file.name, mime: file.type || 'application/octet-stream' })
    })
  }

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
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted">Items</div>
            <button
              className="text-xs rounded border border-border px-2 py-1 text-muted hover:text-text hover:bg-white/5"
              onClick={() => withHistory(boardId, () => addTextItem(cardId))}
            >
              + Text
            </button>
          </div>
          <div className="mt-3 space-y-2">
            {items.map((it) => (
              <div key={it.id}>
                {it.type === 'text' ? (
                  <div className="rounded border border-border bg-white/5 p-2">
                    <div className="text-[10px] text-muted mb-1">Text</div>
                    <textarea
                      value={it.content.text ?? ''}
                      onChange={(e) => updateItem(it.id, { content: { ...it.content, text: e.target.value } })}
                      onBlur={() => withHistory(boardId, () => updateItem(it.id, { content: { ...it.content } }))}
                      rows={3}
                      className="w-full rounded border border-border bg-transparent px-2 py-1 text-sm outline-none focus:border-brand"
                    />
                  </div>
                ) : (
                  <ItemRow item={it} />
                )}
              </div>
            ))}
            {items.length === 0 && <div className="text-xs text-muted">No items yet.</div>}
          </div>

          <div className="mt-3 flex gap-2">
            <label className="text-xs rounded border border-border px-2 py-1 text-muted hover:text-text hover:bg-white/5 cursor-pointer">
              + Image
              <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void onUpload(f, 'image')
                e.currentTarget.value = ''
              }} />
            </label>
            <label className="text-xs rounded border border-border px-2 py-1 text-muted hover:text-text hover:bg-white/5 cursor-pointer">
              + Video
              <input type="file" accept="video/*" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void onUpload(f, 'video')
                e.currentTarget.value = ''
              }} />
            </label>
            <label className="text-xs rounded border border-border px-2 py-1 text-muted hover:text-text hover:bg-white/5 cursor-pointer">
              + File
              <input type="file" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void onUpload(f, 'file')
                e.currentTarget.value = ''
              }} />
            </label>
          </div>
        </div>

        <div>
          <div className="text-xs text-muted mb-2">Comments</div>
          <div className="space-y-2">
            {comments.map((c) => (
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
    </div>
  )
}
