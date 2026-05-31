import { CheckCircle2, MessageSquare, FileText } from 'lucide-react'

export function ActivityEvent({ event, isLast }) {
  let iconEl, iconBg, title, detail, body = null

  if (event.type === 'custody') {
    iconEl = <CheckCircle2 size={13} className="text-primary" />
    iconBg = 'bg-primary/15'
    title = event.label
    detail = `Logged by ${event.staff} · ${event.time}`
  } else if (event.type === 'note') {
    iconEl = <MessageSquare size={12} className="text-info" />
    iconBg = 'bg-info-tint'
    title = event.author
    detail = `added a note · ${event.time}`
    body = (
      <div className="mt-2 bg-canvas border border-line rounded-xl px-4 py-3">
        <p className="font-sans text-sm text-secondary leading-relaxed">{event.text}</p>
      </div>
    )
  } else if (event.type === 'document') {
    iconEl = <FileText size={12} className="text-warning" />
    iconBg = 'bg-warning-light'
    title = event.name
    detail = event.uploadedAt ? `uploaded · ${event.uploadedAt}` : 'Document uploaded'
  }

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`w-7 h-7 rounded-full ${iconBg} flex items-center justify-center flex-shrink-0`}>
          {iconEl}
        </div>
        {!isLast && <div className="w-px flex-1 bg-line mt-1 min-h-[28px]" />}
      </div>
      <div className={`flex-1 min-w-0 ${isLast ? 'pb-2' : 'pb-5'}`}>
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="font-sans text-[13px] font-medium text-ink">{title}</span>
          {detail && <span className="font-sans text-xs text-muted">{detail}</span>}
        </div>
        {body}
      </div>
    </div>
  )
}
