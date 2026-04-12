import clsx from 'clsx'
import type { User } from '../model/types'

export function AvatarStack({ users, max = 5 }: { users: User[]; max?: number }) {
  const shown = users.slice(0, max)
  const extra = users.length - shown.length
  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {shown.map((u) => (
          <img
            key={u.id}
            src={u.avatarUrl}
            alt={u.name}
            title={u.name}
            className={clsx(
              'h-7 w-7 rounded-full border border-border object-cover',
              'ring-2 ring-bg',
            )}
            referrerPolicy="no-referrer"
          />
        ))}
      </div>
      {extra > 0 && (
        <span className="ml-2 text-xs text-muted">+{extra}</span>
      )}
    </div>
  )
}
