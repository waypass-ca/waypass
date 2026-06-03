import { useState, useEffect } from 'react'
import { CheckCircle2, Calendar } from 'lucide-react'
import { fetchBookingByToken, respondToBooking } from '../lib/api.js'
import { WeekTimeGrid } from '../components/booking/WeekTimeGrid.jsx'
import { getMondayOf, objToKey, slotToObj, slotToLabel } from '../lib/slotUtils.js'
import { Button } from '../components/ui/Button.jsx'

function formatSlotDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

export function CrematoriumResponsePage({ token }) {
  const [state, setState] = useState('loading') // loading | active | already_responded | invalid | success
  const [booking, setBooking] = useState(null)
  const [weekStart, setWeekStart] = useState(() => getMondayOf(new Date()))
  const [selectedSlots, setSelectedSlots] = useState(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchBookingByToken(token)
      .then(b => {
        setBooking(b)
        if (b.status === 'cancelled') {
          setState('invalid')
        } else if (b.status === 'responded' || b.status === 'confirmed') {
          setState('already_responded')
        } else {
          // Jump to the first week that has proposed slots
          if (b.proposedSlots?.length > 0) {
            const firstDate = b.proposedSlots.slice().sort((a, b) => a.date.localeCompare(b.date))[0].date
            setWeekStart(getMondayOf(new Date(firstDate + 'T12:00:00')))
          }
          setState('active')
        }
      })
      .catch(() => setState('invalid'))
  }, [token])

  const highlightSlots = new Set(
    (booking?.proposedSlots ?? []).map(s => objToKey(s))
  )

  function handleSlotToggle(newSet) {
    // Only allow selecting highlighted slots
    const filtered = new Set([...newSet].filter(k => highlightSlots.has(k)))
    setSelectedSlots(filtered)
  }

  async function handleSubmit() {
    if (selectedSlots.size === 0) return
    setSubmitting(true)
    setError(null)
    try {
      await respondToBooking(token, Array.from(selectedSlots))
      setState('success')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <p className="font-sans text-[13px] text-muted">Loading…</p>
      </div>
    )
  }

  if (state === 'invalid') {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="text-center max-w-sm px-6">
          <p className="font-display text-2xl text-ink mb-2">Link Unavailable</p>
          <p className="font-sans text-[13px] text-muted">This booking link is no longer active or has been cancelled.</p>
        </div>
      </div>
    )
  }

  const funeralHomeName = 'The funeral home'

  return (
    <div className="min-h-screen bg-canvas">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-7 h-7 rounded bg-ink flex items-center justify-center">
              <span className="font-sans text-[9px] font-bold text-surface leading-none">P</span>
            </div>
            <span className="font-sans text-[13px] font-semibold text-ink">Passage</span>
          </div>

          {state === 'success' ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 size={26} className="text-emerald-600" />
              </div>
              <p className="font-display text-2xl text-ink mb-2">Thank You</p>
              <p className="font-sans text-[13px] text-muted max-w-xs mx-auto">
                {funeralHomeName} will review your availability and confirm a final pickup time.
              </p>
            </div>
          ) : state === 'already_responded' ? (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Calendar size={16} className="text-primary" strokeWidth={1.8} />
                <p className="font-display text-xl text-ink">
                  Pickup Request — {booking?.caseId}
                </p>
              </div>
              <p className="font-sans text-[13px] text-muted mt-1">
                You've already responded to this request.
              </p>
              {booking?.crematoriumSlots?.length > 0 && (
                <div className="mt-5 p-4 rounded-xl border border-line bg-surface">
                  <p className="font-sans text-[11px] text-muted uppercase tracking-wide mb-3">Your submitted availability</p>
                  <div className="flex flex-col gap-1.5">
                    {booking.crematoriumSlots.map(s => {
                      const key = objToKey(s)
                      return (
                        <p key={key} className="font-sans text-[12px] text-ink">{slotToLabel(key)}</p>
                      )
                    })}
                  </div>
                </div>
              )}
              {booking?.status === 'confirmed' && booking?.confirmedSlot && (
                <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <p className="font-sans text-[11px] text-emerald-600 uppercase tracking-wide mb-1">Confirmed pickup</p>
                  <p className="font-sans text-[13px] font-semibold text-emerald-700">
                    {slotToLabel(objToKey(booking.confirmedSlot))}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1">
                <Calendar size={16} className="text-primary" strokeWidth={1.8} />
                <p className="font-display text-xl text-ink">
                  Pickup Request — Case {booking?.caseId}
                </p>
              </div>
              <p className="font-sans text-[13px] text-muted">
                Please select the times that work for your crematorium. The highlighted slots are when the funeral home is available.
              </p>
            </>
          )}
        </div>

        {state === 'active' && (
          <>
            <WeekTimeGrid
              weekStart={weekStart}
              onWeekChange={setWeekStart}
              selectedSlots={selectedSlots}
              onSlotsChange={handleSlotToggle}
              highlightSlots={highlightSlots}
              readOnly={true}
            />

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-danger/5 border border-danger/20">
                <p className="font-sans text-[12px] text-danger">{error}</p>
              </div>
            )}

            <div className="mt-6 flex items-center justify-between">
              <span className="font-sans text-[12px] text-muted">
                {selectedSlots.size} time{selectedSlots.size !== 1 ? 's' : ''} selected
              </span>
              <Button onClick={handleSubmit} disabled={submitting || selectedSlots.size === 0}>
                {submitting ? 'Submitting…' : 'Confirm Availability →'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
