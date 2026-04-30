import { PageTitle } from './PageTitle'

export function PageHeader({ title, subtitle, date, rightSlot }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <PageTitle>{title}</PageTitle>
        {subtitle && (
          <p className="text-sm font-sans text-muted mt-1">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-3 mt-1">
        {date && (
          <span className="text-sm font-sans text-muted">{date}</span>
        )}
        {rightSlot}
      </div>
    </div>
  )
}
