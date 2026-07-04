import { HOURS_LIST, slotKey } from '../../lib/slotUtils.js'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

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

/**
 * Full-height week calendar grid shared by CalendarPage and BookCremationPage.
 *
 * renderCell(key, date, hour, isToday) → ReactElement
 *   key    — slot key string, use as the element's key prop
 *   date   — "YYYY-MM-DD"
 *   hour   — 0–23
 *   isToday — whether date is today
 */
export function WeekGrid({ weekStart, renderCell, onMouseUp, onMouseLeave, className = '' }) {
  const dayDates = getDayDates(weekStart)
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div
      className={`flex-1 flex flex-col overflow-hidden ${className}`}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
    >
      {/* Day headers */}
      <div className="grid flex-shrink-0 border-b border-line" style={{ gridTemplateColumns: '52px repeat(7, 1fr)' }}>
        <div className="border-r border-line" />
        {dayDates.map((date, i) => {
          const d = new Date(date + 'T12:00:00')
          const isToday = date === today
          return (
            <div key={date} className={`border-r border-line last:border-r-0 py-2 text-center ${isToday ? 'bg-primary/5' : ''}`}>
              <div className={`font-sans text-[11px] uppercase tracking-wide ${isToday ? 'text-primary font-semibold' : 'text-muted'}`}>
                {DAY_LABELS[i]}
              </div>
              <div className={`font-sans text-[13px] font-medium ${isToday ? 'text-primary' : 'text-ink'}`}>
                {d.getDate()}
              </div>
            </div>
          )
        })}
      </div>

      {/* Hour grid — fixed row height, scrollable */}
      <div
        className="flex-1 grid overflow-y-auto"
        style={{
          gridTemplateColumns: '52px repeat(7, 1fr)',
          gridAutoRows: '60px',
        }}
      >
        {HOURS_LIST.flatMap(hour => [
          <div key={`lbl-${hour}`} className="border-r border-b border-line flex items-start justify-end pr-2 pt-1">
            <span className="font-sans text-[10px] text-muted">{formatHour(hour)}</span>
          </div>,
          ...dayDates.map(date => renderCell(slotKey(date, hour), date, hour, date === today)),
        ])}
      </div>
    </div>
  )
}
