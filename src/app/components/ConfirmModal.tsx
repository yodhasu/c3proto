import { Modal } from './Modal'

type ConfirmModalProps = {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'default' | 'danger'
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  return (
    <Modal open={open} title={title} onClose={onClose} widthClass="w-[520px]">
      <div style={{ display: 'grid', gap: 22 }}>
        <div
          style={{
            display: 'grid',
            gap: 12,
            padding: 18,
            borderRadius: 18,
            background: tone === 'danger' ? 'linear-gradient(135deg, rgba(239,68,68,0.14), rgba(255,255,255,0.03))' : 'rgba(255,255,255,0.04)',
            border: tone === 'danger' ? '1px solid rgba(239,68,68,0.24)' : '1px solid rgba(var(--c-border), 0.65)',
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              display: 'grid',
              placeItems: 'center',
              background: tone === 'danger' ? 'rgba(239,68,68,0.16)' : 'rgba(var(--c-brand), 0.14)',
              color: tone === 'danger' ? 'rgb(254,202,202)' : 'rgb(var(--c-brand-hi))',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            </svg>
          </div>
          <div className="font-display" style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.1 }}>
            {title}
          </div>
          <div style={{ color: 'rgb(var(--c-muted))', fontSize: 14, lineHeight: 1.6 }}>
            {message}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button className="btn btn-ghost" onClick={onClose}>{cancelLabel}</button>
          <button
            className={tone === 'danger' ? 'btn' : 'btn btn-primary'}
            onClick={onConfirm}
            style={tone === 'danger' ? { background: 'rgb(var(--c-red))', color: '#fff', borderColor: 'rgba(var(--c-red), 0.8)' } : undefined}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
