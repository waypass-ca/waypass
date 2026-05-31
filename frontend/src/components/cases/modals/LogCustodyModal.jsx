import { useState } from 'react'
import { CUSTODY_STAGES } from '../../../lib/constants.js'
import { Button } from '../../ui/Button'

function now() {
  return new Date().toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

export function LogCustodyModal({ custody, onUpdate, onClose, authBlocksTransport }) {
  const [selectedIdx, setSelectedIdx] = useState(null)
  const [staff, setStaff] = useState('')
  const [timestamp, setTimestamp] = useState(now())
  const [saving, setSaving] = useState(false)

  const lastCompletedIdx = custody.reduce((acc, e, i) => e.completed ? i : acc, -1)
  const nextPendingIdx = lastCompletedIdx + 1

  async function handleLog() {
    if (selectedIdx === null || !staff.trim()) return
    setSaving(true)
    await onUpdate(selectedIdx, { completed: true, staff, timestamp })
    setSaving(false)
    onClose()
  }

  async function handleRevert(idx) {
    setSaving(true)
    await onUpdate(idx, { completed: false, staff: null, timestamp: null })
    setSaving(false)
    setSelectedIdx(null)
  }

  function canSelect(i) {
    const entry = custody[i] ?? {}
    if (entry.completed) return i === lastCompletedIdx
    if (i === nextPendingIdx) return !(authBlocksTransport && i === 2)
    return false
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40" onClick={onClose}>
      <div className="bg-surface rounded-2xl border border-line shadow-xl w-full max-w-md mx-4 p-6 max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <p className="font-sans text-xs text-muted uppercase tracking-wide mb-1">Chain of Custody</p>
        <h3 className="font-display text-xl text-ink mb-5">Log Step</h3>

        <div className="flex-1 overflow-y-auto -mx-2 px-2 space-y-0.5 mb-5">
          {CUSTODY_STAGES.map((stage, i) => {
            const entry = custody[i] ?? {}
            const isCompleted = entry.completed
            const isSelected = selectedIdx === i
            const selectable = canSelect(i)
            const isNext = i === nextPendingIdx

            return (
              <div key={i}>
                <button
                  onClick={() => selectable && setSelectedIdx(isSelected ? null : i)}
                  disabled={!selectable}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors border-0 outline-none ${isSelected
                      ? 'bg-primary/10'
                      : selectable
                        ? 'hover:bg-canvas cursor-pointer'
                        : 'cursor-default'
                    }`}
                >
                  {isCompleted ? (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : isNext ? (
                    <div className="w-5 h-5 rounded-full border-2 border-primary flex-shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-line flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`font-sans text-sm leading-snug ${isCompleted ? 'text-ink' : isNext ? 'text-primary font-medium' : 'text-muted'}`}>{stage}</p>
                    {isCompleted && (
                      <p className="font-sans text-[11px] text-muted mt-0.5">{entry.timestamp} · {entry.staff}</p>
                    )}
                    {isNext && authBlocksTransport && (
                      <p className="font-sans text-[11px] text-warning mt-0.5">Complete authorization first</p>
                    )}
                  </div>
                </button>

                {isSelected && (
                  <div className="mx-3 mt-1 mb-2 p-3 bg-canvas rounded-xl border border-line">
                    {isCompleted ? (
                      <div className="flex items-center justify-between">
                        <span className="font-sans text-xs text-secondary">Revert this completed step?</span>
                        <button
                          onClick={() => handleRevert(i)}
                          disabled={saving}
                          className="font-sans text-xs font-medium text-danger hover:opacity-70 cursor-pointer border-0 bg-transparent outline-none disabled:opacity-40"
                        >
                          {saving ? 'Reverting…' : 'Revert'}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <input
                          autoFocus
                          type="text"
                          placeholder="Staff member name"
                          value={staff}
                          onChange={e => setStaff(e.target.value)}
                          className="w-full border border-line rounded-lg px-3 py-2 text-sm font-sans text-ink outline-none focus:border-ink transition-colors bg-white"
                        />
                        <input
                          type="text"
                          value={timestamp}
                          onChange={e => setTimestamp(e.target.value)}
                          className="w-full border border-line rounded-lg px-3 py-2 text-sm font-sans text-ink outline-none focus:border-ink transition-colors bg-white"
                        />
                        <Button
                          variant="primary"
                          onClick={handleLog}
                          disabled={!staff.trim() || saving}
                          className="w-full justify-center"
                        >
                          {saving ? 'Logging…' : 'Mark complete'}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <Button variant="secondary" onClick={onClose} className="w-full justify-center">Close</Button>
      </div>
    </div>
  )
}
