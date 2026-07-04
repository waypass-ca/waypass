import { useEffect, useRef } from 'react'
import { Plus } from 'lucide-react'
import { ActivityEvent } from './ActivityEvent'

function groupByDay(events) {
  const today = new Date()
  const todayStr = today.toDateString()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const yesterdayStr = yesterday.toDateString()
  const thisYear = today.getFullYear()

  const buckets = new Map()
  const NO_TS = '__earlier__'

  for (const event of events) {
    const d = event.ts ? new Date(event.ts) : null
    if (!d || isNaN(d.getTime())) {
      if (!buckets.has(NO_TS)) buckets.set(NO_TS, { label: 'Earlier', events: [] })
      buckets.get(NO_TS).events.push(event)
      continue
    }
    const dStr = d.toDateString()
    if (!buckets.has(dStr)) {
      let label
      if (dStr === todayStr) label = 'Today'
      else if (dStr === yesterdayStr) label = 'Yesterday'
      else if (d.getFullYear() === thisYear) label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      else label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      buckets.set(dStr, { label, events: [] })
    }
    buckets.get(dStr).events.push(event)
  }

  const result = []
  if (buckets.has(NO_TS)) result.push(buckets.get(NO_TS))
  for (const [key, bucket] of buckets) {
    if (key !== NO_TS) result.push(bucket)
  }
  return result
}

export function CaseActivityTab({ activityFeed, onSelectEvent, onShowNote, onShowLog }) {
  const reversed = [...activityFeed].reverse()
  const groups = groupByDay(reversed)
  const total = activityFeed.length
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end', behavior: 'instant' })
  }, [activityFeed])

  return (
    <div className="px-6 pt-5 pb-4 bg-white min-h-full">
      {total === 0 ? (
        <div className="text-center py-10">
          <p className="font-sans text-sm text-muted">No activity recorded yet.</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <button
              onClick={onShowNote}
              className="h-7 px-3 rounded-lg border border-line text-ink font-sans text-[12px] font-medium flex items-center gap-1 cursor-pointer outline-none bg-transparent hover:bg-canvas"
            >
              <Plus size={11} strokeWidth={2} />
              Add note
            </button>
            <button
              onClick={onShowLog}
              className="h-7 px-3 rounded-lg border border-line text-ink font-sans text-[12px] font-medium flex items-center gap-1 cursor-pointer outline-none bg-transparent hover:bg-canvas"
            >
              <Plus size={11} strokeWidth={2} />
              Log custody
            </button>
          </div>
        </div>
      ) : (
        <div>
          {groups.map((group, gi) => (
            <div key={group.label} className={gi > 0 ? 'mt-5' : ''}>
              <div className="flex items-center gap-3 mb-1">
                <span className="font-sans text-[10.5px] uppercase tracking-[0.08em] text-muted whitespace-nowrap">{group.label}</span>
                <div className="flex-1 h-px bg-line" />
              </div>
              <div className="divide-y divide-line">
                {group.events.map((event, i) => (
                  <ActivityEvent
                    key={event.id ?? i}
                    event={event}
                    onClick={() => onSelectEvent?.(event)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}
