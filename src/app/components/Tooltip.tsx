import type { ReactElement } from 'react'
import { useId } from 'react'

export function Tooltip({ content, children }: { content: string; children: ReactElement }) {
  const tooltipId = useId()

  return (
    <span className="tooltip-anchor">
      {children}
      <span role="tooltip" id={tooltipId} className="tooltip-bubble">
        {content}
      </span>
    </span>
  )
}
