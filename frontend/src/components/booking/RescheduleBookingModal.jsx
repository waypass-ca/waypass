import { useState, useMemo } from 'react'
import { X, Send, Info } from 'lucide-react'
import { WeekTimeGrid } from './WeekTimeGrid.jsx'
import { Button } from '../ui/Button.jsx'
import { rescheduleBooking } from '../../lib/api.js'
import { getSundayOf, objToKey, slotToObj } from '../../lib/slotUtils.js'

export function RescheduleBookingModal({ booking, existingBookings = [], onClose, onRescheduled }) {
  const initialKeys = useMemo(
    () => new Set((booking.proposedSlots ?? []).map(objToKey)),
    [booking],
  )
  const [selectedSlots, setSelectedSlots] = useState(initialKeys)
  const [weekStart, setWeekStart] = useState(() => {
    const first = booking.proposedSlots?.[0]
    const base = first ? new Date(first.date + 'T12:00:00') : new Date()
    return getSundayOf(base)
  })
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)

  const busySlots = useMemo(() => {
    const m = new Map()
    for (const b of existingBookings) {
      if (b.id === booking.id) continue
      if (b.status === 'confirmed' && b.confirmedSlot) {
        m.set(objToKey(b.confirmedSlot), b.crematoriumName ?? '')
      }
    }
    return m
  }, [existingBookings, booking.id])

  async function handleSubmit() {
    if (selectedSlots.size === 0) return
    setSending(true)
    setError(null)
    try {
      const proposedSlots = Array.from(selectedSlots).sort().map(slotToObj)
      const updated = await rescheduleBooking(booking.id, proposedSlots)
      onRescheduled?.(updated)
      onClose?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  const shippingNote = booking.shippingPartnerId
    ? `${booking.shippingPartnerName ?? 'Shipping partner'} will be re-invited after the crematorium responds.`
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative bg-surface rounded-2xl shadow-2xl w-[760px] max-w-[95vw] max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-line">
          <div>
            <p className="font-sans text-[11px] uppercase tracking-wide text-muted">Reschedule booking</p>
            <h2 className="font-display text-xl font-light text-ink mt-0.5">
              Resend pickup request to {booking.crematoriumName}
            </h2>
            {booking.deceasedName && (
              <p className="font-sans text-[12px] text-muted mt-1">
                {booking.deceasedName} · Case {booking.caseId}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink transition-colors p-1 -mt-1">
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {booking.status === 'cancelled' && (
            <div className="flex items-start gap-2 mb-4 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
              <Info size={13} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="font-sans text-[12px] text-amber-800">
                This will reopen the booking and send a fresh request.{booking.shippingPartnerId
                  ? ` ${booking.shippingPartnerName ?? 'The shipping partner'} will be re-invited after the crematorium responds.`
                  : ''}
              </p>
            </div>
          )}
          {shippingNote && booking.status !== 'cancelled' && (
            <div className="flex items-start gap-2 mb-4 px-3 py-2 rounded-lg bg-canvas border border-line">
              <Info size={13} className="text-muted flex-shrink-0 mt-0.5" />
              <p className="font-sans text-[12px] text-muted">{shippingNote}</p>
            </div>
          )}

          <WeekTimeGrid
            weekStart={weekStart}
            onWeekChange={setWeekStart}
            selectedSlots={selectedSlots}
            onSlotsChange={setSelectedSlots}
            busySlots={busySlots}
          />

          {error && (
            <p className="font-sans text-[12px] text-danger mt-3">{error}</p>
          )}
        </div>

        <div className="flex-shrink-0 border-t border-line px-6 py-4 flex items-center justify-between gap-4">
          <p className="font-sans text-[12px] text-muted">
            {selectedSlots.size} slot{selectedSlots.size !== 1 ? 's' : ''} selected
          </p>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onClose} disabled={sending}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={sending || selectedSlots.size === 0} className="flex items-center gap-2">
              <Send size={13} strokeWidth={2} />
              {sending ? 'Sending…' : 'Resend invite'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
