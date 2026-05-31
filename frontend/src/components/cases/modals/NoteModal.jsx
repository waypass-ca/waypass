import { useState } from 'react'
import { Button } from '../../ui/Button'

export function NoteModal({ onAdd, onClose }) {
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleAdd() {
    if (!text.trim()) return
    setSaving(true)
    await onAdd(text.trim())
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40" onClick={onClose}>
      <div className="bg-surface rounded-2xl border border-line shadow-xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
        <p className="font-sans text-xs text-muted uppercase tracking-wide mb-1">Activity</p>
        <h3 className="font-display text-xl text-ink mb-4">Add Note</h3>
        <textarea
          autoFocus
          placeholder="Write a note…"
          value={text}
          onChange={e => setText(e.target.value)}
          rows={4}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAdd() }}
          className="w-full border border-line rounded-xl px-4 py-3 text-sm font-sans text-ink outline-none focus:border-ink transition-colors bg-white resize-none mb-4"
        />
        <div className="flex items-center justify-between">
          <span className="font-sans text-[11px] text-muted">⌘ Return to submit</span>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={handleAdd} disabled={!text.trim() || saving}>
              {saving ? 'Adding…' : 'Add note'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
