import { useEffect } from 'react'

export function Modal({
  open,
  title,
  onClose,
  children,
  widthClass = 'w-[720px]',
}: {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
  widthClass?: string
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[999]">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <div className={`${widthClass} max-w-[95vw] max-h-[90vh] rounded-lg border border-border bg-panel shadow-panel overflow-hidden flex flex-col`}>
          <div className="h-12 px-4 flex items-center justify-between border-b border-border">
            <div className="text-sm font-semibold truncate">{title}</div>
            <button className="text-xs text-muted hover:text-text" onClick={onClose}>
              Close
            </button>
          </div>
          <div className="p-4 overflow-auto">{children}</div>
        </div>
      </div>
    </div>
  )
}
