import { useState } from 'react'
import { Pencil, Trash2, Check, X } from 'lucide-react'

const DOC_TYPES = [
  { value: 'death_certificate', label: 'Death certificate' },
  { value: 'permit',            label: 'Permit' },
  { value: 'authorization',     label: 'Authorization' },
  { value: 'invoice',           label: 'Invoice' },
  { value: 'other',             label: 'Other' },
]

function relTime(ts) {
  if (!ts) return null
  const d = new Date(ts)
  if (isNaN(d.getTime())) return null
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export function DocRow({ doc, onPreview, onRename, onDelete, onUpdateMeta }) {
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState(doc.fileName ?? doc.name ?? '')

  const display = doc.fileName ?? doc.name ?? ''
  const ext = display.includes('.') ? display.split('.').pop().toUpperCase() : 'FILE'
  const uploadedAt = relTime(doc.uploadedAt) ?? doc.uploadedAt ?? null

  const commitRename = async () => {
    const trimmed = name.trim()
    setRenaming(false)
    if (!trimmed || trimmed === display) return
    if (onRename) await onRename(doc.id, trimmed)
  }

  const startRename = (e) => {
    e.stopPropagation()
    setName(display)
    setRenaming(true)
  }

  return (
    <div className="flex items-center justify-between py-3 border-b border-line last:border-0 hover:bg-canvas/50 -mx-2 px-2 rounded-lg transition-colors group">
      <div
        onClick={() => !renaming && onPreview?.(doc)}
        className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
      >
        <div className="w-8 h-8 rounded-lg bg-info-tint flex items-center justify-center flex-shrink-0">
          <span className="font-sans text-[9px] font-bold text-info">{ext}</span>
        </div>
        <div className="min-w-0 flex-1">
          {renaming ? (
            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
              <input
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') commitRename()
                  if (e.key === 'Escape') setRenaming(false)
                }}
                className="flex-1 px-2 py-1 text-sm border border-line rounded outline-none focus:border-ink"
              />
              <button onClick={commitRename} className="w-7 h-7 rounded flex items-center justify-center text-emerald-600 hover:bg-emerald-50 border-0 bg-transparent cursor-pointer">
                <Check size={14} />
              </button>
              <button onClick={() => setRenaming(false)} className="w-7 h-7 rounded flex items-center justify-center text-muted hover:bg-canvas border-0 bg-transparent cursor-pointer">
                <X size={14} />
              </button>
            </div>
          ) : (
            <>
              <p className="font-sans text-sm text-ink truncate">{display}</p>
              {uploadedAt && <p className="font-sans text-[11px] text-muted mt-0.5">{uploadedAt}</p>}
            </>
          )}
        </div>
      </div>
      {!renaming && (
        <div className="flex items-center gap-1 flex-shrink-0 ml-3" onClick={e => e.stopPropagation()}>
          {onUpdateMeta && (
            <select
              value={doc.documentType ?? 'other'}
              onChange={e => onUpdateMeta(doc.id, { documentType: e.target.value })}
              className="text-[11px] border border-line rounded px-2 py-1 bg-surface text-ink focus:outline-none focus:border-ink cursor-pointer"
            >
              {DOC_TYPES.map(t => (<option key={t.value} value={t.value}>{t.label}</option>))}
            </select>
          )}
          {onRename && (
            <button onClick={startRename} aria-label="Rename" className="w-7 h-7 rounded flex items-center justify-center text-muted hover:text-ink hover:bg-canvas border-0 bg-transparent cursor-pointer">
              <Pencil size={13} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => { if (confirm(`Delete ${display}?`)) onDelete(doc.id) }}
              aria-label="Delete"
              className="w-7 h-7 rounded flex items-center justify-center text-danger hover:bg-red-50 border-0 bg-transparent cursor-pointer"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
