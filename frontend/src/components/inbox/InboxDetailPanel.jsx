import { useState, useEffect } from 'react'
import { Star, Check, X, Clock, AlertCircle, Info, Mail, CheckCircle2 } from 'lucide-react'
import { TriangleAlert } from 'lucide-react'
import { fetchBooking, confirmBooking } from '../../lib/api.js'

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

function formatSlotDate(date) {
  return new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatSlotTime(start, end) {
  const fmt = h => `${h > 12 ? h - 12 : h === 0 ? 12 : h}:00 ${h < 12 ? 'AM' : 'PM'}`
  const s = parseInt(start.split(':')[0], 10)
  const e = parseInt(end.split(':')[0], 10)
  return `${fmt(s)} – ${fmt(e)}`
}

function SlotPicker({ bookingId, onConfirmed }) {
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchBooking(bookingId)
      .then(setBooking)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [bookingId])

  async function handleConfirm(slot) {
    setConfirming(true)
    setError(null)
    try {
      await confirmBooking(bookingId, slot)
      setConfirmed(true)
      onConfirmed?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setConfirming(false)
    }
  }

  if (loading) return (
    <div className="px-5 py-4 border-t border-line">
      <p className="font-sans text-[12px] text-muted">Loading availability…</p>
    </div>
  )

  if (confirmed || booking?.status === 'confirmed') return (
    <div className="px-5 py-4 border-t border-line flex items-center gap-2">
      <CheckCircle2 size={15} className="text-info shrink-0" />
      <span className="font-sans text-[13px] text-ink">
        Slot confirmed
        {booking?.confirmedSlot && ` · ${formatSlotDate(booking.confirmedSlot.date)}, ${formatSlotTime(booking.confirmedSlot.start, booking.confirmedSlot.end)}`}
      </span>
    </div>
  )

  if (booking?.status !== 'responded') return null

  const proposedKeys = new Set((booking.proposedSlots ?? []).map(s => `${s.date}T${s.start}`))
  const slots = (booking.crematoriumSlots ?? []).filter(s => proposedKeys.has(`${s.date}T${s.start}`))

  if (slots.length === 0) return (
    <div className="px-5 py-4 border-t border-line">
      <p className="font-sans text-[12px] text-muted">No overlapping slots available.</p>
    </div>
  )

  return (
    <div className="px-5 py-4 border-t border-line shrink-0">
      <p className="font-sans text-[11px] font-medium text-muted uppercase tracking-wide mb-3">Select a time to confirm</p>
      <div className="flex flex-col gap-2">
        {slots.map(slot => {
          const key = `${slot.date}T${slot.start}`
          return (
            <button
              key={key}
              onClick={() => handleConfirm(slot)}
              disabled={confirming}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-line bg-white hover:border-ink hover:bg-canvas text-left transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div>
                <p className="font-sans text-[13px] font-medium text-ink">{formatSlotDate(slot.date)}</p>
                <p className="font-sans text-[12px] text-muted">{formatSlotTime(slot.start, slot.end)}</p>
              </div>
              <Check size={14} className="text-muted group-hover:text-ink transition-colors" />
            </button>
          )
        })}
      </div>
      {error && <p className="font-sans text-[12px] text-danger mt-2">{error}</p>}
    </div>
  )
}

export function InboxDetailPanel({ item, onClose, onStar, onMarkRead, onViewCase }) {
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

  return (
    <div className="w-[420px] border-l border-line bg-white flex flex-col overflow-hidden shrink-0">
      {item.scheduledFor && (
        <div className="px-5 py-2.5 flex items-center gap-2 bg-info-tint border-b border-info/20">
          <Clock size={13} className="text-info" />
          <span className="font-sans text-[12px] font-medium text-info">Scheduled: {item.scheduledFor}</span>
        </div>
      )}

      <div className="px-5 pt-5 pb-4 border-b border-line">
        <div className="flex gap-2 mb-2 justify-between">
          <h2 className="font-display text-[22px] leading-snug text-ink mb-3">{item.subject}</h2>
          <div className="flex items-start">
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

      {item.type === 'message' && item.caseId ? (
        <div className="px-5 py-3 border-t border-line shrink-0">
          <button
            onClick={() => onViewCase?.(item.caseId)}
            className="h-8 px-4 rounded-lg bg-ink hover:bg-ink/90 text-surface font-sans text-[12.5px] font-medium cursor-pointer transition-colors"
          >
            Open case
          </button>
        </div>
      ) : item.type === 'message' ? (
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
      ) : null}

      {item.type === 'schedule' && item.bookingId && (
        <SlotPicker bookingId={item.bookingId} />
      )}

      {item.type === 'alert' && item.caseId && (
        <div className="px-5 py-3 border-t border-line shrink-0">
          <button
            onClick={() => onViewCase?.(item.caseId)}
            className="h-8 px-4 rounded-lg bg-ink hover:bg-ink/90 text-surface font-sans text-[12.5px] font-medium cursor-pointer transition-colors"
          >
            Open case
          </button>
        </div>
      )}
    </div>
  )
}
