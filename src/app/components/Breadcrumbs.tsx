import { Link } from 'react-router-dom'

type Crumb = {
  label: string
  to?: string
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        return (
          <div key={`${item.label}-${index}`} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {index > 0 && <span style={{ color: 'rgb(var(--c-faint))', fontSize: 11 }}>/</span>}
            {item.to && !isLast ? (
              <Link
                to={item.to}
                style={{
                  color: 'rgb(var(--c-muted))',
                  textDecoration: 'none',
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                }}
              >
                {item.label}
              </Link>
            ) : (
              <span
                style={{
                  color: isLast ? 'rgb(var(--c-text))' : 'rgb(var(--c-muted))',
                  fontSize: 12,
                  fontWeight: isLast ? 700 : 600,
                  letterSpacing: '0.02em',
                }}
              >
                {item.label}
              </span>
            )}
          </div>
        )
      })}
    </nav>
  )
}
