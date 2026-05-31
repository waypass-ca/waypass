import { Star, Check, X, Clock, ChevronRight, AlertCircle, Info, Mail } from 'lucide-react'
import { TriangleAlert } from 'lucide-react'

const SEVERITY_CONFIG = {
  danger:  { icon: AlertCircle,    text: 'text-danger',  bg: 'bg-danger-tint',    border: 'border-danger/25',  dot: 'bg-danger'  },
  warning: { icon: TriangleAlert,  text: 'text-warning', bg: 'bg-warning-light',  border: 'border-warning/25', dot: 'bg-warning' },
  info:    { icon: Info,           text: 'text-info',    bg: 'bg-info-tint',      border: 'border-info/25',    dot: 'bg-info'    },
}

const TYPE_CONFIG = {
  alert:    { label: 'Alert',    color: 'text-warning', dot: 'bg-warning' },
  message:  { label: 'Message',  color: 'text-primary',  dot: 'bg-primary' },
  schedule: { label: 'Schedule', color: 'text-info',    dot: 'bg-info'    },
}

const StarIcon = ({ filled, size = 14, className = '' }) =>
  filled
    ? <Star size={size} className={`[&_*]:fill-current [&_*]:stroke-current text-warning ${className}`} />
    : <Star size={size} className={`text-muted hover:text-warning ${className}`} />

function TypeBadge({ type }) {
  const cfg = TYPE_CONFIG[type]
  return (
    <span className={`inline-flex items-center gap-1.5 font-sans text-[10.5px] font-medium ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

export function InboxDetailPanel({ item, onClose, onStar, onMarkRead }) {
  if (!item) return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8 bg-white border-l border-line">
      <div className="w-12 h-12 rounded-xl bg-canvas border border-line flex items-center justify-center">
        <Mail size={22} className="text-muted" />
      </div>
      <p className="font-display text-[20px] text-secondary">Select a message</p>
      <p className="font-sans text-[12px] text-muted max-w-xs">
        Click any item in the list to read it here.
      </p>
    </div>
  )

  const cfg = item.severity ? SEVERITY_CONFIG[item.severity] : null

  return (
    <div className="w-[420px] border-l border-line bg-white flex flex-col overflow-hidden shrink-0">
      <div className="px-5 py-3 border-b border-line flex items-center justify-between shrink-0 bg-surface sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <TypeBadge type={item.type} />
          {item.caseId && (
            <span className="font-mono text-[10.5px] text-muted bg-canvas border border-line rounded px-1.5 py-px">
              {item.caseId}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onStar(item.id)}
            className="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer border-0 bg-transparent hover:bg-canvas transition-colors"
          >
            <StarIcon filled={item.starred} size={14} />
          </button>
          {!item.read && (
            <button
              onClick={() => onMarkRead(item.id)}
              className="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer border-0 bg-transparent hover:bg-canvas text-muted hover:text-ink transition-colors"
              title="Mark as read"
            >
              <Check size={14} />
            </button>
          )}
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer border-0 bg-transparent hover:bg-canvas text-muted hover:text-ink transition-colors"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {cfg && (
        <div className={`px-5 py-2.5 flex items-center gap-2 ${cfg.bg} border-b ${cfg.border}`}>
          <cfg.icon size={13} className={cfg.text} />
          <span className={`font-sans text-[12px] font-medium ${cfg.text}`}>
            {item.severity === 'danger' ? 'Action required immediately' :
             item.severity === 'warning' ? 'Attention needed' : 'For your information'}
          </span>
        </div>
      )}

      {item.scheduledFor && (
        <div className="px-5 py-2.5 flex items-center gap-2 bg-info-tint border-b border-info/20">
          <Clock size={13} className="text-info" />
          <span className="font-sans text-[12px] font-medium text-info">Scheduled: {item.scheduledFor}</span>
        </div>
      )}

      <div className="px-5 pt-5 pb-4 border-b border-line">
        <h2 className="font-display text-[22px] leading-snug text-ink mb-3">{item.subject}</h2>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-canvas border border-line flex items-center justify-center flex-shrink-0">
            <span className="font-sans text-[10px] font-semibold text-secondary">
              {item.from.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
            </span>
          </div>
          <div>
            <span className="font-sans text-[13px] font-medium text-ink">{item.from}</span>
            <span className="font-sans text-[11.5px] text-muted ml-2">{item.time}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-5 py-5">
        <p className="font-sans text-[13px] text-secondary leading-relaxed whitespace-pre-line">
          {item.body}
        </p>
      </div>

      {item.type === 'message' && (
        <div className="px-5 py-3 border-t border-line shrink-0">
          <textarea
            placeholder="Reply…"
            className="w-full border border-line rounded-lg px-3 py-2.5 text-[13px] font-sans text-ink placeholder:text-muted outline-none focus:border-ink/60 transition resize-none"
            rows={2}
          />
          <div className="flex justify-end mt-2">
            <button className="h-8 px-4 rounded-lg bg-ink hover:bg-ink/90 text-surface font-sans text-[12.5px] font-medium cursor-pointer transition-colors">
              Send
            </button>
          </div>
        </div>
      )}

      {item.type === 'schedule' && (
        <div className="px-5 py-3 border-t border-line flex gap-2 shrink-0">
          <button className="flex-1 h-9 rounded-lg bg-ink hover:bg-ink/90 text-surface font-sans text-[12.5px] font-medium cursor-pointer transition-colors">
            Confirm
          </button>
          <button className="h-9 px-4 rounded-lg border border-line hover:bg-canvas text-secondary font-sans text-[12.5px] cursor-pointer transition-colors">
            Decline
          </button>
        </div>
      )}

      {item.type === 'alert' && item.caseId && (
        <div className="px-5 py-3 border-t border-line shrink-0">
          <button className="w-full h-9 rounded-lg bg-ink hover:bg-ink/90 text-surface font-sans text-[12.5px] font-medium cursor-pointer transition-colors flex items-center justify-center gap-2">
            <ChevronRight size={14} />
            Open case {item.caseId}
          </button>
        </div>
      )}
    </div>
  )
}
