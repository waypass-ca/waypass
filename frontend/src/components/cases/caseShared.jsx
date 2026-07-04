/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect, useRef } from 'react'
import { Folder, FileText, Star, Phone, Check, Plus, X, MoreHorizontal, Home, Clock, AlertTriangle, Users, ChevronRight } from 'lucide-react'

export const STATUS = {
  pending:   { label: 'Pending',   dot: 'bg-warning', text: 'text-warning', tint: 'bg-warning-light', border: 'border-warning/30' },
  transit:   { label: 'In Transit', dot: 'bg-info',   text: 'text-info',   tint: 'bg-info-tint',    border: 'border-info/30' },
  cremation: { label: 'Cremation', dot: 'bg-danger',  text: 'text-danger', tint: 'bg-danger-tint',  border: 'border-danger/30' },
  complete:  { label: 'Complete',  dot: 'bg-primary', text: 'text-primary', tint: 'bg-primary-light', border: 'border-primary/30' },
}

export const PKG_TINT = {
  Essential: { ring: 'ring-muted/20',   bg: 'bg-canvas',       dot: 'bg-muted' },
  Comfort:   { ring: 'ring-warning/20', bg: 'bg-warning-light', dot: 'bg-warning' },
  Tribute:   { ring: 'ring-primary/20', bg: 'bg-primary-light', dot: 'bg-primary' },
}

export function calcAge(dob, dop) {
  if (!dob || !dop) return null
  const birth = new Date(dob)
  const death = new Date(dop)
  if (isNaN(birth) || isNaN(death)) return null
  let age = death.getFullYear() - birth.getFullYear()
  const m = death.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && death.getDate() < birth.getDate())) age--
  return age
}

export const StarFilled = ({ size = 14, className = '' }) => (
  <Star size={size} className={`[&_*]:fill-current [&_*]:stroke-current ${className}`} />
)

export const StatusDot = ({ cls }) => <span className={`w-2 h-2 rounded-full ${cls} inline-block shrink-0`} />

export function PackageChip({ pkg }) {
  const t = PKG_TINT[pkg] || PKG_TINT.Essential
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full ring-1 ${t.ring} ${t.bg} font-sans text-[11px] text-secondary shrink-0`}>
      <span className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />
      {pkg}
    </span>
  )
}

export function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.pending
  return (
    <span className={`inline-flex items-center gap-1.5 font-sans text-[11.5px] font-medium ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}

export function InfoRow({ label, value, sub }) {
  return (
    <div>
      <div className="font-sans text-[10.5px] uppercase tracking-[0.1em] text-muted mb-1">{label}</div>
      <div className="font-sans text-[13px] text-ink">{value}</div>
      {sub && <div className="font-sans text-[11px] text-muted mt-0.5">{sub}</div>}
    </div>
  )
}

export function CaseMenu({ c, onViewCase, userFolders, onMoveToFolder, onCreateAndMove, up = false, triggerClassName }) {
  const [open, setOpen] = useState(false)
  const [addingFolder, setAddingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const ref = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const h = e => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false); setAddingFolder(false); setNewFolderName('')
      }
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  useEffect(() => { if (addingFolder) inputRef.current?.focus() }, [addingFolder])

  function submitNewFolder(e) {
    e?.preventDefault()
    if (!newFolderName.trim()) return
    onCreateAndMove(c.id, newFolderName.trim())
    setNewFolderName(''); setAddingFolder(false); setOpen(false)
  }

  return (
    <div ref={ref} className="relative" onClick={e => e.stopPropagation()}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
        className={triggerClassName ?? `w-6 h-6 rounded-md flex items-center justify-center text-muted cursor-pointer transition-colors ${open ? 'bg-canvas text-ink' : 'hover:bg-canvas'}`}>
        <MoreHorizontal size={13} />
      </button>

      {open && (
        <div className={`absolute ${up ? 'bottom-[calc(100%+4px)]' : 'top-[calc(100%+4px)]'} right-0 z-50 w-48 bg-white border border-line rounded-xl shadow-[0_8px_24px_-4px_rgba(28,28,30,0.14)] overflow-hidden`}>
          <button
            onClick={() => { setOpen(false); onViewCase(c.id) }}
            className="w-full px-3 py-2.5 text-left font-sans text-[12.5px] text-ink hover:bg-canvas cursor-pointer transition-colors">
            Open
          </button>

          <div className="h-px bg-line mx-2" />
          <div className="px-3 pt-2 pb-0.5 font-sans text-[10.5px] uppercase tracking-[0.1em] text-muted">Move to</div>

          {userFolders.map(f => (
            <button key={f.id}
              onClick={() => { onMoveToFolder(c.id, f.id); setOpen(false) }}
              className="w-full px-3 py-1.5 text-left font-sans text-[12.5px] text-ink hover:bg-canvas cursor-pointer transition-colors flex items-center gap-2">
              <Folder size={12} className="text-secondary shrink-0" />
              <span className="flex-1 truncate">{f.name}</span>
              {c.folderId === f.id && <Check size={11} className="text-primary shrink-0" />}
            </button>
          ))}

          {addingFolder ? (
            <form onSubmit={submitNewFolder} className="px-3 py-1.5">
              <input
                ref={inputRef}
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                onBlur={submitNewFolder}
                onKeyDown={e => { if (e.key === 'Escape') { setAddingFolder(false); setNewFolderName('') } }}
                placeholder="Folder name…"
                className="w-full text-[12px] font-sans rounded border border-ink/30 outline-none bg-white px-2 py-1 text-ink placeholder:text-muted"
              />
            </form>
          ) : (
            <button
              onClick={() => setAddingFolder(true)}
              className="w-full px-3 py-1.5 text-left font-sans text-[12.5px] text-secondary hover:bg-canvas cursor-pointer transition-colors flex items-center gap-2">
              <Plus size={12} className="shrink-0" />
              New Folder
            </button>
          )}

          {c.folderId && (
            <>
              <div className="h-px bg-line mx-2 mt-0.5" />
              <button
                onClick={() => { onMoveToFolder(c.id, null); setOpen(false) }}
                className="w-full px-3 py-2 text-left font-sans text-[12.5px] text-secondary hover:bg-canvas cursor-pointer transition-colors flex items-center gap-2">
                <X size={12} className="shrink-0" />
                Remove from folder
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export function FolderCard({ folder, count, onClick, onDelete, onDragOver, onDragLeave, onDrop, isDragOver }) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onClick}
      className={`group relative bg-white border rounded-lg overflow-hidden cursor-pointer transition
        hover:shadow-[0_6px_18px_-10px_rgba(28,28,30,0.15)] hover:-translate-y-0.5
        ${isDragOver ? 'border-primary ring-2 ring-primary/20 -translate-y-0.5 shadow-[0_6px_18px_-10px_rgba(28,28,30,0.15)]' : 'border-line'}`}>
      <div className="h-[72px] bg-canvas flex items-center justify-center">
        <Folder size={40} className="text-primary/40" strokeWidth={1.5} />
      </div>
      <div className="px-3 py-2.5">
        <div className="font-sans text-[12.5px] font-medium text-ink truncate">{folder.name}</div>
        <div className="font-sans text-[11px] text-muted mt-0.5">{count} {count === 1 ? 'case' : 'cases'}</div>
      </div>
      <button
        onClick={e => { e.stopPropagation(); onDelete(folder.id) }}
        className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-ink text-surface flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-danger">
        <X size={10} />
      </button>
    </div>
  )
}

export function NewFolderCard({ onAdd }) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const ref = useRef(null)
  useEffect(() => { if (adding) ref.current?.focus() }, [adding])

  function submit() {
    if (name.trim()) onAdd(name.trim())
    setName(''); setAdding(false)
  }

  if (adding) {
    return (
      <div className="bg-white border border-dashed border-ink/25 rounded-lg overflow-hidden">
        <div className="h-[72px] bg-canvas flex items-center justify-center">
          <Folder size={40} className="text-muted/30" strokeWidth={1.5} />
        </div>
        <div className="px-3 py-2.5">
          <input
            ref={ref}
            value={name}
            onChange={e => setName(e.target.value)}
            onBlur={submit}
            onKeyDown={e => {
              if (e.key === 'Enter') submit()
              if (e.key === 'Escape') { setAdding(false); setName('') }
            }}
            placeholder="Folder name"
            className="w-full text-[12.5px] font-sans rounded border border-ink/30 outline-none bg-white px-2 py-0.5 text-ink placeholder:text-muted"
          />
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setAdding(true)}
      className="bg-white border border-dashed border-line rounded-lg overflow-hidden hover:border-secondary/50 hover:bg-canvas/30 transition-colors cursor-pointer w-full text-left">
      <div className="h-[72px] flex items-center justify-center">
        <Plus size={22} className="text-muted/50" />
      </div>
      <div className="px-3 py-2.5">
        <div className="font-sans text-[12.5px] text-muted">New Folder</div>
        <div className="font-sans text-[11px] text-muted/50 mt-0.5">Click to create</div>
      </div>
    </button>
  )
}

export function CasePreviewBody({ c, onViewCase, isStarred, userFolders = [], onMoveToFolder, onCreateAndMove }) {
  const s = STATUS[c.status] || STATUS.pending
  const age = calcAge(c.dob, c.dop)
  const docs = c.documents || []
  const notes = c.notes || []

  return (
    <div className="flex-1">
      <div className={`px-6 pt-6 pb-5 ${s.tint} border-b ${s.border}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-mono text-[10.5px] text-muted mb-1.5">{c.id}</div>
            <h2 className="font-display text-[26px] text-ink leading-tight">{c.deceased}</h2>
            <div className="font-sans text-[12.5px] text-secondary mt-0.5">
              {c.family}{age != null ? ` · Age ${age}` : ''}
            </div>
          </div>
          {isStarred && isStarred(c.id) && <StarFilled size={16} className="text-warning shrink-0 mt-1" />}
        </div>
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <StatusBadge status={c.status} />
          <span className="text-muted">·</span>
          <PackageChip pkg={c.package} />
        </div>
      </div>

      <div className="p-6 space-y-5">
        {c.contactName && <InfoRow label="Primary contact" value={c.contactName} sub={c.relationship} />}
        {c.location && <InfoRow label="Location" value={c.location} />}
        <InfoRow label="Crematorium" value={c.crematorium || <span className="italic text-muted">Unassigned</span>} />
        <InfoRow label="Opened" value={c.date} />
        <InfoRow label="Amount" value={<span className="font-medium">${c.amount.toLocaleString()}</span>} />
      </div>

      <div className="px-6 pb-6">
        <div className="font-sans text-[11px] uppercase tracking-[0.1em] text-muted mb-2.5">Documents</div>
        <div className="space-y-1.5">
          {docs.length > 0 ? docs.map((doc, i) => {
            const name = typeof doc === 'string' ? doc : (doc?.name || doc?.path || 'Document')
            const ext = name.split('.').pop()?.toUpperCase() || 'FILE'
            return (
              <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-md border border-line bg-canvas/40 hover:bg-canvas cursor-pointer transition-colors">
                <FileText size={14} className="text-secondary shrink-0" />
                <span className="font-sans text-[12px] text-secondary flex-1 truncate">{name}</span>
                <span className="font-sans text-[10.5px] text-muted shrink-0">{ext}</span>
              </div>
            )
          }) : <div className="font-sans text-[12px] text-muted italic">No documents yet</div>}
        </div>
      </div>

      <div className="px-6 pb-6">
        <div className="font-sans text-[11px] uppercase tracking-[0.1em] text-muted mb-2.5">Activity</div>
        {notes.length > 0 ? (
          <div className="space-y-3">
            {notes.map((note, i) => (
              <div key={i} className="flex gap-2.5">
                <div className="w-6 h-6 rounded-full bg-primary-light flex items-center justify-center shrink-0 mt-0.5">
                  <span className="font-sans text-[10px] text-primary font-medium">
                    {note.author.split(' ').map(p => p[0]).join('').slice(0, 2)}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="font-sans text-[12px] text-ink leading-snug">{note.text}</div>
                  <div className="font-sans text-[10.5px] text-muted mt-0.5">{note.author} · {note.time}</div>
                </div>
              </div>
            ))}
          </div>
        ) : <div className="font-sans text-[12px] text-muted italic">No activity yet</div>}
      </div>

      {onViewCase && (
        <div className="sticky bottom-0 px-6 py-3 bg-surface border-t border-line flex gap-2">
          <button onClick={() => onViewCase(c.id)}
            className="flex-1 h-9 rounded-lg bg-ink hover:bg-ink/90 text-surface font-sans text-[12.5px] font-medium cursor-pointer transition-colors">
            Open case
          </button>
          {c.contactPhone && (
            <button className="h-9 px-3 rounded-lg border border-line hover:bg-canvas font-sans text-[12.5px] text-secondary cursor-pointer flex items-center gap-1.5 transition-colors">
              <Phone size={13} /> Call
            </button>
          )}
          <div className="h-9 flex items-center">
            <CaseMenu c={c} onViewCase={onViewCase} userFolders={userFolders} onMoveToFolder={onMoveToFolder} onCreateAndMove={onCreateAndMove} up />
          </div>
        </div>
      )}
    </div>
  )
}

export function SelectionBar({ count, clear }) {
  return (
    <div className="px-6 py-2 bg-ink text-surface flex items-center justify-between gap-2 shrink-0">
      <div className="flex items-center gap-3">
        <button onClick={clear} className="w-5 h-5 rounded border border-surface/30 flex items-center justify-center hover:bg-surface/10 cursor-pointer">
          <X size={12} />
        </button>
        <span className="font-sans text-[12.5px]">{count} selected</span>
      </div>
      <div className="flex items-center gap-1">
        {['Assign', 'Export', 'Archive'].map(a => (
          <button key={a} className="h-7 px-2.5 rounded-md font-sans text-[11.5px] text-surface/85 hover:bg-surface/10 cursor-pointer">{a}</button>
        ))}
      </div>
    </div>
  )
}

export function StatusFooter({ count, selected, pageSize, setPageSize, page, totalPages, onPrev, onNext, showPagination }) {
  const start = count === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, count)
  return (
    <div className="px-4 h-9 border-t border-line bg-surface flex items-center justify-between gap-4 font-sans text-[11px] text-muted shrink-0">
      <div className="shrink-0">
        {count} {count === 1 ? 'case' : 'cases'}
        {selected > 0 ? ` · ${selected} selected` : ''}
      </div>

      {showPagination && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={e => setPageSize(Number(e.target.value))}
              className="font-sans text-[11px] text-ink bg-surface border border-line rounded px-1.5 py-0.5 outline-none cursor-pointer focus:border-ink/50 transition">
              {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <span>per page</span>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button onClick={onPrev} disabled={page === 1}
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-canvas disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors">
                <ChevronRight size={12} className="rotate-180" />
              </button>
              <span className="tabular-nums">{start}–{end} of {count}</span>
              <button onClick={onNext} disabled={page === totalPages}
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-canvas disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors">
                <ChevronRight size={12} />
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-1.5 shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Connected
      </div>
    </div>
  )
}

export const SMART_FOLDERS = [
  { id: 'all',             label: 'Cases',           icon: <Home size={13} />,          tint: null },
  { id: 'recent',          label: 'Active',          icon: <Clock size={13} />,         tint: null },
  { id: 'starred',         label: 'Starred',         icon: <StarFilled size={13} />,    tint: 'text-warning' },
  { id: 'needs-attention', label: 'Needs Attention', icon: <AlertTriangle size={13} />, tint: 'text-danger' },
  { id: 'unassigned',      label: 'Unassigned',      icon: <Users size={13} />,         tint: null },
  { id: 'pending',         label: 'Pending',         icon: <StatusDot cls="bg-warning" />, tint: null },
  { id: 'transit',         label: 'In Transit',      icon: <StatusDot cls="bg-info" />,    tint: null },
  { id: 'cremation',       label: 'At Cremation',    icon: <StatusDot cls="bg-danger" />,  tint: null },
  { id: 'complete',        label: 'Complete',        icon: <StatusDot cls="bg-primary" />, tint: null },
]

export const SMART_FOLDER_IDS = new Set(SMART_FOLDERS.map(f => f.id))
