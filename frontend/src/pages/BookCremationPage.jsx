import { useState, useEffect, useRef } from 'react'
import { Search, X, CheckCircle2, Send, CalendarCheck, ChevronRight } from 'lucide-react'
import { fetchCrematoriums, fetchBookings, createBooking, confirmBooking, cancelBooking } from '../lib/api.js'
import { WeekTimeGrid } from '../components/booking/WeekTimeGrid.jsx'
import { getSundayOf, slotToObj, objToKey, slotToLabel } from '../lib/slotUtils.js'
import { Button } from '../components/ui/Button.jsx'

const STATUS_DOT = {
  pending:   'bg-amber-400',
  responded: 'bg-blue-400',
  confirmed: 'bg-emerald-500',
  cancelled: 'bg-line',
}
const STATUS_LABEL = {
  pending:   'text-amber-600',
  responded: 'text-blue-600',
  confirmed: 'text-emerald-600',
  cancelled: 'text-muted',
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
      status === 'pending'   ? 'bg-amber-50 text-amber-700 border-amber-200'   :
      status === 'responded' ? 'bg-blue-50 text-blue-700 border-blue-200'      :
      status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                               'bg-line text-muted border-line'
    }`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

function BookingPanelRow({ booking, onConfirm, onCancel }) {
  const overlap = (booking.proposedSlots ?? []).filter(s =>
    (booking.crematoriumSlots ?? []).some(c => `${c.date}T${c.start}` === `${s.date}T${s.start}`)
  )
  const [expanded, setExpanded] = useState(booking.status === 'responded')

  return (
    <div className="border-b border-line last:border-0">
      <button
        onClick={() => setExpanded(p => !p)}
        className="w-full text-left px-5 py-4 hover:bg-ink/[0.02] transition-colors"
      >
        <div className="flex items-start gap-2.5">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${STATUS_DOT[booking.status] ?? STATUS_DOT.cancelled}`} />
          <div className="flex-1 min-w-0">
            <p className="font-sans text-[13px] font-medium text-ink truncate">{booking.crematoriumName}</p>
            <p className="font-sans text-[11px] text-muted mt-0.5">Case {booking.caseId}</p>
            {booking.status === 'confirmed' && booking.confirmedSlot && (
              <p className="font-sans text-[11px] text-emerald-600 font-medium mt-1">
                {slotToLabel(objToKey(booking.confirmedSlot))}
              </p>
            )}
          </div>
          <span className={`font-sans text-[10px] font-semibold uppercase tracking-wide flex-shrink-0 mt-0.5 ${STATUS_LABEL[booking.status] ?? STATUS_LABEL.cancelled}`}>
            {booking.status}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-4 -mt-1">
          {booking.status === 'confirmed' && booking.confirmedSlot && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg">
              <CalendarCheck size={13} className="text-emerald-600 flex-shrink-0" />
              <span className="font-sans text-[12px] text-emerald-700 font-medium">
                {slotToLabel(objToKey(booking.confirmedSlot))}
              </span>
            </div>
          )}

          {booking.status === 'responded' && (
            <>
              {overlap.length > 0 ? (
                <div>
                  <p className="font-sans text-[11px] text-muted mb-2">Select a time to confirm:</p>
                  <div className="flex flex-col gap-1">
                    {overlap.map(s => {
                      const key = `${s.date}T${s.start}`
                      return (
                        <button
                          key={key}
                          onClick={() => onConfirm(booking.id, s)}
                          className="w-full text-left px-3 py-2 rounded-lg border border-line hover:border-primary hover:bg-primary/5 transition-colors font-sans text-[12px] text-ink"
                        >
                          {slotToLabel(key)}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="font-sans text-[12px] text-amber-700 font-medium">No overlapping times</p>
                  <p className="font-sans text-[11px] text-amber-600 mt-0.5">Cancel and rebook with different times.</p>
                </div>
              )}
            </>
          )}

          {booking.status === 'pending' && (
            <p className="font-sans text-[11px] text-muted italic">Waiting for crematorium to respond…</p>
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

  const [query, setQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedCase, setSelectedCase] = useState(null)
  const [matchedCrem, setMatchedCrem] = useState(null)
  const searchRef = useRef(null)

  const [weekStart, setWeekStart] = useState(() => getSundayOf(new Date()))
  const [selectedSlots, setSelectedSlots] = useState(new Set())

  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(null)
  const [error, setError] = useState(null)
  const [showSidebar, setShowSidebar] = useState(true)

  useEffect(() => {
    fetchCrematoriums().then(setCrematoriums).catch(() => {})
    fetchBookings().then(setExistingBookings).catch(() => {})
  }, [])

  useEffect(() => {
    function onDown(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowDropdown(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const busySlots = new Map(
    existingBookings
      .filter(b => b.status === 'confirmed' && b.confirmedSlot)
      .map(b => [objToKey(b.confirmedSlot), b.crematoriumName])
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
    setMatchedCrem(crematoriums.find(cr => cr.id === c.crematoriumId) ?? null)
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
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* ── Page header ── */}
      <div className="flex-shrink-0 px-8 py-5 bg-surface border-b border-line">
        <h1 className="font-display text-2xl text-ink">Book Cremation</h1>
        {/* <p className="font-sans text-[13px] text-muted mt-0.5">Schedule a pickup with a partner crematorium.</p> */}
      </div>

      {/* ── Body: form + sidebar ── */}
      <div className="flex flex-1 overflow-hidden relative bg-white">

      {/* ── Scrollable centered form ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-8 py-7">

          {/* Sent banner */}
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

          <div className="flex flex-col gap-5">

            {/* Case search */}
            <div>
              <label className="font-sans text-[15px] font-semibold text-ink block mb-1.5">Case</label>
              <div className="relative" ref={searchRef}>
                <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border bg-surface transition-colors ${
                  showDropdown ? 'border-primary/50 ring-1 ring-primary/20' : 'border-line'
                }`}>
                  <Search size={14} className="text-muted flex-shrink-0" strokeWidth={1.8} />
                  {selectedCase ? (
                    <div className="flex-1 flex items-baseline gap-1.5 min-w-0">
                      <span className="font-sans text-[13px] font-medium text-ink truncate">{selectedCase.deceased ?? 'Unnamed'}</span>
                      <span className="font-sans text-[12px] text-muted flex-shrink-0">– {selectedCase.id}</span>
                    </div>
                  ) : (
                    <input
                      type="text"
                      placeholder="Search by deceased name or case ID…"
                      value={query}
                      onChange={e => {
                        setQuery(e.target.value)
                        setShowDropdown(true)
                      }}
                      onFocus={() => { if (query.trim()) setShowDropdown(true) }}
                      className="flex-1 font-sans text-[13px] text-ink placeholder:text-muted bg-transparent outline-none"
                    />
                  )}
                  {selectedCase && (
                    <button onClick={clearCase} className="text-muted hover:text-ink transition-colors flex-shrink-0">
                      <X size={13} />
                    </button>
                  )}
                </div>

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

            {/* Crematorium — always visible */}
            <div className={`rounded-xl border px-4 py-3 transition-colors ${
              selectedCase && !matchedCrem ? 'border-amber-200 bg-amber-50' : 'border-line bg-surface'
            }`}>
              <p className="font-sans text-[10px] text-muted uppercase tracking-wide mb-1">Crematorium</p>
              {!selectedCase && <p className="font-sans text-[13px] text-muted">—</p>}
              {selectedCase && matchedCrem && (
                <>
                  <p className="font-sans text-[13px] font-medium text-ink">{matchedCrem.name}</p>
                  {matchedCrem.contactEmail
                    ? <p className="font-sans text-[11px] text-muted">{matchedCrem.contactEmail}</p>
                    : <p className="font-sans text-[11px] text-amber-600 mt-0.5">No email on file — invite won't be sent. Add one via Partners.</p>
                  }
                </>
              )}
              {selectedCase && !matchedCrem && (
                <p className="font-sans text-[12px] text-amber-700">
                  {selectedCase.crematorium
                    ? `${selectedCase.crematorium} is not in your connected partners — add via Partners first.`
                    : 'No crematorium assigned to this case.'}
                </p>
              )}
            </div>

            {/* Time picker — always visible */}
            <div>
              <label className="font-sans text-[15px] font-semibold text-ink block mb-1">Your Available Times</label>
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
        </div>
      </div>

      {/* ── Right sidebar — slides in from off-screen ── */}
      <div className={`flex-shrink-0 bg-white border-l border-line flex flex-col overflow-hidden transition-[width] duration-300 ease-in-out ${showSidebar ? 'w-[300px]' : 'w-0'}`}>
        <div className="w-[300px] flex flex-col h-full">
          <div className="px-5 pt-5 pb-4 border-b border-line flex items-center justify-between flex-shrink-0">
            <div>
              <p className="font-sans text-[13px] font-semibold text-ink">Active Bookings</p>
              <p className="font-sans text-[11px] text-muted mt-0.5">{activeBookings.length} booking{activeBookings.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {activeBookings.length === 0 ? (
              <p className="font-sans text-[12px] text-muted px-5 py-6">No active bookings.</p>
            ) : (
              activeBookings.map(b => (
                <BookingPanelRow key={b.id} booking={b} onConfirm={handleConfirm} onCancel={handleCancel} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Toggle button — top of right edge, moves with sidebar ── */}
      <button
        onClick={() => setShowSidebar(p => !p)}
        style={{ right: showSidebar ? '300px' : '0px' }}
        className={`absolute top-5 flex items-center justify-center w-7 h-7 ${showSidebar ? 'bg-white' : 'bg-surface'} border border-line rounded-l-lg shadow-sm hover:bg-ink/5 transition-[right,background-color] duration-300 cursor-pointer group z-10`}
        title={showSidebar ? 'Close bookings' : 'Open bookings'}
      >
        <ChevronRight
          size={12}
          strokeWidth={2.5}
          className={`text-muted group-hover:text-ink transition-transform duration-300 ${showSidebar ? '' : 'rotate-180'}`}
        />
      </button>

      </div>{/* end body flex */}
    </div>
  )
}
