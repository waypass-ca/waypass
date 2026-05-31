import { Plus } from 'lucide-react'
import { ActivityEvent } from './ActivityEvent'

export function CaseActivityTab({ activityFeed, onShowNote, onShowLog }) {
  return (
    <div className="max-w-2xl mx-auto px-8 py-6">
      <div className="flex justify-end gap-2 mb-6 -mx-4">
        <button
          onClick={onShowNote}
          className="h-8 px-3 rounded-lg bg-ink hover:bg-ink/90 text-surface font-sans text-[12.5px] font-medium flex items-center gap-1.5 cursor-pointer outline-none"
        >
          <Plus size={12} strokeWidth={2} />
          Note
        </button>
        <button
          onClick={onShowLog}
          className="h-8 px-3 rounded-lg bg-ink hover:bg-ink/90 text-surface font-sans text-[12.5px] font-medium flex items-center gap-1.5 cursor-pointer outline-none"
        >
          <Plus size={12} strokeWidth={2} />
          Log
        </button>
      </div>
      {activityFeed.length === 0 ? (
        <div className="text-center py-16">
          <p className="font-sans text-sm text-muted">No activity recorded yet.</p>
          <p className="font-sans text-xs text-muted mt-1">Use the Note or Log buttons to get started.</p>
        </div>
      ) : (
        <div>
          {[...activityFeed].reverse().map((event, i, arr) => (
            <ActivityEvent key={i} event={event} isLast={i === arr.length - 1} />
          ))}
        </div>
      )}
    </div>
  )
}
