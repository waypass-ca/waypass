import { useRef, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { HOURS_LIST, slotKey, formatWeekRange, getMondayOf } from '../../lib/slotUtils.js'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function formatHour(hour) {
  if (hour === 0) return '12am'
  if (hour === 12) return '12pm'
  return hour < 12 ? `${hour}am` : `${hour - 12}pm`
}

function getDayDates(weekStart) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d.toISOString().slice(0, 10)
  })
}

export function WeekTimeGrid({
  weekStart,
  onWeekChange,
  selectedSlots = new Set(),
  onSlotsChange,
  busySlots = new Set(),
  highlightSlots = new Set(),
  readOnly = false,
  disabled = false,
}) {
  const dragging = useRef(false)
  const dragMode = useRef(null) // 'add' | 'remove'
  const pendingSlots = useRef(null)

  const dayDates = getDayDates(weekStart)
  const today = new Date().toISOString().slice(0, 10)

  const commitDrag = useCallback(() => {
    if (dragging.current && pendingSlots.current) {
      onSlotsChange?.(new Set(pendingSlots.current))
    }
    dragging.current = false
    dragMode.current = null
    pendingSlots.current = null
  }, [onSlotsChange])

  function handleMouseDown(key) {
    if (disabled || busySlots.has(key)) return

    // Read-only mode: click-toggle highlighted slots only (no drag)
    if (readOnly) {
      if (!highlightSlots.has(key)) return
      const next = new Set(selectedSlots)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      onSlotsChange?.(next)
      return
    }

    if (highlightSlots.size > 0 && !highlightSlots.has(key)) return
    dragging.current = true
    dragMode.current = selectedSlots.has(key) ? 'remove' : 'add'
    pendingSlots.current = new Set(selectedSlots)
    if (dragMode.current === 'add') pendingSlots.current.add(key)
    else pendingSlots.current.delete(key)
  }

  function handleMouseEnter(key) {
    if (!dragging.current) return
    if (busySlots.has(key)) return
    if (highlightSlots.size > 0 && !highlightSlots.has(key)) return
    if (dragMode.current === 'add') pendingSlots.current.add(key)
    else pendingSlots.current.delete(key)
    onSlotsChange?.(new Set(pendingSlots.current))
  }

  function prevWeek() {
    const d = new Date(weekStart)
    d.setDate(d.getDate() - 7)
    onWeekChange?.(d)
  }

  function nextWeek() {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + 7)
    onWeekChange?.(d)
  }

  const currentMonday = getMondayOf(new Date()).toISOString().slice(0, 10)
  const isCurrentWeek = weekStart.toISOString().slice(0, 10) === currentMonday

  return (
    <div
      className={`select-none ${disabled ? 'opacity-40 pointer-events-none' : ''}`}
      onMouseUp={commitDrag}
      onMouseLeave={commitDrag}
    >
      {/* Week nav */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevWeek}
          disabled={isCurrentWeek}
          className="p-1 rounded hover:bg-ink/5 text-muted hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={16} strokeWidth={2} />
        </button>
        <span className="font-sans text-[13px] font-medium text-ink">{formatWeekRange(weekStart)}</span>
        <button
          onClick={nextWeek}
          className="p-1 rounded hover:bg-ink/5 text-muted hover:text-ink transition-colors"
        >
          <ChevronRight size={16} strokeWidth={2} />
        </button>
      </div>

      {/* Grid */}
      <div className="overflow-auto rounded-xl border border-line bg-surface">
        <div className="grid" style={{ gridTemplateColumns: '48px repeat(7, 1fr)', minWidth: '580px' }}>

          {/* Header row */}
          <div className="border-b border-line" />
          {dayDates.map((date, i) => {
            const d = new Date(date + 'T12:00:00')
            const isToday = date === today
            return (
              <div
                key={date}
                className={`border-b border-l border-line py-2 text-center ${isToday ? 'bg-primary/5' : ''}`}
              >
                <div className={`font-sans text-[11px] uppercase tracking-wide ${isToday ? 'text-primary font-semibold' : 'text-muted'}`}>
                  {DAY_LABELS[i]}
                </div>
                <div className={`font-sans text-[13px] font-medium ${isToday ? 'text-primary' : 'text-ink'}`}>
                  {d.getDate()}
                </div>
              </div>
            )
          })}

          {/* Time rows */}
          {HOURS_LIST.map((hour) => (
            <div key={hour} className="contents">
              <div className="border-t border-line flex items-start justify-end pr-2 pt-1">
                <span className="font-sans text-[10px] text-muted">{formatHour(hour)}</span>
              </div>
              {dayDates.map((date) => {
                const key = slotKey(date, hour)
                const isSelected = selectedSlots.has(key)
                const isBusy = busySlots.has(key)
                const isHighlighted = highlightSlots.has(key)
                const isPast = date < today || (date === today && hour < new Date().getHours())

                let cellClass = 'border-t border-l border-line h-10 cursor-pointer transition-colors '

                if (isBusy) {
                  cellClass += 'bg-danger/10 cursor-not-allowed '
                } else if (isSelected) {
                  cellClass += 'bg-primary text-surface '
                } else if (isHighlighted && !readOnly) {
                  cellClass += 'bg-primary/10 hover:bg-primary/20 '
                } else if (isHighlighted && readOnly) {
                  cellClass += 'bg-primary/10 hover:bg-primary/25 cursor-pointer '
                } else if (isPast || (readOnly && !isHighlighted)) {
                  cellClass += 'bg-canvas/50 cursor-default opacity-40 '
                } else {
                  cellClass += 'hover:bg-primary/8 '
                }

                return (
                  <div
                    key={key}
                    className={cellClass}
                    onMouseDown={() => handleMouseDown(key)}
                    onMouseEnter={() => handleMouseEnter(key)}
                  >
                    {isBusy && (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-danger/50" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2.5">
        {!readOnly && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-primary" />
            <span className="font-sans text-[11px] text-muted">Your availability</span>
          </div>
        )}
        {readOnly && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-primary/20" />
            <span className="font-sans text-[11px] text-muted">Proposed times (click to select)</span>
          </div>
        )}
        {readOnly && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-primary" />
            <span className="font-sans text-[11px] text-muted">Selected</span>
          </div>
        )}
        {busySlots.size > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-danger/20" />
            <span className="font-sans text-[11px] text-muted">Existing pickup</span>
          </div>
        )}
      </div>
    </div>
  )
}
