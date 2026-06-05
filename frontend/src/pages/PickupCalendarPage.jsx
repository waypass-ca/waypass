import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays, List } from 'lucide-react'
import { fetchBookings, confirmBooking, cancelBooking } from '../lib/api.js'
import { objToKey, slotToLabel } from '../lib/slotUtils.js'

const STATUS_STYLES = {
  pending:   { chip: 'bg-amber-100 text-amber-800', dot: 'bg-amber-400' },
  responded: { chip: 'bg-blue-100 text-blue-800', dot: 'bg-blue-400' },
  confirmed: { chip: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500' },
  cancelled: { chip: 'bg-line text-muted', dot: 'bg-line' },
}

function buildMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1)
  const startDow = firstDay.getDay() // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  // leading empty
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  // trailing empty to complete grid
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function BookingChip({ booking, onClick }) {
  const styles = STATUS_STYLES[booking.status] ?? STATUS_STYLES.cancelled
  const label = booking.status === 'confirmed' && booking.confirmedSlot
    ? `${booking.crematoriumName}`
    : booking.crematoriumName
  return (
    <button
      onClick={() => onClick(booking)}
      className={`w-full text-left text-[10px] font-sans font-medium px-1.5 py-0.5 rounded truncate ${styles.chip} transition-opacity hover:opacity-80`}
    >
      {label}
    </button>
  )
}

function DetailPanel({ booking, deceasedName, onConfirm, onCancel, onClose }) {
  const styles = STATUS_STYLES[booking.status] ?? STATUS_STYLES.cancelled
  const overlap = (booking.proposedSlots ?? []).filter(s =>
    (booking.crematoriumSlots ?? []).some(c => `${c.date}T${c.start}` === `${s.date}T${s.start}`)
  )

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-surface border-l border-line shadow-lg z-50 flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-line">
        <p className="font-sans text-[13px] font-semibold text-ink">Booking Detail</p>
        <button onClick={onClose} className="text-muted hover:text-ink transition-colors font-sans text-[18px] leading-none">×</button>
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${styles.dot}`} />
          <span className="font-sans text-[11px] font-semibold uppercase tracking-wide text-muted">{booking.status}</span>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <p className="font-sans text-[10px] text-muted uppercase tracking-wide mb-0.5">Case</p>
            <p className="font-sans text-[13px] text-ink font-medium">{deceasedName ?? booking.caseId}</p>
            {deceasedName && <p className="font-sans text-[11px] text-muted mt-0.5">{booking.caseId}</p>}
          </div>
          <div>
            <p className="font-sans text-[10px] text-muted uppercase tracking-wide mb-0.5">Crematorium</p>
            <p className="font-sans text-[13px] text-ink font-medium">{booking.crematoriumName}</p>
            <p className="font-sans text-[11px] text-muted">{booking.crematoriumEmail}</p>
          </div>

          {booking.confirmedSlot && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <p className="font-sans text-[10px] text-emerald-600 uppercase tracking-wide mb-1">Confirmed</p>
              <p className="font-sans text-[12px] font-semibold text-emerald-700">
                {slotToLabel(objToKey(booking.confirmedSlot))}
              </p>
            </div>
          )}

          {booking.status === 'responded' && (
            <div>
              <p className="font-sans text-[10px] text-muted uppercase tracking-wide mb-2">
                {overlap.length > 0 ? 'Overlapping Times — Select to Confirm' : 'No Overlapping Times'}
              </p>
              {overlap.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  {overlap.map(s => {
                    const key = `${s.date}T${s.start}`
                    return (
                      <button
                        key={key}
                        onClick={() => onConfirm(booking.id, s)}
                        className="w-full text-left px-3 py-2 rounded-lg border border-line hover:border-primary hover:bg-primary/5 transition-colors font-sans text-[11px] text-ink"
                      >
                        {slotToLabel(key)}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <p className="font-sans text-[11px] text-muted">Cancel and rebook with different times.</p>
              )}
            </div>
          )}

          {booking.status === 'pending' && (
            <p className="font-sans text-[11px] text-muted">Waiting for crematorium to respond…</p>
          )}

          <div>
            <p className="font-sans text-[10px] text-muted uppercase tracking-wide mb-2">Proposed ({booking.proposedSlots?.length ?? 0})</p>
            <div className="flex flex-col gap-1">
              {(booking.proposedSlots ?? []).map(s => (
                <p key={`${s.date}T${s.start}`} className="font-sans text-[11px] text-muted">{slotToLabel(`${s.date}T${s.start}`)}</p>
              ))}
            </div>
          </div>
        </div>
      </div>

      {booking.status !== 'confirmed' && booking.status !== 'cancelled' && (
        <div className="p-4 border-t border-line">
          <button
            onClick={() => onCancel(booking.id)}
            className="w-full text-center font-sans text-[12px] text-danger hover:text-danger/80 transition-colors py-1"
          >
            Cancel Booking
          </button>
        </div>
      )}
    </div>
  )
}

function ListView({ bookings, cases, onSelect }) {
  const active = bookings.filter(b => b.status !== 'cancelled')
  const cancelled = bookings.filter(b => b.status === 'cancelled')
  const deceasedName = (b) => cases.find(c => c.id === b.caseId)?.deceased ?? null

  return (
    <div className="flex flex-col gap-2">
      {active.length === 0 && cancelled.length === 0 && (
        <p className="font-sans text-[13px] text-muted py-10 text-center">No bookings yet.</p>
      )}
      {active.map(b => {
        const styles = STATUS_STYLES[b.status] ?? STATUS_STYLES.cancelled
        const name = deceasedName(b)
        return (
          <button
            key={b.id}
            onClick={() => onSelect(b)}
            className="w-full text-left flex items-center gap-4 px-4 py-3 rounded-xl border border-line bg-surface hover:border-primary/30 transition-colors"
          >
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${styles.dot}`} />
            <div className="flex-1 min-w-0">
              <p className="font-sans text-[13px] font-medium text-ink truncate">{name ?? b.caseId}</p>
              <p className="font-sans text-[11px] text-muted">{b.crematoriumName}{name ? ` · ${b.caseId}` : ''}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className={`font-sans text-[10px] font-semibold uppercase tracking-wide ${styles.chip.split(' ')[1]}`}>{b.status}</p>
              {b.confirmedSlot && (
                <p className="font-sans text-[11px] text-muted mt-0.5">{slotToLabel(objToKey(b.confirmedSlot))}</p>
              )}
            </div>
          </button>
        )
      })}
      {cancelled.length > 0 && (
        <>
          <p className="font-sans text-[11px] text-muted uppercase tracking-wide mt-4 mb-2">Cancelled</p>
          {cancelled.map(b => {
            const name = deceasedName(b)
            return (
              <div key={b.id} className="flex items-center gap-4 px-4 py-3 rounded-xl border border-line bg-surface opacity-50">
                <div className="w-2 h-2 rounded-full bg-line flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-[13px] font-medium text-ink truncate">{name ?? b.caseId}</p>
                  <p className="font-sans text-[11px] text-muted">{b.crematoriumName}{name ? ` · ${b.caseId}` : ''}</p>
                </div>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}

export function PickupCalendarPage({ cases = [] }) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [viewMode, setViewMode] = useState('month') // 'month' | 'list'
  const [bookings, setBookings] = useState([])
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBookings()
      .then(setBookings)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleConfirm(bookingId, slot) {
    const updated = await confirmBooking(bookingId, slot)
    setBookings(prev => prev.map(b => b.id === bookingId ? updated : b))
    setSelectedBooking(updated)
  }

  async function handleCancel(bookingId) {
    await cancelBooking(bookingId)
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b))
    setSelectedBooking(null)
  }

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  // Only confirmed bookings appear on the calendar grid
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed' && b.confirmedSlot)
  const bookingsByDate = {}
  confirmedBookings.forEach(b => {
    const dateStr = b.confirmedSlot.date
    if (!bookingsByDate[dateStr]) bookingsByDate[dateStr] = []
    bookingsByDate[dateStr].push(b)
  })

  const cells = buildMonthGrid(year, month)
  const todayStr = today.toISOString().slice(0, 10)

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-surface">

      {/* ── Page header ── */}
      <div className="flex-shrink-0 px-8 py-5 border-b border-line flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-ink">Pickup Calendar</h1> 
        </div>
        <div className="flex items-center gap-4">
          {viewMode === 'month' && (
            <div className="flex items-center gap-1">
              <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-ink/5 text-muted hover:text-ink transition-colors">
                <ChevronLeft size={16} strokeWidth={2} />
              </button>
              <p className="font-sans text-[14px] font-semibold text-ink w-40 text-center">{MONTH_NAMES[month]} {year}</p>
              <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-ink/5 text-muted hover:text-ink transition-colors">
                <ChevronRight size={16} strokeWidth={2} />
              </button>
            </div>
          )}
          <div className="flex items-center gap-1 p-0.5 rounded-lg border border-line bg-surface">
            <button
              onClick={() => setViewMode('month')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-sans text-[12px] transition-colors ${viewMode === 'month' ? 'bg-ink text-surface' : 'text-muted hover:text-ink'}`}
            >
              <CalendarDays size={13} strokeWidth={1.8} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-sans text-[12px] transition-colors ${viewMode === 'list' ? 'bg-ink text-surface' : 'text-muted hover:text-ink'}`}
            >
              <List size={13} strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="font-sans text-[13px] text-muted">Loading…</p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="flex-1 overflow-auto px-8 py-6">
          <div className="max-w-3xl">
            <ListView bookings={bookings} cases={cases} onSelect={setSelectedBooking} />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex bg-white flex-col overflow-auto min-h-0 ">

          {/* Day labels */}
          <div className="grid grid-cols-7 flex-shrink-0 border-b border-line">
            {DAY_LABELS.map(d => (
              <div key={d} className="py-2.5 text-center font-sans text-[11px] font-semibold text-muted uppercase tracking-wide border-r border-line last:border-r-0">
                {d}
              </div>
            ))}
          </div>

          {/* Cells */}
          <div className="grid grid-cols-7 flex-1">
            {cells.map((date, idx) => {
              if (!date) return (
                <div key={`empty-${idx}`} className="border-b border-r border-line last:border-r-0 min-h-[100px] bg-canvas/40" />
              )
              const dateStr = date.toISOString().slice(0, 10)
              const dayBookings = bookingsByDate[dateStr] ?? []
              const isToday = dateStr === todayStr
              const isPast = dateStr < todayStr

              return (
                <div
                  key={dateStr}
                  className={`border-b border-r border-line last:border-r-0 min-h-[100px] p-2 ${isPast ? 'bg-canvas/40' : ''}`}
                >
                  <div className={`font-sans text-[12px] font-medium mb-1.5 w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday ? 'bg-primary text-surface' : isPast ? 'text-muted' : 'text-ink'
                  }`}>
                    {date.getDate()}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {dayBookings.slice(0, 3).map(b => (
                      <BookingChip key={b.id} booking={b} onClick={setSelectedBooking} />
                    ))}
                    {dayBookings.length > 3 && (
                      <p className="font-sans text-[10px] text-muted pl-1">+{dayBookings.length - 3} more</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex-shrink-0 flex items-center gap-4 px-4 py-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-sans text-[11px] text-muted">Confirmed pickup</span>
            </div>
          </div>
        </div>
      )}

      {selectedBooking && (
        <>
          <div className="fixed inset-0 bg-ink/20 z-40" onClick={() => setSelectedBooking(null)} />
          <DetailPanel
            booking={selectedBooking}
            deceasedName={cases.find(c => c.id === selectedBooking.caseId)?.deceased ?? null}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            onClose={() => setSelectedBooking(null)}
          />
        </>
      )}
    </div>
  )
}
