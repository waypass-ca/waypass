/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect, useRef } from 'react'
import { Folder, FileText, File, Check, X, ChevronRight, Download, MoreHorizontal, Plus } from 'lucide-react'
import { supabase } from '../../lib/supabase.js'
import { makeDocDragImage } from '../../lib/dragImage.js'

// Shared global to track genuine drags (prevents accidental drops on click)
export let activeDragDocId = null
export function setActiveDragDocId(v) { activeDragDocId = v }

export const STATUS_CONFIG = {
  pending:     { label: 'Pending',     dot: 'bg-warning', text: 'text-warning', tint: 'bg-warning-light', border: 'border-warning/30' },
  in_progress: { label: 'In Progress', dot: 'bg-info',    text: 'text-info',    tint: 'bg-info-tint',     border: 'border-info/30'    },
  complete:    { label: 'Complete',    dot: 'bg-primary',  text: 'text-primary',  tint: 'bg-primary-light',  border: 'border-primary/30'  },
}

export const DOC_TYPES = ['Death Certificate', 'Authorization', 'Certificate', 'Permit', 'Agreement', 'Invoice', 'Receipt']

export const CATEGORY_TABS = [
  { id: 'all',         label: 'All' },
  { id: 'pending',     label: 'Pending' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'complete',    label: 'Complete' },
]

export function inferDocType(name = '') {
  const n = name.toLowerCase()
  if (n.includes('death cert') || n.includes('death_cert'))      return 'Death Certificate'
  if (n.includes('authorization') || n.includes('authorisation')) return 'Authorization'
  if (n.includes('certificate') || n.includes('cert'))            return 'Certificate'
  if (n.includes('permit'))                                        return 'Permit'
  if (n.includes('agreement') || n.includes('contract'))          return 'Agreement'
  if (n.includes('invoice') || n.includes('inv-'))                return 'Invoice'
  if (n.includes('receipt'))                                       return 'Receipt'
  return 'Document'
}

export function formatDate(raw) {
  if (!raw || raw === '—') return '—'
  const d = new Date(raw)
  if (isNaN(d)) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function inferDocStatus(caseStatus) {
  if (caseStatus === 'complete') return 'complete'
  if (caseStatus === 'pending')  return 'pending'
  return 'in_progress'
}

export function casesToDocs(cases = []) {
  return cases.flatMap(c =>
    (c.documents ?? []).map(d => {
      if (typeof d === 'string') {
        const ext = d.includes('.') ? d.split('.').pop().toUpperCase() : 'FILE'
        return {
          id: `${c.id}_${d}`,
          name: d.replace(/\.[^.]+$/, ''),
          fullName: d,
          type: inferDocType(d),
          case: c.deceased ?? c.family ?? 'Unknown',
          caseId: c.id,
          uploadedAt: '—',
          ext, size: '—',
          status: inferDocStatus(c.status),
          path: null,
          dbFolderId: null,
          structuredId: null,
          legacyName: d,
        }
      }
      if (d.id) {
        const name = d.file_name ?? 'Document'
        const path = d.storage_path ?? null
        const ext  = name.includes('.') ? name.split('.').pop().toUpperCase() : 'FILE'
        return {
          id: d.id,
          name: name.replace(/\.[^.]+$/, ''),
          fullName: name,
          type: d.document_type ?? inferDocType(name),
          case: c.deceased ?? c.family ?? 'Unknown',
          caseId: c.id,
          uploadedAt: formatDate(d.uploaded_at),
          ext, size: '—',
          status: d.status ?? inferDocStatus(c.status),
          path,
          dbFolderId: d.folder_id ?? null,
          structuredId: d.id,
          legacyName: null,
        }
      }
      const name = d.name ?? d.path ?? 'Document'
      const path = d.path ?? null
      const ext  = name.includes('.') ? name.split('.').pop().toUpperCase() : 'FILE'
      return {
        id: path ?? `${c.id}_${name}`,
        name: name.replace(/\.[^.]+$/, ''),
        fullName: name,
        type: d.type ? inferDocType(d.type) : inferDocType(name),
        case: c.deceased ?? c.family ?? 'Unknown',
        caseId: c.id,
        uploadedAt: formatDate(d.uploadedAt),
        ext, size: '—',
        status: inferDocStatus(c.status),
        path,
        dbFolderId: d.folderId ?? null,
        structuredId: null,
        legacyName: name,
      }
    })
  )
}

export function filterByDate(docs, preset) {
  if (!preset) return docs
  const now = new Date()
  const cutoff = new Date(now)
  if (preset === '7d')  cutoff.setDate(now.getDate() - 7)
  if (preset === '30d') cutoff.setDate(now.getDate() - 30)
  if (preset === '3m')  cutoff.setMonth(now.getMonth() - 3)
  if (preset === '1y')  cutoff.setFullYear(now.getFullYear() - 1)
  return docs.filter(d => new Date(d.uploadedAt) >= cutoff)
}

export async function openDoc(path) {
  if (!path) return
  const { data, error } = await supabase.storage.from('case-documents').createSignedUrl(path, 60)
  if (!error && data?.signedUrl) window.open(data.signedUrl, '_blank')
}

export function StatusBadge({ status }) {
  const s = STATUS_CONFIG[status] || STATUS_CONFIG.pending
  return (
    <span className={`inline-flex items-center gap-1.5 px-4 py-0.5 rounded-full border text-[11px] font-sans font-medium ${s.tint} ${s.text} ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}

export function FileIcon({ ext, size = 'md' }) {
  const dim = size === 'sm' ? 'w-7 h-9' : 'w-9 h-11'
  const txt = size === 'sm' ? 'text-[7px]' : 'text-[8px]'
  return (
    <div className={`${dim} relative flex-shrink-0`}>
      <div className="absolute inset-0 bg-primary-light border border-primary/20 rounded-sm" />
      <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-canvas border-l border-b border-primary/20 rounded-bl-sm" />
      <div className={`absolute bottom-1.5 left-0 right-0 text-center font-sans font-bold ${txt} text-primary/70 tracking-wider`}>{ext}</div>
    </div>
  )
}

export function DocFolderCard({ folder, count, onClick, onDelete, onDragOver, onDragLeave, onDrop, isDragOver }) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onClick}
      className={`group relative bg-white border rounded-xl overflow-hidden cursor-pointer transition
        hover:shadow-[0_6px_18px_-10px_rgba(28,28,30,0.15)] hover:-translate-y-0.5
        ${isDragOver ? 'border-primary ring-2 ring-primary/20 -translate-y-0.5 shadow-[0_6px_18px_-10px_rgba(28,28,30,0.15)]' : 'border-line'}`}>
      <div className="h-[72px] bg-canvas flex items-center justify-center">
        <Folder size={40} className="text-primary/40" strokeWidth={1.5} />
      </div>
      <div className="px-3 py-2.5">
        <div className="font-sans text-[12.5px] font-medium text-ink truncate">{folder.name}</div>
        <div className="font-sans text-[11px] text-muted mt-0.5">{count} {count === 1 ? 'document' : 'documents'}</div>
      </div>
      <button
        onClick={e => { e.stopPropagation(); onDelete(folder.id) }}
        className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-ink text-surface flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-danger">
        <X size={10} />
      </button>
    </div>
  )
}

export function DocNewFolderCard({ onAdd }) {
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
      <div className="bg-white border border-dashed border-ink/25 rounded-xl overflow-hidden">
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
      className="bg-white border border-dashed border-line rounded-xl overflow-hidden hover:border-secondary/50 hover:bg-canvas/30 transition-colors cursor-pointer w-full text-left">
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

export function DocMenu({ doc, onPreview, up = false, folders = [], onMoveToFolder, onCreateAndMove }) {
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
    onCreateAndMove?.(doc.id, newFolderName.trim())
    setNewFolderName(''); setAddingFolder(false); setOpen(false)
  }

  return (
    <div ref={ref} className="relative" onClick={e => e.stopPropagation()}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
        className={`w-7 h-7 rounded-md flex items-center justify-center hover:bg-canvas text-muted cursor-pointer transition-colors
          ${open ? 'bg-canvas text-ink' : ''}`}>
        <MoreHorizontal size={13} />
      </button>

      {open && (
        <div
          onClick={e => e.stopPropagation()}
          className={`absolute ${up ? 'bottom-[calc(100%+12px)]' : 'top-[calc(100%+4px)]'} z-50 w-48 bg-white border border-line rounded-xl shadow-[0_8px_24px_-4px_rgba(28,28,30,0.14)] overflow-hidden right-0`}>
          <button
            onClick={() => { setOpen(false); onPreview(doc) }}
            className="w-full px-3 py-2.5 text-left font-sans text-[12.5px] text-ink hover:bg-canvas flex items-center gap-2.5 cursor-pointer transition-colors">
            Open
          </button>

          <div className="h-px bg-line mx-2" />
          <div className="px-3 pt-2 pb-0.5 font-sans text-[10.5px] uppercase tracking-[0.1em] text-muted">Move to</div>

          {folders.map(f => (
            <button key={f.id}
              onClick={() => { onMoveToFolder?.(doc.id, f.id); setOpen(false) }}
              className="w-full px-3 py-1.5 text-left font-sans text-[12.5px] text-ink hover:bg-canvas cursor-pointer transition-colors flex items-center gap-2">
              <Folder size={12} className="text-secondary shrink-0" />
              <span className="flex-1 truncate">{f.name}</span>
              {doc._folderId === f.id && <Check size={11} className="text-primary shrink-0" />}
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

          {doc._folderId && (
            <>
              <div className="h-px bg-line mx-2 mt-0.5" />
              <button
                onClick={() => { onMoveToFolder?.(doc.id, null); setOpen(false) }}
                className="w-full px-3 py-2 text-left font-sans text-[12.5px] text-secondary hover:bg-canvas cursor-pointer transition-colors flex items-center gap-2">
                <X size={12} className="shrink-0" />
                Remove from folder
              </button>
            </>
          )}

          <div className="h-px bg-line mx-2 mt-0.5" />
          <button
            onClick={() => { setOpen(false) }}
            className="w-full px-3 py-2.5 text-left font-sans text-[12.5px] text-danger hover:bg-danger-tint flex items-center gap-2.5 cursor-pointer transition-colors">
            Delete
          </button>
        </div>
      )}
    </div>
  )
}

export function DocCard({ d, selected, toggleSelect, onPreview, docFolders, onMoveToFolder, onCreateAndMove }) {
  return (
    <div
      draggable
      onDragStart={e => {
        activeDragDocId = d.id
        e.dataTransfer.setData('docId', d.id)
        e.dataTransfer.setDragImage(makeDocDragImage(d.name, d.ext), 20, 20)
      }}
      onDragEnd={() => { activeDragDocId = null }}
      onClick={() => onPreview(d)}
      className={`relative bg-white rounded-xl border p-4 cursor-pointer group transition-all
        ${selected.has(d.id) ? 'border-ink ring-1 ring-ink' : 'border-line hover:border-secondary/50 hover:shadow-sm'}`}>
      <div
        onClick={e => { e.stopPropagation(); toggleSelect(d.id) }}
        className={`absolute top-3 left-3 w-4 h-4 rounded border flex items-center justify-center transition cursor-pointer
          ${selected.has(d.id) ? 'border-ink bg-ink' : 'border-line bg-white opacity-0 group-hover:opacity-100'}`}>
        {selected.has(d.id) && <Check size={10} className="text-surface" />}
      </div>

      <div className="flex justify-center">
        <FileIcon ext={d.ext} />
      </div>

      <div className="mt-3 min-w-0">
        <p className="font-sans text-[13px] font-medium text-ink truncate">{d.name}</p>
        <p className="font-sans text-[11.5px] text-muted mt-0.5 truncate">{d.case}</p>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <StatusBadge status={d.status} />
        <span className="font-sans text-[10.5px] text-muted">{d.uploadedAt}</span>
      </div>

      <div className="absolute top-3 right-3 flex opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={e => { e.stopPropagation(); openDoc(d.path) }}
          title="Download"
          className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-canvas text-muted cursor-pointer transition-colors">
          <Download size={12} />
        </button>
        <DocMenu doc={d} onPreview={onPreview} folders={docFolders} onMoveToFolder={onMoveToFolder} onCreateAndMove={onCreateAndMove} />
      </div>
    </div>
  )
}

export function DocsSelectionBar({ count, clear }) {
  return (
    <div className="px-6 py-2 bg-ink text-surface flex items-center justify-between gap-2 shrink-0">
      <div className="flex items-center gap-3">
        <button onClick={clear} className="w-5 h-5 rounded border border-surface/30 flex items-center justify-center hover:bg-surface/10 cursor-pointer">
          <X size={12} />
        </button>
        <span className="font-sans text-[12.5px]">{count} selected</span>
      </div>
      <div className="flex items-center gap-1">
        {['Download', 'Archive', 'Delete'].map(a => (
          <button key={a} className="h-7 px-2.5 rounded-md font-sans text-[11.5px] text-surface/85 hover:bg-surface/10 cursor-pointer">{a}</button>
        ))}
      </div>
    </div>
  )
}

export function DocsStatusFooter({ count, selected, pageSize, setPageSize, page, totalPages, onPrev, onNext }) {
  const start = count === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, count)
  return (
    <div className="px-4 h-9 border-t border-line bg-surface flex items-center justify-between gap-4 font-sans text-[11px] text-muted shrink-0">
      <div className="shrink-0">
        {count} {count === 1 ? 'document' : 'documents'}
        {selected > 0 ? ` · ${selected} selected` : ''}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <span>Show</span>
          <select
            value={pageSize}
            onChange={e => setPageSize(Number(e.target.value))}
            className="font-sans text-[11px] text-ink bg-surface border border-line rounded px-1.5 py-0.5 outline-none cursor-pointer focus:border-ink/50 transition">
            {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
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

      <div className="flex items-center gap-1.5 shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Connected
      </div>
    </div>
  )
}

export function DocsEmpty() {
  return (
    <div className="py-20 text-center">
      <FileText size={32} className="mx-auto text-muted/40 mb-3" />
      <p className="font-display text-[17px] text-secondary">No documents here</p>
      <p className="font-sans text-[12px] text-muted mt-1">Try a different category or adjust your search.</p>
    </div>
  )
}
