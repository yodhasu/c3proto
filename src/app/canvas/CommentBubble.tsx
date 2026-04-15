import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { useShallow } from 'zustand/react/shallow'
import type { ID } from '../model/types'

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

type Props = {
  cardId: ID
  boardId: ID
  onClose: () => void
}

export function CommentBubble({ cardId, boardId, onClose }: Props) {
  const comments = useAppStore(useShallow((s) =>
    Object.values(s.comments)
      .filter((c) => c.cardId === cardId)
      .sort((a, b) => a.createdAt - b.createdAt)
  ))
  const users  = useAppStore((s) => s.users)
  const addComment  = useAppStore((s) => s.addComment)
  const withHistory = useAppStore((s) => s.withHistory)

  const [draft, setDraft] = useState('')
  const threadRef = useRef<HTMLDivElement>(null)
  const bubbleRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to newest comment
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight
    }
  }, [comments.length])

  // Close on outside pointer-down or Escape
  useEffect(() => {
    const handleDown = (e: PointerEvent) => {
      if (bubbleRef.current && !bubbleRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    // Delay so the same click that opened the bubble doesn't close it immediately
    const t = setTimeout(() => {
      window.addEventListener('pointerdown', handleDown)
      window.addEventListener('keydown', handleKey)
    }, 60)
    return () => {
      clearTimeout(t)
      window.removeEventListener('pointerdown', handleDown)
      window.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  const post = () => {
    if (!draft.trim()) return
    withHistory(boardId, () => addComment(cardId, draft.trim()))
    setDraft('')
  }

  return (
    <div
      ref={bubbleRef}
      className="comment-bubble"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 12px 8px',
        borderBottom: '1px solid rgba(var(--c-border), 0.5)',
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'rgb(var(--c-text))' }}>
          Comments{comments.length > 0 && (
            <span style={{ marginLeft: 5, color: 'rgb(var(--c-faint))', fontWeight: 400 }}>
              ({comments.length})
            </span>
          )}
        </span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'rgb(var(--c-muted))',
            fontSize: 16,
            lineHeight: 1,
            padding: '0 2px',
            transition: 'color 0.12s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'rgb(var(--c-text))' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'rgb(var(--c-muted))' }}
        >
          ×
        </button>
      </div>

      {/* Comment thread */}
      <div
        ref={threadRef}
        style={{
          maxHeight: 220,
          overflowY: 'auto',
          padding: '8px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {comments.length === 0 && (
          <div style={{
            fontSize: 11,
            color: 'rgb(var(--c-faint))',
            textAlign: 'center',
            padding: '16px 0',
            lineHeight: 1.6,
          }}>
            No comments yet.<br />Be the first to add one.
          </div>
        )}
        {comments.map((c) => (
          <div key={c.id}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 4,
            }}>
              <div style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgb(var(--c-brand)), rgb(var(--c-cyan)))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 9,
                fontWeight: 700,
                color: '#fff',
                flexShrink: 0,
              }}>
                {(users[c.authorId]?.name ?? 'U')[0].toUpperCase()}
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'rgb(var(--c-muted))' }}>
                {users[c.authorId]?.name ?? 'User'}
              </span>
              <span style={{ fontSize: 10, color: 'rgb(var(--c-faint))', marginLeft: 'auto' }}>
                {formatDate(c.createdAt)}
              </span>
            </div>
            <div style={{
              fontSize: 12,
              color: 'rgb(var(--c-text))',
              lineHeight: 1.55,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              paddingLeft: 26,
            }}>
              {c.body}
            </div>
          </div>
        ))}
      </div>

      {/* Reply box */}
      <div style={{
        padding: '8px 12px 10px',
        borderTop: '1px solid rgba(var(--c-border), 0.5)',
      }}>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault()
              post()
            }
          }}
          placeholder="Add a comment… (Ctrl+Enter to post)"
          rows={2}
          style={{
            width: '100%',
            background: 'rgba(255,255,255,.04)',
            border: '1px solid rgba(var(--c-border), 0.8)',
            borderRadius: 'var(--r-sm)',
            color: 'rgb(var(--c-text))',
            fontSize: 12,
            padding: '7px 9px',
            resize: 'none',
            outline: 'none',
            fontFamily: 'inherit',
            lineHeight: 1.5,
            boxSizing: 'border-box',
            transition: 'border-color 0.15s',
          }}
          onFocus={(e) => { e.target.style.borderColor = 'rgb(var(--c-brand))' }}
          onBlur={(e) => { e.target.style.borderColor = 'rgba(var(--c-border), 0.8)' }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
          <button
            onClick={post}
            disabled={!draft.trim()}
            className="btn btn-primary"
            style={{ padding: '4px 14px', fontSize: 11, opacity: draft.trim() ? 1 : 0.45 }}
          >
            Post
          </button>
        </div>
      </div>
    </div>
  )
}
