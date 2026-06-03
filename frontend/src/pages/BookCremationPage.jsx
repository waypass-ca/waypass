import { useState, useEffect, useRef } from 'react'
import { Search, X, CheckCircle2, Send, CalendarCheck, ChevronDown } from 'lucide-react'
import { fetchCrematoriums, fetchBookings, createBooking, confirmBooking, cancelBooking } from '../lib/api.js'
import { WeekTimeGrid } from '../components/booking/WeekTimeGrid.jsx'
import { getMondayOf, slotToObj, objToKey, slotToLabel } from '../lib/slotUtils.js'
import { Button } from '../components/ui/Button.jsx'

const STATUS_STYLES = {
  pending:   'bg-amber-50 text-amber-700 border-amber-200',
  responded: 'bg-blue-50 text-blue-700 border-blue-200',
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-line text-muted border-line',
}

function StatusBadge({ status }) {
  const cls = STATUS_STYLES[status] ?? STATUS_STYLES.cancelled
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cls}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

function ActiveBookingRow({ booking, onConfirm, onCancel }) {
  const overlap = (booking.proposedSlots ?? []).filter(s =>
    (booking.crematoriumSlots ?? []).some(c => `${c.date}T${c.start}` === `${s.date}T${s.start}`)
  )
  const [expanded, setExpanded] = useState(booking.status === 'responded')

  return (
    <div className="border border-line rounded-xl bg-surface overflow-hidden">
      <button
        onClick={() => setExpanded(p => !p)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-ink/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-sans text-[13px] font-medium text-ink">{booking.crematoriumName}</span>
              <StatusBadge status={booking.status} />
            </div>
            <span className="font-sans text-[11px] text-muted">Case {booking.caseId}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {booking.status === 'confirmed' && booking.confirmedSlot && (
            <span className="font-sans text-[11px] text-emerald-600 font-medium hidden sm:block">
              {slotToLabel(objToKey(booking.confirmedSlot))}
            </span>
          )}
          <ChevronDown
            size={14}
            strokeWidth={2}
            className={`text-muted transition-transform duration-150 ${expanded ? '' : '-rotate-90'}`}
          />
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-line">
          {booking.status === 'confirmed' && booking.confirmedSlot && (
            <div className="flex items-center gap-2 mt-3 p-3 bg-emerald-50 rounded-lg">
              <CalendarCheck size={14} className="text-emerald-600 flex-shrink-0" />
              <span className="font-sans text-[12px] text-emerald-700 font-medium">
                {slotToLabel(objToKey(booking.confirmedSlot))}
              </span>
            </div>
          )}

          {booking.status === 'responded' && (
            <div className="mt-3">
              {overlap.length > 0 ? (
                <>
                  <p className="font-sans text-[11px] text-ink font-semibold mb-2">Select a time to confirm:</p>
                  <div className="flex flex-col gap-1.5">
                    {overlap.map(s => {
                      const key = `${s.date}T${s.start}`
                      return (
                        <button
                          key={key}
                          onClick={() => onConfirm(booking.id, s)}
                          className="text-left px-3 py-2 rounded-lg border border-line hover:border-primary hover:bg-primary/5 transition-colors font-sans text-[12px] text-ink"
                        >
                          {slotToLabel(key)}
                        </button>
                      )
                    })}
                  </div>
                </>
              ) : (
                <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="font-sans text-[12px] text-amber-700 font-medium">No overlapping times</p>
                  <p className="font-sans text-[11px] text-amber-600 mt-0.5">Cancel and rebook with different times.</p>
                </div>
              )}
            </div>
          )}

          {booking.status === 'pending' && (
            <p className="font-sans text-[11px] text-muted mt-3">Waiting for crematorium to respond…</p>
          )}

          {booking.status !== 'confirmed' && booking.status !== 'cancelled' && (
            <button
              onClick={() => onCancel(booking.id)}
              className="mt-3 font-sans text-[11px] text-danger hover:text-danger/70 transition-colors"
            >
              Cancel booking
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export function BookCremationPage({ cases }) {
  const [crematoriums, setCrematoriums] = useState([])
  const [existingBookings, setExistingBookings] = useState([])

  // Case search state
  const [query, setQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedCase, setSelectedCase] = useState(null)
  const [matchedCrem, setMatchedCrem] = useState(null)
  const searchRef = useRef(null)

  // Scheduling
  const [weekStart, setWeekStart] = useState(() => getMondayOf(new Date()))
  const [selectedSlots, setSelectedSlots] = useState(new Set())

  // Submit state
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchCrematoriums().then(setCrematoriums).catch(() => {})
    fetchBookings().then(setExistingBookings).catch(() => {})
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function onDown(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowDropdown(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const busySlots = new Set(
    existingBookings
      .filter(b => b.status === 'confirmed')
      .flatMap(b => b.confirmedSlot ? [objToKey(b.confirmedSlot)] : [])
  )

  const filtered = query.trim().length > 0
    ? cases.filter(c =>
        c.deceased?.toLowerCase().includes(query.toLowerCase()) ||
        c.id?.toLowerCase().includes(query.toLowerCase())
      )
    : []

  function selectCase(c) {
    setSelectedCase(c)
    setQuery(c.deceased ?? c.id)
    setShowDropdown(false)
    setError(null)
    setSelectedSlots(new Set())

    // Look up crematorium by ID from the crematoriums table
    const crem = crematoriums.find(cr => cr.id === c.crematoriumId) ?? null
    setMatchedCrem(crem)
  }

  function clearCase() {
    setSelectedCase(null)
    setMatchedCrem(null)
    setQuery('')
    setSelectedSlots(new Set())
    setError(null)
    setSent(null)
  }

  async function handleSend() {
    if (!selectedCase || !matchedCrem || selectedSlots.size === 0) return
    setSending(true)
    setError(null)
    try {
      const proposedSlots = Array.from(selectedSlots).sort().map(key => slotToObj(key))
      const booking = await createBooking({
        caseId: selectedCase.id,
        crematoriumId: matchedCrem.id,
        crematoriumEmail: matchedCrem.contactEmail,
        crematoriumName: matchedCrem.name,
        proposedSlots,
        deceasedName: selectedCase.deceased,
      })
      setSent(booking)
      setExistingBookings(prev => [booking, ...prev])
      clearCase()
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  async function handleConfirm(bookingId, slot) {
    try {
      const updated = await confirmBooking(bookingId, slot)
      setExistingBookings(prev => prev.map(b => b.id === bookingId ? updated : b))
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleCancel(bookingId) {
    try {
      await cancelBooking(bookingId)
      setExistingBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b))
    } catch (err) {
      setError(err.message)
    }
  }

  const canSend = selectedCase && matchedCrem && selectedSlots.size > 0

  const activeBookings = existingBookings.filter(b => b.status !== 'cancelled')

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-7">
        <h1 className="font-display text-2xl text-ink mb-1">Book Cremation</h1>
        <p className="font-sans text-[13px] text-muted">Schedule a pickup with a partner crematorium.</p>
      </div>

      {/* Sent confirmation banner */}
      {sent && (
        <div className="flex items-start gap-3 mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
          <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-sans text-[13px] font-medium text-emerald-800">Invite sent to {sent.crematoriumName}</p>
            <p className="font-sans text-[11px] text-emerald-600 mt-0.5">You'll be notified when they respond.</p>
          </div>
          <button onClick={() => setSent(null)} className="ml-auto text-emerald-400 hover:text-emerald-700 transition-colors">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Form ── */}
      <div className="flex flex-col gap-5">

        {/* Case search */}
        <div>
          <label className="font-sans text-[12px] font-semibold text-ink block mb-1.5">Case</label>
          <div className="relative" ref={searchRef}>
            <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border bg-surface transition-colors ${
              showDropdown ? 'border-primary/50 ring-1 ring-primary/20' : 'border-line'
            }`}>
              <Search size={14} className="text-muted flex-shrink-0" strokeWidth={1.8} />
              <input
                type="text"
                placeholder="Search by deceased name or case ID…"
                value={query}
                onChange={e => {
                  setQuery(e.target.value)
                  setShowDropdown(true)
                  if (selectedCase) { setSelectedCase(null); setMatchedCrem(null) }
                }}
                onFocus={() => { if (query.trim()) setShowDropdown(true) }}
                className="flex-1 font-sans text-[13px] text-ink placeholder:text-muted bg-transparent outline-none"
              />
              {selectedCase && (
                <button onClick={clearCase} className="text-muted hover:text-ink transition-colors flex-shrink-0">
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Dropdown */}
            {showDropdown && filtered.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-surface border border-line rounded-xl shadow-lg z-50 overflow-hidden max-h-56 overflow-y-auto">
                {filtered.map(c => (
                  <button
                    key={c.id}
                    onMouseDown={() => selectCase(c)}
                    className="w-full text-left flex items-center justify-between px-4 py-2.5 hover:bg-ink/[0.04] transition-colors border-b border-line last:border-0"
                  >
                    <div>
                      <p className="font-sans text-[13px] font-medium text-ink">{c.deceased ?? 'Unnamed'}</p>
                      <p className="font-sans text-[11px] text-muted">Case {c.id}</p>
                    </div>
                    <StatusBadge status={c.status} />
                  </button>
                ))}
              </div>
            )}

            {showDropdown && query.trim().length > 0 && filtered.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-surface border border-line rounded-xl shadow-lg z-50 px-4 py-3">
                <p className="font-sans text-[12px] text-muted">No cases match "{query}"</p>
              </div>
            )}
          </div>
        </div>

        {/* Auto-filled case details — always visible */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-line bg-surface px-4 py-3">
            <p className="font-sans text-[10px] text-muted uppercase tracking-wide mb-1">Deceased</p>
            {selectedCase
              ? <p className="font-sans text-[13px] font-medium text-ink">{selectedCase.deceased ?? '—'}</p>
              : <p className="font-sans text-[13px] text-muted">—</p>
            }
          </div>
          <div className="rounded-xl border border-line bg-surface px-4 py-3">
            <p className="font-sans text-[10px] text-muted uppercase tracking-wide mb-1">Case ID</p>
            {selectedCase
              ? <p className="font-sans text-[13px] font-medium text-ink">{selectedCase.id}</p>
              : <p className="font-sans text-[13px] text-muted">—</p>
            }
          </div>

          {/* Crematorium — always visible */}
          <div className={`col-span-2 rounded-xl border px-4 py-3 transition-colors ${
            !selectedCase ? 'border-line bg-surface'
            : matchedCrem ? 'border-line bg-surface'
            : 'border-amber-200 bg-amber-50'
          }`}>
            <p className="font-sans text-[10px] text-muted uppercase tracking-wide mb-1">Crematorium</p>
            {!selectedCase && <p className="font-sans text-[13px] text-muted">—</p>}
            {selectedCase && matchedCrem && (
              <div>
                <p className="font-sans text-[13px] font-medium text-ink">{matchedCrem.name}</p>
                {matchedCrem.contactEmail
                  ? <p className="font-sans text-[11px] text-muted">{matchedCrem.contactEmail}</p>
                  : <p className="font-sans text-[11px] text-amber-600 mt-0.5">No email on file — invite won't be sent. Add one via Partners.</p>
                }
              </div>
            )}
            {selectedCase && !matchedCrem && selectedCase.crematorium && (
              <div>
                <p className="font-sans text-[13px] font-medium text-amber-800">{selectedCase.crematorium}</p>
                <p className="font-sans text-[11px] text-amber-600 mt-0.5">
                  Not in your connected partners — add via Partners first.
                </p>
              </div>
            )}
            {selectedCase && !matchedCrem && !selectedCase.crematorium && (
              <p className="font-sans text-[12px] text-amber-700">No crematorium assigned to this case.</p>
            )}
          </div>
        </div>

        {/* Time picker — always visible */}
        <div>
          <label className="font-sans text-[12px] font-semibold text-ink block mb-1">Your Available Times</label>
          <p className="font-sans text-[11px] text-muted mb-3">Drag to mark when you're free for pickup. The crematorium will select from these.</p>
          <WeekTimeGrid
            weekStart={weekStart}
            onWeekChange={setWeekStart}
            selectedSlots={selectedSlots}
            onSlotsChange={selectedCase && matchedCrem ? setSelectedSlots : undefined}
            busySlots={busySlots}
            disabled={!selectedCase || !matchedCrem}
          />
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-danger/5 border border-danger/20">
            <p className="font-sans text-[12px] text-danger">{error}</p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="font-sans text-[12px] text-muted">
            {selectedSlots.size > 0 ? `${selectedSlots.size} slot${selectedSlots.size !== 1 ? 's' : ''} selected` : 'No times selected'}
          </span>
          <Button onClick={handleSend} disabled={!canSend || sending} className="flex items-center gap-2">
            <Send size={13} strokeWidth={2} />
            {sending ? 'Sending…' : 'Send Invite'}
          </Button>
        </div>
      </div>

      {/* ── Active bookings ── */}
      {activeBookings.length > 0 && (
        <div className="mt-10">
          <p className="font-sans text-[11px] font-semibold text-muted uppercase tracking-wider mb-3">Active Bookings</p>
          <div className="flex flex-col gap-2">
            {activeBookings.map(b => (
              <ActiveBookingRow key={b.id} booking={b} onConfirm={handleConfirm} onCancel={handleCancel} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
