import {
  CheckCircle2, MessageSquare, FileText, CalendarPlus, Mail, Inbox,
  CalendarCheck2, CalendarClock, CalendarX2, Truck,
} from 'lucide-react'

const TYPE_CONFIG = {
  custody:                { icon: CheckCircle2,   bg: 'bg-primary/15',    fg: 'text-primary' },
  note:                   { icon: MessageSquare,  bg: 'bg-info-tint',     fg: 'text-info' },
  document:               { icon: FileText,       bg: 'bg-warning-light', fg: 'text-warning' },
  booking_created:        { icon: CalendarPlus,   bg: 'bg-blue-50',       fg: 'text-blue-600' },
  crematorium_invited:    { icon: Mail,           bg: 'bg-blue-50',       fg: 'text-blue-600' },
  crematorium_responded:  { icon: Inbox,          bg: 'bg-blue-50',       fg: 'text-blue-600' },
  shipping_invited:       { icon: Truck,          bg: 'bg-amber-50',      fg: 'text-amber-600' },
  shipping_responded:     { icon: Truck,          bg: 'bg-amber-50',      fg: 'text-amber-600' },
  booking_confirmed:      { icon: CalendarCheck2, bg: 'bg-emerald-50',    fg: 'text-emerald-600' },
  booking_rescheduled:    { icon: CalendarClock,  bg: 'bg-amber-50',      fg: 'text-amber-600' },
  booking_cancelled:      { icon: CalendarX2,     bg: 'bg-red-50',        fg: 'text-red-600' },
}

const DOC_TYPE_LABELS = {
  death_certificate: 'Death certificate',
  permit: 'Permit',
  authorization: 'Authorization',
  invoice: 'Invoice',
  other: 'Other',
}

function fmtSlotShort(s) {
  if (!s?.date) return null
  const dateStr = new Date(s.date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
  return s.start ? `${dateStr} ${s.start}–${s.end}` : dateStr
}

function formatEventMeta(event) {
  const p = event.payload ?? {}
  const chips = []
  switch (event.type) {
    case 'document': {
      const label = DOC_TYPE_LABELS[p.documentType] ?? p.documentType
      if (label) chips.push(label)
      if (p.fileName?.includes('.')) chips.push(p.fileName.split('.').pop().toUpperCase())
      break
    }
    case 'custody':
      if (p.stageLabel) chips.push(p.stageLabel)
      if (p.staff) chips.push(p.staff)
      break
    case 'booking_created':
      if (p.crematorium_name) chips.push(p.crematorium_name)
      break
    case 'crematorium_invited':
    case 'crematorium_responded':
      if (p.crematorium_name) chips.push(p.crematorium_name)
      break
    case 'shipping_invited':
    case 'shipping_responded':
      if (p.shipping_partner_name) chips.push(p.shipping_partner_name)
      break
    case 'booking_confirmed': {
      if (p.crematorium_name) chips.push(p.crematorium_name)
      const slot = fmtSlotShort(p.confirmed_slot)
      if (slot) chips.push(slot)
      break
    }
    case 'booking_rescheduled':
      if (p.crematorium_name) chips.push(p.crematorium_name)
      break
    case 'booking_cancelled':
      if (p.crematorium_name) chips.push(p.crematorium_name)
      if (p.cancel_reason) chips.push(p.cancel_reason)
      break
    default: break
  }
  return chips
}

function relativeTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  if (isNaN(d.getTime())) return String(ts)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    const diffS = Math.floor((now - d) / 1000)
    if (diffS < 60) return 'just now'
    const diffM = Math.floor(diffS / 60)
    if (diffM < 60) return `${diffM} min ago`
    return `${Math.floor(diffM / 60)} h ago`
  }
  return d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export function ActivityEvent({ event, onClick }) {
  const cfg = TYPE_CONFIG[event.type] ?? TYPE_CONFIG.note
  const Icon = cfg.icon
  const meta = formatEventMeta(event)
  const time = relativeTime(event.ts)
  const showNotePreview = event.type === 'note' && event.payload?.text

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left flex items-start gap-3 py-4 px-2 -mx-2 rounded-md cursor-pointer border-0 bg-transparent hover:bg-canvas outline-none transition-colors"
    >
      <div className={`w-7 h-7 rounded-md ${cfg.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
        <Icon size={13} className={cfg.fg} />
      </div>
      <div className="flex-1 min-w-0 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-baseline gap-1 flex-wrap">
            <span className="font-sans text-[13px] font-medium text-ink leading-snug">{event.summary || event.type}</span>
            {meta.map((chip, i) => (
              <span key={i} className="font-sans text-[12px] text-muted leading-snug">· {chip}</span>
            ))}
          </div>
          {showNotePreview && (
            <p className="font-sans text-[12px] text-secondary leading-relaxed mt-0.5 line-clamp-2">{event.payload.text}</p>
          )}
          {event.actor && (
            <span className="font-sans text-[11.5px] text-muted mt-0.5 block">{event.actor}</span>
          )}
        </div>
        {time && (
          <span className="font-sans text-[11.5px] text-muted whitespace-nowrap flex-shrink-0 mt-0.5">{time}</span>
        )}
      </div>
    </button>
  )
}
