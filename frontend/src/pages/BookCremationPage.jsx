import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, CheckCircle2, Send, ChevronLeft, ChevronRight, Info, CalendarCheck } from 'lucide-react'
import { fetchCrematoriums, fetchShippingPartners, fetchBookings, createBooking, confirmBooking, cancelBooking } from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useUser } from '../context/UserContext.jsx'
import { getDefaultShippingPartnerId } from '../lib/preferences.js'
import { PageLoadingBar } from '../components/ui/PageLoadingBar.jsx'
import { getSundayOf, slotToObj, objToKey, slotToLabel, formatWeekRange } from '../lib/slotUtils.js'
import { Button } from '../components/ui/Button.jsx'
import { WeekGrid } from '../components/booking/WeekGrid.jsx'
import { RescheduleBookingModal } from '../components/booking/RescheduleBookingModal.jsx'
import { ConfirmModal } from '../components/ui/ConfirmModal.jsx'

const STATUS_DOT = {
  pending: 'bg-amber-400',
  awaiting_shipping: 'bg-amber-400',
  responded: 'bg-blue-400',
  confirmed: 'bg-emerald-500',
  cancelled: 'bg-line',
}
const STATUS_LABEL = {
  pending: 'text-amber-600',
  awaiting_shipping: 'text-amber-600',
  responded: 'text-blue-600',
  confirmed: 'text-emerald-600',
  cancelled: 'text-muted',
}
const STATUS_DISPLAY = {
  pending: 'pending',
  awaiting_shipping: 'awaiting shipping',
  responded: 'responded',
  confirmed: 'confirmed',
  cancelled: 'cancelled',
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
      status === 'pending' || status === 'awaiting_shipping' ? 'bg-amber-50 text-amber-700 border-amber-200'   :
      status === 'responded' ? 'bg-blue-50 text-blue-700 border-blue-200'      :
      status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                               'bg-line text-muted border-line'
    }`}>
      {(STATUS_DISPLAY[status] ?? status).replace(/^./, c => c.toUpperCase())}
    </span>
  )
}

function BookingPanelRow({ booking, onConfirm, onCancel, onReschedule }) {
  const cremKeys = new Set((booking.crematoriumSlots ?? []).map(c => `${c.date}T${c.start}`))
  const shipKeys = booking.shippingPartnerId
    ? new Set((booking.shippingSlots ?? []).map(c => `${c.date}T${c.start}`))
    : null
  const overlap = (booking.proposedSlots ?? []).filter(s => {
    const k = `${s.date}T${s.start}`
    if (!cremKeys.has(k)) return false
    if (shipKeys && !shipKeys.has(k)) return false
    return true
  })
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
            {STATUS_DISPLAY[booking.status] ?? booking.status}
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
            overlap.length > 0 ? (
              <div>
                <p className="font-sans text-[11px] text-muted mb-2">Select a time to confirm:</p>
                <div className="flex flex-col gap-1">
                  {overlap.map(s => {
                    const key = `${s.date}T${s.start}`
                    return (
                      <button key={key} onClick={() => onConfirm(booking.id, s)}
                        className="w-full text-left px-3 py-2 rounded-lg border border-line hover:border-primary hover:bg-primary/5 transition-colors font-sans text-[12px] text-ink">
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
            )
          )}
          {booking.status === 'pending' && (
            <p className="font-sans text-[11px] text-muted italic">Waiting for crematorium to respond…</p>
          )}
          {booking.status === 'awaiting_shipping' && (
            <p className="font-sans text-[11px] text-muted italic">
              Crematorium responded — waiting on {booking.shippingPartnerName ?? 'shipping partner'}…
            </p>
          )}
          <div className="mt-3 flex items-center gap-4">
            <button onClick={() => onReschedule(booking)}
              className="font-sans text-[11px] text-ink hover:text-ink/70 transition-colors">
              Change booking
            </button>
            <button onClick={() => onCancel(booking.id)}
              disabled={booking.status === 'cancelled'}
              className="font-sans text-[11px] text-danger hover:text-danger/70 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              Cancel booking
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function BookCremationPage({ cases, preselectedCase }) {
  const { user } = useAuth()
  const { canWrite } = useUser()
  const defaultShippingId = getDefaultShippingPartnerId(user?.id)

  const [crematoriums, setCrematoriums] = useState([])
  const [shippingPartners, setShippingPartners] = useState([])
  const [existingBookings, setExistingBookings] = useState([])
  const [loading, setLoading] = useState(true)

  const [query, setQuery] = useState(preselectedCase?.deceased ?? preselectedCase?.id ?? '')
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedCase, setSelectedCase] = useState(preselectedCase ?? null)
  const [matchedCrem, setMatchedCrem] = useState(null)
  const [selectedShipping, setSelectedShipping] = useState(null)
  const searchRef = useRef(null)

  const [weekStart, setWeekStart] = useState(() => getSundayOf(new Date()))
  const [selectedSlots, setSelectedSlots] = useState(new Set())

  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(null)
  const [error, setError] = useState(null)
  const [showSidebar, setShowSidebar] = useState(true)
  const [rescheduleTarget, setRescheduleTarget] = useState(null)
  const [cancelTarget, setCancelTarget] = useState(null)

  const dragging = useRef(false)
  const dragMode = useRef(null)
  const pendingSlots = useRef(null)

  useEffect(() => {
    Promise.allSettled([
      fetchCrematoriums().then(list => {
        setCrematoriums(list)
        if (preselectedCase?.crematoriumId) {
          setMatchedCrem(list.find(cr => cr.id === preselectedCase.crematoriumId) ?? null)
        }
      }),
      fetchShippingPartners().then(list => {
        setShippingPartners(list)
        const defaultId = getDefaultShippingPartnerId(user?.id)
        if (defaultId) {
          const defaultPartner = list.find(p => p.id === defaultId)
          if (defaultPartner) setSelectedShipping(defaultPartner)
        }
      }),
      fetchBookings().then(setExistingBookings),
    ]).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const hasPending = existingBookings.some(b => b.status === 'pending')
    if (!hasPending) return
    const id = setInterval(() => {
      fetchBookings().then(setExistingBookings).catch(() => {})
    }, 10_000)
    return () => clearInterval(id)
  }, [existingBookings])

  useEffect(() => {
    function onDown(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowDropdown(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const commitDrag = useCallback(() => {
    if (dragging.current && pendingSlots.current) {
      setSelectedSlots(new Set(pendingSlots.current))
    }
    dragging.current = false
    dragMode.current = null
    pendingSlots.current = null
  }, [])

  const busySlots = new Map(
    existingBookings
      .filter(b => b.status === 'confirmed' && b.confirmedSlot)
      .map(b => [objToKey(b.confirmedSlot), b.crematoriumName])
  )

  const filtered = query.trim().length > 0
    ? cases.filter(c =>
        (c.deceased ?? '').toLowerCase().includes(query.toLowerCase()) ||
        (c.id ?? '').toLowerCase().includes(query.toLowerCase())
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
    const defaultId = getDefaultShippingPartnerId(user?.id)
    setSelectedShipping(defaultId ? (shippingPartners.find(p => p.id === defaultId) ?? null) : null)
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
        shippingPartnerId: selectedShipping?.id ?? null,
        shippingPartnerEmail: selectedShipping?.contactEmail ?? null,
        shippingPartnerName: selectedShipping?.name ?? null,
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

  function handleMouseDown(key) {
    if (!selectedCase || !matchedCrem || busySlots.has(key)) return
    dragging.current = true
    dragMode.current = selectedSlots.has(key) ? 'remove' : 'add'
    pendingSlots.current = new Set(selectedSlots)
    if (dragMode.current === 'add') pendingSlots.current.add(key)
    else pendingSlots.current.delete(key)
    setSelectedSlots(new Set(pendingSlots.current))
  }

  function handleMouseEnter(key) {
    if (!dragging.current || busySlots.has(key)) return
    if (dragMode.current === 'add') pendingSlots.current.add(key)
    else pendingSlots.current.delete(key)
    setSelectedSlots(new Set(pendingSlots.current))
  }

  const today = new Date().toISOString().slice(0, 10)
  const currentSunday = getSundayOf(new Date()).toISOString().slice(0, 10)
  const isCurrentWeek = weekStart.toISOString().slice(0, 10) === currentSunday

  function prevWeek() {
    const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(getSundayOf(d))
  }
  function nextWeek() {
    const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(getSundayOf(d))
  }

  const activeBookings = existingBookings.filter(b => b.status !== 'cancelled')
  const caseHasActiveBooking = selectedCase
    ? activeBookings.find(b => b.caseId === selectedCase.id) ?? null
    : null
  const canSend = selectedCase && matchedCrem && selectedSlots.size > 0 && !caseHasActiveBooking
  const disabled = !selectedCase || !matchedCrem || !!caseHasActiveBooking

  return (
    <div className="flex-1 flex overflow-hidden bg-surface relative">
      {loading && <PageLoadingBar />}

      {/* ── Main column ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Top bar — relative z-10 so dropdown paints above the calendar below */}
        <div className="flex-shrink-0 border-b border-line bg-surface/80 backdrop-blur relative z-10">

          {/* Row 1: title + bookings button — matches CasesTopBar */}
          <div className="px-6 pt-6 pb-3 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-baseline gap-3">
                <h1 className="font-display text-3xl font-light text-ink leading-tight">Book Cremation</h1>
                {selectedSlots.size > 0 && (
                  <span className="font-sans text-[12.5px] text-muted">{selectedSlots.size} slot{selectedSlots.size !== 1 ? 's' : ''} selected</span>
                )}
              </div>
            </div>
            {!showSidebar && (
              <button
                onClick={() => setShowSidebar(true)}
                className="h-9 px-3.5 rounded-lg border border-line bg-white hover:bg-ink/5 transition-colors font-sans text-[12.5px] font-medium text-ink flex items-center gap-2 mt-1 shrink-0"
              >
                Bookings
                {activeBookings.length > 0 && (
                  <span className="flex items-center justify-center w-4 h-4 rounded-full bg-ink text-surface text-[10px] font-semibold">{activeBookings.length}</span>
                )}
              </button>
            )}
          </div>

          {/* Row 2: search bar — matches CasesTopBar */}
          <div className="px-6 pb-3 flex items-end justify-between gap-2">
            <div className="relative flex-1 min-w-[180px] max-w-sm" ref={searchRef}>
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              {selectedCase ? (
                <div className="w-full pl-9 pr-3 h-9 rounded-lg border border-line bg-white flex items-center gap-2 min-w-0">
                  <span className="font-sans text-[13px] font-medium text-ink truncate">{selectedCase.deceased ?? 'Unnamed'}</span>
                  <span className="font-sans text-[12px] text-muted flex-shrink-0">– {selectedCase.id}</span>
                  <button onClick={clearCase} className="ml-auto text-muted hover:text-ink transition-colors flex-shrink-0">
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <input
                  type="text"
                  placeholder="Search by deceased name or case ID…"
                  value={query}
                  onChange={e => { setQuery(e.target.value); setShowDropdown(true) }}
                  onFocus={() => { if (query.trim()) setShowDropdown(true) }}
                  className="w-full pl-9 pr-4 h-9 rounded-lg border border-line bg-white text-[13px] text-ink font-sans placeholder:text-muted outline-none focus:border-ink/60 transition"
                />
              )}

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

          {/* Row 3: week nav centered — matches CalendarPage */}
          <div className="flex items-center justify-center gap-1 py-1 border-t border-line bg-white">
            <button onClick={prevWeek} disabled={isCurrentWeek}
              className="p-1.5 rounded-lg hover:bg-ink/5 text-muted hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft size={16} strokeWidth={2} />
            </button>
            <p className="font-sans text-[14px] font-semibold text-ink w-48 text-center">{formatWeekRange(weekStart)}</p>
            <button onClick={nextWeek}
              className="p-1.5 rounded-lg hover:bg-ink/5 text-muted hover:text-ink transition-colors">
              <ChevronRight size={16} strokeWidth={2} />
            </button>
          </div>

        </div>

        {/* Banners */}
        {sent && (
          <div className="flex-shrink-0 flex items-start gap-3 px-6 py-3 bg-emerald-50 border-b border-emerald-200">
            <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="font-sans text-[13px] font-medium text-emerald-800">
              Invite sent to {sent.crematoriumName} — you'll be notified when they respond.
            </p>
            <button onClick={() => setSent(null)} className="ml-auto text-emerald-400 hover:text-emerald-700 transition-colors">
              <X size={13} />
            </button>
          </div>
        )}
        {error && (
          <div className="flex-shrink-0 flex items-center gap-3 px-6 py-2.5 bg-danger/5 border-b border-danger/20">
            <p className="font-sans text-[12px] text-danger flex-1">{error}</p>
            <button onClick={() => setError(null)} className="text-danger/50 hover:text-danger transition-colors">
              <X size={13} />
            </button>
          </div>
        )}
        {caseHasActiveBooking && (
          <div className="flex-shrink-0 flex items-start gap-3 px-6 py-3 bg-amber-50 border-b border-amber-200">
            <Info size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="font-sans text-[13px] text-amber-800 flex-1">
              This case already has an active booking with <strong>{caseHasActiveBooking.crematoriumName}</strong>.
              Change or cancel it from the sidebar before booking a new one.
            </p>
            {canWrite && (
              <button onClick={() => setRescheduleTarget(caseHasActiveBooking)}
                className="font-sans text-[12px] font-medium text-amber-800 hover:text-amber-900 underline underline-offset-2">
                Change booking
              </button>
            )}
          </div>
        )}

        {/* Full-height week calendar */}
        <WeekGrid
          weekStart={weekStart}
          className={`select-none bg-white ${disabled ? 'opacity-50' : ''}`}
          onMouseUp={commitDrag}
          onMouseLeave={commitDrag}
          renderCell={(key, date, hour) => {
            const isSelected = selectedSlots.has(key)
            const busyLabel = busySlots.get(key)
            const isBusy = busyLabel !== undefined
            const isPast = date < today || (date === today && hour < new Date().getHours())

            let cellClass = 'border-r border-b border-line last:border-r-0 overflow-hidden transition-colors '
            if (isBusy)          cellClass += 'bg-danger/10 cursor-not-allowed '
            else if (isSelected) cellClass += 'bg-primary cursor-pointer '
            else if (isPast || disabled) cellClass += 'bg-canvas/30 cursor-default '
            else                 cellClass += 'hover:bg-primary/10 cursor-pointer '

            return (
              <div key={key} className={cellClass}
                onMouseDown={() => handleMouseDown(key)}
                onMouseEnter={() => handleMouseEnter(key)}
              >
                {isBusy && busyLabel && (
                  <div className="w-full h-full flex items-center justify-center px-1">
                    <span className="font-sans text-[9px] font-semibold text-danger/60 truncate">{busyLabel}</span>
                  </div>
                )}
              </div>
            )
          }}
        />

        {/* Fixed bottom bar */}
        <div className="flex-shrink-0 border-t border-line bg-surface px-6 py-3 flex items-center gap-6">
          <div className="flex items-start gap-1.5 flex-1 min-w-0">
            <Info size={12} className="text-muted flex-shrink-0 mt-0.5" />
            <p className="font-sans text-[11px] text-muted leading-relaxed">
              Drag to mark your available pickup times. An invite will be emailed to the crematorium — they'll choose from your proposed slots and you'll be notified.
            </p>
          </div>
          <div className="flex items-center gap-5 flex-shrink-0">
            <div className="text-right">
              <p className="font-sans text-[10px] text-muted uppercase tracking-wide">Crematorium</p>
              <p className="font-sans text-[13px] font-medium text-ink">{matchedCrem?.name ?? '—'}</p>
            </div>
            <div className="text-right min-w-[160px]">
              <p className="font-sans text-[10px] text-muted uppercase tracking-wide">Shipping partner</p>
              <select
                value={selectedShipping?.id ?? ''}
                onChange={e => {
                  const next = shippingPartners.find(p => p.id === e.target.value) ?? null
                  setSelectedShipping(next)
                }}
                disabled={!selectedCase}
                className="font-sans text-[13px] text-ink bg-transparent border-0 outline-none w-full text-right cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">— Skip —</option>
                {shippingPartners.length === 0 && (
                  <option disabled>No shipping partners connected</option>
                )}
                {shippingPartners.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="text-right">
              <p className="font-sans text-[10px] text-muted uppercase tracking-wide">Sending to</p>
              <p className="font-sans text-[13px] text-ink">{matchedCrem?.contactEmail ?? '—'}</p>
              {selectedShipping && (
                <p className="font-sans text-[11px] text-muted">+ {selectedShipping.contactEmail ?? 'no email'}</p>
              )}
            </div>
            {canWrite && (
              <Button onClick={handleSend} disabled={!canSend || sending} className="flex items-center gap-2">
                <Send size={13} strokeWidth={2} />
                {sending ? 'Sending…' : 'Send Invite'}
              </Button>
            )}
          </div>
        </div>

      </div>{/* end main column */}

      {/* ── Bookings sidebar — full height ── */}
      <div className={`flex-shrink-0 bg-white border-l border-line flex flex-col overflow-hidden transition-[width] duration-300 ease-in-out ${showSidebar ? 'w-[300px]' : 'w-0'}`}>
        <div className="w-[300px] flex flex-col h-full">
          <div className="px-5 pt-5 pb-4 border-b border-line flex items-center justify-between flex-shrink-0">
            <div>
              <p className="font-sans text-[13px] font-semibold text-ink">Active Bookings</p>
              <p className="font-sans text-[11px] text-muted mt-0.5">{activeBookings.length} booking{activeBookings.length !== 1 ? 's' : ''}</p>
            </div>
            <button onClick={() => setShowSidebar(false)}
              className="p-1 rounded-md text-muted hover:text-ink hover:bg-ink/5 transition-colors">
              <X size={14} strokeWidth={2} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {activeBookings.length === 0 ? (
              <p className="font-sans text-[12px] text-muted px-5 py-6">No active bookings.</p>
            ) : (
              activeBookings.map(b => (
                <BookingPanelRow key={b.id} booking={b} onConfirm={canWrite ? handleConfirm : undefined} onCancel={canWrite ? () => setCancelTarget(b) : undefined} onReschedule={canWrite ? setRescheduleTarget : undefined} />
              ))
            )}
          </div>
        </div>
      </div>

      {rescheduleTarget && (
        <RescheduleBookingModal
          booking={rescheduleTarget}
          existingBookings={existingBookings}
          onClose={() => setRescheduleTarget(null)}
          onRescheduled={updated => {
            setExistingBookings(prev => prev.map(b => b.id === updated.id ? updated : b))
          }}
        />
      )}

      {cancelTarget && (
        <ConfirmModal
          title="Cancel booking?"
          message={`This will cancel the pickup request${cancelTarget.crematoriumName ? ` with ${cancelTarget.crematoriumName}` : ''}. You can reopen it later from the case page.`}
          confirmLabel="Cancel booking"
          cancelLabel="Keep booking"
          destructive
          onCancel={() => setCancelTarget(null)}
          onConfirm={async () => {
            await handleCancel(cancelTarget.id)
            setCancelTarget(null)
          }}
        />
      )}

    </div>
  )
}
