import { useState, useRef, useEffect } from 'react'
import { Pencil, Check, X } from 'lucide-react'
import { toastError } from '../../lib/toast.js'

// Two modes:
//   default — hover reveals a pencil; click → input replaces the read view.
//   alwaysEditing — skip the read view; input is rendered immediately. Used
//     by edit-mode toggles where the parent already gates editability.
// Enter or blur commits, Esc reverts. The save handler is awaited; on failure
// the field rolls back to the prior value and a toast surfaces the error.
export function InlineEditField({
  value,
  display,             // optional formatted value for read view
  placeholder = '—',
  type = 'text',       // 'text' | 'number' | 'date' | 'time' | 'email' | 'tel' | 'select'
  options = [],        // [{ value, label }] when type === 'select'
  onSave,              // async (newValue) => void
  multiline = false,
  alwaysEditing = false,
  className = '',
}) {
  const [editing, setEditing] = useState(alwaysEditing)
  const [draft, setDraft] = useState(value ?? '')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => { setDraft(value ?? '') }, [value])
  useEffect(() => { setEditing(alwaysEditing) }, [alwaysEditing])
  useEffect(() => { if (editing && !alwaysEditing) inputRef.current?.focus() }, [editing, alwaysEditing])

  const commit = async () => {
    if (saving) return
    const next = typeof draft === 'string' ? draft.trim() : draft
    if (next === (value ?? '') || (next === '' && value == null)) {
      setEditing(false)
      return
    }
    setSaving(true)
    try {
      await onSave(next === '' ? null : next)
      setEditing(false)
    } catch (err) {
      setDraft(value ?? '')
      toastError(err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const cancel = () => {
    setDraft(value ?? '')
    if (!alwaysEditing) setEditing(false)
  }

  if (!editing) {
    const shown = display ?? (value === '' || value == null ? placeholder : value)
    const isEmpty = value === '' || value == null
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className={`group flex items-center gap-1 text-left bg-transparent border-0 p-0 cursor-pointer ${className}`}
      >
        <span className={`font-sans text-[13px] ${isEmpty ? 'text-muted italic' : 'text-ink'}`}>{shown}</span>
        <Pencil size={11} className="opacity-0 group-hover:opacity-60 transition-opacity text-muted" />
      </button>
    )
  }

  const InputEl = type === 'select'
    ? (
      <select
        ref={inputRef}
        value={draft ?? ''}
        disabled={saving}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Escape') cancel() }}
        className="px-2 py-1 text-sm border border-line rounded outline-none focus:border-ink bg-surface"
      >
        <option value="">—</option>
        {options.map(o => (<option key={o.value} value={o.value}>{o.label}</option>))}
      </select>
    )
    : multiline
    ? (
      <textarea
        ref={inputRef}
        value={draft ?? ''}
        disabled={saving}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Escape') cancel(); if (e.key === 'Enter' && e.metaKey) commit() }}
        rows={3}
        className="px-2 py-1 text-sm border border-line rounded outline-none focus:border-ink w-full"
      />
    )
    : (
      <input
        ref={inputRef}
        type={type}
        value={draft ?? ''}
        disabled={saving}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') cancel()
        }}
        className="px-2 py-1 text-sm border border-line rounded outline-none focus:border-ink"
      />
    )

  // In alwaysEditing mode the parent owns the edit lifecycle (an "Edit" toggle
  // above), so the per-field confirm/cancel buttons would be redundant noise —
  // blur/Enter commits, Esc reverts.
  if (alwaysEditing) {
    return <div className={className}>{InputEl}</div>
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {InputEl}
      {/* Mouse-down so the click fires before the input's blur cancel. */}
      <button
        onMouseDown={e => { e.preventDefault(); commit() }}
        disabled={saving}
        className="w-6 h-6 rounded flex items-center justify-center text-emerald-600 hover:bg-emerald-50 border-0 bg-transparent cursor-pointer disabled:opacity-40"
      >
        <Check size={12} />
      </button>
      <button
        onMouseDown={e => { e.preventDefault(); cancel() }}
        disabled={saving}
        className="w-6 h-6 rounded flex items-center justify-center text-muted hover:bg-canvas border-0 bg-transparent cursor-pointer disabled:opacity-40"
      >
        <X size={12} />
      </button>
    </div>
  )
}
