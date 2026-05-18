import { useState, useMemo, useRef, useEffect } from 'react'
import {
  Search, Filter, List, Grid2x2, Columns2, Check, X, ChevronRight,
  Download, MoreHorizontal, FileText, File, Folder, Plus,
} from 'lucide-react'
import { PageTitle } from '../layout/PageTitle'
import { supabase } from '../../lib/supabase.js'
import { DocumentPreviewModal } from '../ui/DocumentPreviewModal'
import { fetchFolders, createFolder, deleteFolder } from '../../lib/api.js'
import { makeDocDragImage } from '../../lib/dragImage.js'

// ─── Config ───────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending:     { label: 'Pending',     dot: 'bg-warning', text: 'text-warning', tint: 'bg-warning-light', border: 'border-warning/30' },
  in_progress: { label: 'In Progress', dot: 'bg-info',    text: 'text-info',    tint: 'bg-info-tint',     border: 'border-info/30'    },
  complete:    { label: 'Complete',    dot: 'bg-primary',  text: 'text-primary',  tint: 'bg-primary-light',  border: 'border-primary/30'  },
}

const DOC_TYPES = ['Death Certificate', 'Authorization', 'Certificate', 'Permit', 'Agreement', 'Invoice', 'Receipt']

const CATEGORY_TABS = [
  { id: 'all',         label: 'All' },
  { id: 'pending',     label: 'Pending' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'complete',    label: 'Complete' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function inferDocType(name = '') {
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

function inferDocStatus(caseStatus) {
  if (caseStatus === 'complete') return 'complete'
  if (caseStatus === 'pending')  return 'pending'
  return 'in_progress'
}

function casesToDocs(cases = []) {
  return cases.flatMap(c =>
    (c.documents ?? []).map(d => {
      const name    = typeof d === 'string' ? d : (d.name ?? d.path ?? 'Document')
      const path    = typeof d === 'string' ? null : d.path
      const rawName = name.replace(/\.[^.]+$/, '')
      const ext     = name.includes('.') ? name.split('.').pop().toUpperCase() : 'FILE'
      return {
        id:         path ?? `${c.id}_${name}`,
        name:       rawName,
        fullName:   name,
        type:       inferDocType(name),
        case:       c.deceased ?? c.family ?? 'Unknown',
        caseId:     c.id,
        uploadedAt: d.uploadedAt ?? '—',
        ext,
        size:       '—',
        status:     inferDocStatus(c.status),
        path,
      }
    })
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const s = STATUS_CONFIG[status] || STATUS_CONFIG.pending
  return (
    <span className={`inline-flex items-center gap-1.5 px-4 py-0.5 rounded-full border text-[11px] font-sans font-medium ${s.tint} ${s.text} ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}

function FileIcon({ ext, size = 'md' }) {
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

// ─── Date filtering ───────────────────────────────────────────────────────────
function filterByDate(docs, preset) {
  if (!preset) return docs
  const now = new Date()
  const cutoff = new Date(now)
  if (preset === '7d')  cutoff.setDate(now.getDate() - 7)
  if (preset === '30d') cutoff.setDate(now.getDate() - 30)
  if (preset === '3m')  cutoff.setMonth(now.getMonth() - 3)
  if (preset === '1y')  cutoff.setFullYear(now.getFullYear() - 1)
  return docs.filter(d => new Date(d.uploadedAt) >= cutoff)
}

// ─── Doc folder card (Apple-style) ───────────────────────────────────────────
function DocFolderCard({ folder, count, onClick, onDelete, onDragOver, onDragLeave, onDrop, isDragOver }) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onClick}
      className={`group relative bg-white border rounded-xl overflow-hidden cursor-pointer transition
        hover:shadow-[0_6px_18px_-10px_rgba(28,28,30,0.15)] hover:-translate-y-0.5
        ${isDragOver ? 'border-primary ring-2 ring-primary/20 -translate-y-0.5 shadow-[0_6px_18px_-10px_rgba(28,28,30,0.15)]' : 'border-line'}`}>
      <div className="h-[72px] bg-primary-light/50 flex items-center justify-center relative">
        <div className="absolute top-0 left-4 w-9 h-3 bg-primary/25 rounded-t-[5px]" />
        <div className="absolute top-[11px] inset-x-4 bottom-2.5 bg-primary/20 rounded-[6px] border border-primary/15 flex items-center justify-center">
          {count > 0 && (
            <span className="font-display text-[20px] text-primary/40 leading-none select-none">{count}</span>
          )}
        </div>
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

function DocNewFolderCard({ onAdd }) {
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
        <div className="h-[72px] bg-canvas/60 flex items-center justify-center relative">
          <div className="absolute top-0 left-4 w-9 h-3 bg-muted/20 rounded-t-[5px]" />
          <div className="absolute top-[11px] inset-x-4 bottom-2.5 bg-muted/10 rounded-[6px] border border-muted/15" />
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

// ─── TopBar ───────────────────────────────────────────────────────────────────
function TopBar({ search, setSearch, view, setView, sortBy, setSortBy,
  count, total, filters, setFilters, filtersActive }) {
  const [filterOpen, setFilterOpen] = useState(false)
  const filterRef = useRef(null)

  useEffect(() => {
    if (!filterOpen) return
    const h = e => { if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [filterOpen])

  const toggleSet = (key, val) => setFilters(f => {
    const s = new Set(f[key])
    s.has(val) ? s.delete(val) : s.add(val)
    return { ...f, [key]: s }
  })
  const clearAll = () => setFilters({ types: new Set(), statuses: new Set(), datePreset: '' })

  return (
    <div className="border-b border-line bg-surface/80 backdrop-blur shrink-0 relative z-10">
      <div className="px-6 pt-6 pb-3 flex items-start justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <PageTitle className="leading-none">Documents</PageTitle>
          <span className="font-sans text-[12.5px] text-muted">{count} of {total}</span>
        </div>
      </div>

      <div className="px-6 pb-3 flex items-center justify-between gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search document name, case, type…"
            className="w-full pl-9 pr-4 h-9 rounded-lg border border-line bg-white text-[13px] text-ink font-sans placeholder:text-muted outline-none focus:border-ink/60 transition" />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 px-2 h-9 rounded-lg border border-line bg-white">
            <span className="font-sans text-[11.5px] text-muted">Sort</span>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="font-sans text-[12.5px] text-ink bg-transparent outline-none cursor-pointer pr-1">
              <option value="date">Date uploaded</option>
              <option value="name">Name</option>
              <option value="case">Case</option>
              <option value="type">Type</option>
            </select>
          </div>

          <div ref={filterRef} className="relative">
            <button onClick={() => setFilterOpen(o => !o)}
              className={`relative h-9 w-9 rounded-lg border bg-white hover:bg-surface flex items-center justify-center cursor-pointer
                ${filterOpen || filtersActive ? 'border-ink text-ink' : 'border-line text-secondary'}`}>
              <Filter size={15} />
              {filtersActive > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-ink text-surface font-sans text-[9px] font-medium flex items-center justify-center">{filtersActive}</span>
              )}
            </button>

            {filterOpen && (
              <div className="absolute right-0 top-[calc(100%+6px)] w-72 bg-surface border border-line rounded-xl shadow-[0_12px_32px_-8px_rgba(28,28,30,0.18)] z-[60] overflow-hidden max-h-[70vh] flex flex-col">
                <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-line shrink-0">
                  <div className="font-sans text-[12px] font-medium text-ink">Filters</div>
                  <button onClick={clearAll}
                    className={`font-sans text-[11px] ${filtersActive ? 'text-danger hover:underline cursor-pointer' : 'text-muted cursor-default'}`}
                    disabled={!filtersActive}>Clear all</button>
                </div>

                <div className="overflow-auto flex-1 bg-white">
                  <div className="px-4 pt-3 pb-3">
                    <div className="font-sans text-[10.5px] uppercase tracking-[0.1em] text-muted mb-2">Status</div>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { id: 'pending',  label: 'Pending',  dot: 'bg-warning' },
                        { id: 'in_progress', label: 'In Progress', dot: 'bg-info'    },
                        { id: 'complete',    label: 'Complete',    dot: 'bg-primary' },
                      ].map(({ id, label, dot }) => {
                        const on = filters.statuses.has(id)
                        return (
                          <button key={id} onClick={() => toggleSet('statuses', id)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-sans text-[11.5px] cursor-pointer transition
                              ${on ? 'border-ink bg-ink text-surface' : 'border-line bg-white text-secondary hover:border-secondary'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${on ? 'bg-surface/60' : dot}`} />
                            {label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="px-4 pb-3 border-t border-line/60 pt-3">
                    <div className="font-sans text-[10.5px] uppercase tracking-[0.1em] text-muted mb-2">Document Type</div>
                    <div className="flex flex-col gap-0.5">
                      {DOC_TYPES.map(t => {
                        const on = filters.types.has(t)
                        return (
                          <label key={t} className="flex items-center gap-2.5 py-1 px-1 rounded hover:bg-canvas/60 cursor-pointer">
                            <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition ${on ? 'border-ink bg-ink' : 'border-line bg-white'}`}>
                              {on && <Check size={11} className="text-surface" />}
                            </span>
                            <input type="checkbox" checked={on} onChange={() => toggleSet('types', t)} className="sr-only" />
                            <span className="font-sans text-[12px] text-ink">{t}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  <div className="px-4 pb-3 border-t border-line/60 pt-3">
                    <div className="font-sans text-[10.5px] uppercase tracking-[0.1em] text-muted mb-2">Date Uploaded</div>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { id: '7d',  label: 'Last 7 days'   },
                        { id: '30d', label: 'Last 30 days'  },
                        { id: '3m',  label: 'Last 3 months' },
                        { id: '1y',  label: 'This year'     },
                      ].map(({ id, label }) => {
                        const on = filters.datePreset === id
                        return (
                          <button key={id}
                            onClick={() => setFilters(f => ({ ...f, datePreset: f.datePreset === id ? '' : id }))}
                            className={`px-2.5 py-1 rounded-full border font-sans text-[11.5px] cursor-pointer transition
                              ${on ? 'border-ink bg-ink text-surface' : 'border-line bg-white text-secondary hover:border-secondary'}`}>
                            {label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <div className="px-4 py-2.5 border-t border-line bg-surface flex items-center justify-between shrink-0">
                  <span className="font-sans text-[11px] text-muted">{filtersActive === 0 ? 'No filters applied' : `${filtersActive} active`}</span>
                  <button onClick={() => setFilterOpen(false)} className="h-7 px-3 rounded-md bg-ink text-surface font-sans text-[11.5px] cursor-pointer">Done</button>
                </div>
              </div>
            )}
          </div>

          <div className="flex bg-canvas border border-line rounded-lg p-0.5 h-9">
            {[
              ['list',    <List size={15} />,    'List'],
              ['grid',    <Grid2x2 size={14} />, 'Grid'],
              ['columns', <Columns2 size={15} />, 'Columns'],
            ].map(([k, icon, label]) => (
              <button key={k} onClick={() => setView(k)} title={label}
                className={`px-2.5 rounded-md font-sans text-[12px] flex items-center gap-1.5 cursor-pointer transition
                  ${view === k ? 'bg-white text-ink shadow-[0_1px_2px_rgba(0,0,0,0.05)]' : 'text-muted hover:text-secondary'}`}>
                {icon}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Doc context menu ─────────────────────────────────────────────────────────
function DocMenu({ doc, onPreview, up = false }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
        className={`w-7 h-7 rounded-md flex items-center justify-center hover:bg-canvas text-muted cursor-pointer transition-colors
          ${open ? 'bg-canvas text-ink' : ''}`}>
        <MoreHorizontal size={13} />
      </button>

      {open && (
        <div
          onClick={e => e.stopPropagation()}
          className={`absolute ${up ? 'bottom-[calc(100%+12px)]' : 'top-[calc(100%+4px)]'} z-50 w-36 bg-white border border-line rounded-xl shadow-[0_8px_24px_-4px_rgba(28,28,30,0.14)] overflow-hidden right-0`}>
          <button
            onClick={() => { setOpen(false); onPreview(doc) }}
            className="w-full px-3 py-2.5 text-left font-sans text-[12.5px] text-ink hover:bg-canvas flex items-center gap-2.5 cursor-pointer transition-colors">
            Open
          </button>
          <button
            onClick={() => { setOpen(false) }}
            className="w-full px-3 py-2.5 text-left font-sans text-[12.5px] text-ink hover:bg-canvas flex items-center gap-2.5 cursor-pointer transition-colors">
            Edit
          </button>
          <div className="h-px bg-line mx-2" />
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

// ─── Selection bar ────────────────────────────────────────────────────────────
function SelectionBar({ count, clear }) {
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

// ─── Footer ───────────────────────────────────────────────────────────────────
function StatusFooter({ count, selected, pageSize, setPageSize, page, totalPages, onPrev, onNext }) {
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

// ─── Empty state ──────────────────────────────────────────────────────────────
function Empty() {
  return (
    <div className="py-20 text-center">
      <FileText size={32} className="mx-auto text-muted/40 mb-3" />
      <p className="font-display text-[17px] text-secondary">No documents here</p>
      <p className="font-sans text-[12px] text-muted mt-1">Try a different category or adjust your search.</p>
    </div>
  )
}

// ─── List view ────────────────────────────────────────────────────────────────
async function openDoc(path) {
  if (!path) return
  const { data, error } = await supabase.storage.from('case-documents').createSignedUrl(path, 60)
  if (!error && data?.signedUrl) window.open(data.signedUrl, '_blank')
}

function ListView({ rows, selected, toggleSelect, selectAll, onPreview }) {
  const allChecked = rows.length > 0 && rows.every(r => selected.has(r.id))

  const Th = ({ children, className = '' }) => (
    <th className={`font-sans text-[10.5px] uppercase tracking-[0.08em] text-muted font-medium text-left px-3 py-2.5 ${className}`}>{children}</th>
  )

  return (
    <div className="bg-white">
        <table className="w-full" style={{ minWidth: 760 }}>
          <colgroup>
            <col style={{ width: 36 }} />
            <col style={{ minWidth: 220 }} />
            <col style={{ width: 160 }} />
            <col style={{ minWidth: 160 }} />
            <col style={{ width: 110 }} />
            <col style={{ width: 90 }} />
            <col style={{ width: 72 }} />
          </colgroup>
          <thead className="bg-white border-b border-line">
            <tr>
              <th className="px-3 py-2.5">
                <button onClick={selectAll} className="w-4 h-4 rounded border border-line bg-white flex items-center justify-center hover:border-secondary cursor-pointer">
                  {allChecked && <Check size={11} className="text-ink" />}
                </button>
              </th>
              <Th>Name</Th>
              <Th>Type</Th>
              <Th>Case</Th>
              <Th>Uploaded</Th>
              <Th>Size</Th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8}><Empty /></td>
              </tr>
            ) : rows.map(d => (
              <tr key={d.id}
                draggable
                onDragStart={e => {
                  e.dataTransfer.setData('docId', d.id)
                  e.dataTransfer.setDragImage(makeDocDragImage(d.name, d.ext), 20, 20)
                }}
                onClick={() => onPreview(d)}
                className={`border-b border-line last:border-b-0 group transition-colors cursor-pointer
                  ${selected.has(d.id) ? 'bg-info-tint/40' : 'hover:bg-canvas/40'}`}>
                <td className="px-3 py-2.5 align-middle">
                  <button onClick={e => { e.stopPropagation(); toggleSelect(d.id) }}
                    className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition
                      ${selected.has(d.id) ? 'border-ink bg-ink' : 'border-line bg-white hover:border-secondary'}`}>
                    {selected.has(d.id) && <Check size={11} className="text-surface" />}
                  </button>
                </td>
                <td className="px-3 py-2.5 align-middle">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileIcon ext={d.ext} size="sm" />
                    <span className="font-sans text-[13px] font-medium text-ink truncate">{d.name}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 align-middle">
                  <span className="font-sans text-[12px] text-secondary">{d.type}</span>
                </td>
                <td className="px-3 py-2.5 align-middle">
                  <span className="font-sans text-[12px] text-secondary truncate block max-w-[200px]">{d.case}</span>
                </td>
                <td className="px-3 py-2.5 align-middle">
                  <span className="font-sans text-[11.5px] text-muted whitespace-nowrap">{d.uploadedAt}</span>
                </td>
                <td className="px-3 py-2.5 align-middle">
                  <span className="font-sans text-[11.5px] text-muted">{d.size}</span>
                </td>
                <td className="px-2 py-2.5 align-middle">
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={e => { e.stopPropagation(); openDoc(d.path) }} title="Download"
                      className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-canvas text-muted cursor-pointer transition-colors">
                      <Download size={13} />
                    </button>
                    <DocMenu doc={d} onPreview={onPreview} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
  )
}

// ─── Doc card ────────────────────────────────────────────────────────────────
function DocCard({ d, selected, toggleSelect, onPreview }) {
  return (
    <div
      draggable
      onDragStart={e => {
        e.dataTransfer.setData('docId', d.id)
        e.dataTransfer.setDragImage(makeDocDragImage(d.name, d.ext), 20, 20)
      }}
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
        <DocMenu doc={d} onPreview={onPreview} />
      </div>
    </div>
  )
}

// ─── Grid view ────────────────────────────────────────────────────────────────
function GridView({ docs, docFolders, docFolderCounts, gridDocFolderView, setGridDocFolderView,
  selected, toggleSelect, onPreview, onAddDocFolder, onDeleteDocFolder,
  docDragOverId, setDocDragOverId, onDocFolderDrop }) {

  const currentFolder = gridDocFolderView ? docFolders.find(f => f.id === gridDocFolderView) : null

  const displayDocs = gridDocFolderView
    ? docs.filter(d => d._folderId === gridDocFolderView)
    : docs.filter(d => !d._folderId)

  const hasFolders = !gridDocFolderView && docFolders.length > 0
  const hasUnfiled = !gridDocFolderView && displayDocs.length > 0

  return (
    <div className="p-4">
      {/* Breadcrumb */}
      {gridDocFolderView && (
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setGridDocFolderView(null)}
            className="flex items-center gap-1 font-sans text-[12.5px] text-muted hover:text-ink cursor-pointer transition-colors">
            <ChevronRight size={13} className="rotate-180" />
            Documents
          </button>
          <ChevronRight size={12} className="text-muted/40" />
          <span className="font-sans text-[12.5px] font-medium text-ink flex items-center gap-1.5">
            <Folder size={13} className="text-secondary" />
            {currentFolder?.name}
          </span>
        </div>
      )}

      {/* Folders section at top level */}
      {!gridDocFolderView && (
        <>
          {hasUnfiled && (
            <div className="font-sans text-[10.5px] uppercase tracking-[0.1em] text-muted mb-3">Folders</div>
          )}
          <div className="grid gap-3 mb-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {docFolders.map(f => (
              <DocFolderCard
                key={f.id}
                folder={f}
                count={docFolderCounts[f.id] ?? 0}
                onClick={() => setGridDocFolderView(f.id)}
                onDelete={onDeleteDocFolder}
                onDragOver={e => { e.preventDefault(); setDocDragOverId(f.id) }}
                onDragLeave={() => setDocDragOverId(null)}
                onDrop={e => onDocFolderDrop(e, f.id)}
                isDragOver={docDragOverId === f.id}
              />
            ))}
            <DocNewFolderCard onAdd={onAddDocFolder} />
          </div>

          {hasUnfiled && (
            <div className="font-sans text-[10.5px] uppercase tracking-[0.1em] text-muted mb-3">Unfiled</div>
          )}
        </>
      )}

      {/* Documents */}
      {displayDocs.length === 0 ? (
        <div className="py-12 text-center">
          <FileText size={32} className="mx-auto text-muted/40 mb-3" />
          <p className="font-display text-[17px] text-secondary">
            {gridDocFolderView ? 'This folder is empty' : 'No unfiled documents'}
          </p>
          <p className="font-sans text-[12px] text-muted mt-1">
            {gridDocFolderView ? 'Drag documents here to add them.' : 'All documents are in folders, or try adjusting your search.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {displayDocs.map(d => (
            <DocCard key={d.id} d={d} selected={selected} toggleSelect={toggleSelect} onPreview={onPreview} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Columns view ─────────────────────────────────────────────────────────────
const COL1_TYPES = [{ id: 'all', label: 'All Types' }, ...DOC_TYPES.map(t => ({ id: t, label: t }))]

function DocDetailPanel({ doc, onPreview }) {
  if (!doc) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-8 text-center">
        <File size={32} className="text-muted/40 mb-3" />
        <div className="font-display text-[18px] text-secondary">Select a document</div>
        <div className="font-sans text-[12px] text-muted mt-1">Choose a document to preview it here.</div>
      </div>
    )
  }
  const s = STATUS_CONFIG[doc.status] || STATUS_CONFIG.pending
  return (
    <div className="flex flex-col h-full">
      <div className={`px-5 pt-5 pb-4 border-b ${s.border} ${s.tint}`}>
        <div className="flex items-start gap-3">
          <div className="w-11 h-14 relative flex-shrink-0 mt-0.5">
            <div className="absolute inset-0 bg-white border border-primary/20 rounded" />
            <div className="absolute top-0 right-0 w-3 h-3 bg-canvas border-l border-b border-primary/20 rounded-bl" />
            <div className="absolute bottom-2 left-0 right-0 text-center font-sans font-bold text-[8px] text-primary/60 tracking-wider">{doc.ext}</div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-sans text-[14px] font-semibold text-ink leading-snug">{doc.name}</p>
            <p className="font-sans text-[11.5px] text-muted mt-0.5">{doc.type}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <StatusBadge status={doc.status} />
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="px-5 py-4 space-y-3.5">
          {[
            ['Case',     doc.case],
            ['Uploaded', doc.uploadedAt],
            ['Size',     doc.size],
            ['Type',     doc.type],
          ].map(([label, value]) => (
            <div key={label}>
              <div className="font-sans text-[10.5px] uppercase tracking-[0.1em] text-muted mb-0.5">{label}</div>
              <div className="font-sans text-[13px] text-ink">{value}</div>
            </div>
          ))}
        </div>

        <div className="px-5 pb-4">
          <div className="font-sans text-[10.5px] uppercase tracking-[0.1em] text-muted mb-2">Activity</div>
          <div className="font-sans text-[12px] text-muted italic">No activity yet</div>
        </div>
      </div>

      <div className="px-5 py-3 border-t border-line flex gap-2 shrink-0">
        <button
          onClick={() => onPreview(doc)}
          className="flex-1 h-9 rounded-lg bg-ink hover:bg-ink/90 text-surface font-sans text-[12.5px] font-medium cursor-pointer transition-colors flex items-center justify-center gap-1.5">
          <FileText size={13} /> Open
        </button>
        <DocMenu doc={doc} onPreview={onPreview} up />
      </div>
    </div>
  )
}

function ColumnsView({ docs, activeDocId, setActiveDocId, onPreview, docFolders, activeDocFolder, setActiveDocFolder, onAddDocFolder, onDeleteDocFolder, onDocFolderDrop, docDragOverId, setDocDragOverId, docFolderCounts }) {
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const inputRef = useRef(null)
  useEffect(() => { if (adding) inputRef.current?.focus() }, [adding])

  function submitAdd() {
    if (newName.trim()) onAddDocFolder(newName.trim())
    setNewName(''); setAdding(false)
  }

  const [colType, setColType] = useState('all')
  const wrapRef = useRef(null)
  const [col1, setCol1] = useState(() => Number(localStorage.getItem('docs-col1')) || 190)
  const [col3, setCol3] = useState(() => Number(localStorage.getItem('docs-col3')) || 340)
  useEffect(() => { localStorage.setItem('docs-col1', col1) }, [col1])
  useEffect(() => { localStorage.setItem('docs-col3', col3) }, [col3])

  const startDrag = (which) => (e) => {
    e.preventDefault()
    const startX = e.clientX
    const start1 = col1, start3 = col3
    const totalW = wrapRef.current?.offsetWidth || 900
    const onMove = (ev) => {
      const dx = ev.clientX - startX
      if (which === 1) {
        const next = Math.max(160, Math.min(320, start1 + dx))
        if (totalW - next - col3 >= 200) setCol1(next)
      } else {
        const next = Math.max(260, Math.min(480, start3 - dx))
        if (totalW - col1 - next >= 200) setCol3(next)
      }
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  const Handle = ({ onMouseDown }) => (
    <div onMouseDown={onMouseDown}
      className="group relative w-px bg-line shrink-0 cursor-col-resize hover:bg-ink/30 transition-colors">
      <div className="absolute inset-y-0 -left-1.5 -right-1.5" />
      <div className="absolute top-1/2 -translate-y-1/2 -left-[3px] w-[7px] h-10 rounded-full opacity-0 group-hover:opacity-100 bg-ink/20 transition-opacity" />
    </div>
  )

  const typeCounts = useMemo(() => {
    const map = { all: docs.length }
    DOC_TYPES.forEach(t => { map[t] = docs.filter(d => d.type === t).length })
    return map
  }, [docs])

  // Col2 items: if a folder is selected show only those docs; otherwise filter by type
  const colDocs = useMemo(() => {
    if (activeDocFolder) return docs.filter(d => d._folderId === activeDocFolder)
    if (colType === 'all') return docs
    return docs.filter(d => d.type === colType)
  }, [docs, activeDocFolder, colType])

  const activeDoc = activeDocId ? docs.find(d => d.id === activeDocId) : null

  return (
    <div className="h-full">
      <div ref={wrapRef} className="bg-white overflow-hidden flex h-full">
        {/* Col 1: Folders + Type sidebar */}
        <div className="overflow-auto py-2 shrink-0" style={{ width: col1 }}>
          {/* My Folders section */}
          

          {/* Types section */}
          <div className="px-3 pt-1 pb-0.5 font-sans text-[10px] uppercase tracking-[0.1em] text-muted/60">Types</div>
          {COL1_TYPES.map(({ id, label }) => (
            <button key={id}
              onClick={() => { setColType(id); setActiveDocFolder(null); setActiveDocId(null) }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left cursor-pointer transition-colors
                ${colType === id && !activeDocFolder ? 'bg-ink/5 font-medium' : 'hover:bg-ink/5'}`}>
              <FileText size={13} className="text-muted shrink-0" />
              <span className="flex-1 font-sans text-[13px] text-ink truncate">{label}</span>
              <span className="font-sans text-[11px] text-muted tabular-nums shrink-0">{typeCounts[id] ?? 0}</span>
              <ChevronRight size={12} className="text-muted shrink-0" />
            </button>
          ))}
          {docFolders.length > 0 && (
            <>

              <div className="mx-3 my-2 h-px bg-line" />
              <div className="px-3 pt-1 pb-0.5 font-sans text-[10px] uppercase tracking-[0.1em] text-muted/60">Folders</div>
              {docFolders.map(f => (
                <div
                  key={f.id}
                  onDragOver={e => { e.preventDefault(); setDocDragOverId(f.id) }}
                  onDragLeave={() => setDocDragOverId(null)}
                  onDrop={e => onDocFolderDrop(e, f.id)}
                  onClick={() => { setActiveDocFolder(activeDocFolder === f.id ? null : f.id); setActiveDocId(null) }}
                  className={`group w-full flex items-center gap-2 px-3 py-2 text-left cursor-pointer transition-colors
                    ${activeDocFolder === f.id ? 'bg-ink/5 font-medium' : 'hover:bg-ink/5'}
                    ${docDragOverId === f.id ? 'bg-primary-light' : ''}`}>
                  <Folder size={13} className="text-secondary shrink-0" />
                  <span className="flex-1 font-sans text-[13px] text-ink truncate">{f.name}</span>
                  <span className="font-sans text-[11px] text-muted tabular-nums shrink-0">{docFolderCounts[f.id] ?? 0}</span>
                  <button
                    onClick={e => { e.stopPropagation(); onDeleteDocFolder(f.id) }}
                    className="opacity-0 group-hover:opacity-100 w-4 h-4 rounded flex items-center justify-center text-muted hover:bg-danger-tint hover:text-danger cursor-pointer transition-all shrink-0">
                    <X size={10} />
                  </button>
                </div>
              ))}
            </>
          )}

          {adding ? (
            <form onSubmit={e => { e.preventDefault(); submitAdd() }} className="px-3 py-1.5">
              <input
                ref={inputRef}
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onBlur={submitAdd}
                onKeyDown={e => { if (e.key === 'Escape') { setAdding(false); setNewName('') } }}
                placeholder="Folder name"
                className="w-full px-2 py-1 text-[12.5px] font-sans rounded border border-ink/40 outline-none bg-white text-ink"
              />
            </form>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="w-full flex items-center gap-2 px-3 py-1 mb-1 text-muted hover:text-secondary hover:bg-ink/5 cursor-pointer transition-colors">
              <Plus size={12} className="shrink-0" />
              <span className="font-sans text-[12px]">New Folder</span>
            </button>
          )}
        </div>

        

        <Handle onMouseDown={startDrag(1)} />

        {/* Col 2: Document list */}
        <div className="flex-1 overflow-auto min-w-0">
          {colDocs.length === 0 && (
            <div className="p-6 text-center font-sans text-[12px] text-muted">No documents in this view</div>
          )}
          {colDocs.map(d => (
            <div
              key={d.id}
              draggable
              onDragStart={e => {
                e.dataTransfer.setData('docId', d.id)
                e.dataTransfer.setDragImage(makeDocDragImage(d.name, d.ext), 20, 20)
              }}
              onClick={() => setActiveDocId(d.id === activeDocId ? null : d.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 border-b border-line/60 text-left cursor-pointer transition-colors
                ${activeDocId === d.id ? 'bg-canvas/60' : 'hover:bg-canvas/40'}`}>
              <FileIcon ext={d.ext} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="font-sans text-[13px] text-ink truncate">{d.name}</div>
                <div className="font-sans text-[11px] text-muted truncate">{d.case} · {d.uploadedAt}</div>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[d.status]?.dot ?? 'bg-muted'}`} />
                <ChevronRight size={12} className="text-muted" />
              </div>
            </div>
          ))}
        </div>

        <Handle onMouseDown={startDrag(3)} />

        {/* Col 3: Detail preview */}
        <div className="overflow-auto shrink-0" style={{ width: col3 }}>
          <DocDetailPanel doc={activeDoc} onPreview={onPreview} />
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function DocumentsPage({ cases = [] }) {
  const [category, setCategory]       = useState('all')
  const [search, setSearch]           = useState('')
  const [view, setView]               = useState('list')
  const [sortBy, setSortBy]           = useState('date')
  const [selected, setSelected]       = useState(new Set())
  const [activeDocId, setActiveDocId] = useState(null)
  const [previewDoc, setPreviewDoc]   = useState(null)
  const [page, setPage]               = useState(1)
  const [pageSize, setPageSize]       = useState(20)
  const [filters, setFilters]         = useState({ types: new Set(), statuses: new Set(), datePreset: '' })

  // Folder state
  const [docFolders, setDocFolders]               = useState([])
  const [docFolderMap, setDocFolderMap]           = useState({}) // docId → folderId
  const [activeDocFolder, setActiveDocFolder]     = useState(null)
  const [docDragOverId, setDocDragOverId]         = useState(null)
  const [gridDocFolderView, setGridDocFolderView] = useState(null) // null = top level, uuid = inside folder

  useEffect(() => {
    fetchFolders('documents').then(setDocFolders).catch(() => {})
  }, [])

  async function handleAddDocFolder(name) {
    try {
      const f = await createFolder({ name, type: 'documents' })
      setDocFolders(prev => [...prev, f])
    } catch (err) {
      console.error('Failed to create folder:', err.message)
    }
  }

  async function handleDeleteDocFolder(folderId) {
    try {
      await deleteFolder(folderId)
      setDocFolders(prev => prev.filter(f => f.id !== folderId))
      if (activeDocFolder === folderId) setActiveDocFolder(null)
    } catch (err) {
      console.error('Failed to delete folder:', err.message)
    }
  }

  function handleDocFolderDrop(e, folderId) {
    e.preventDefault()
    const docId = e.dataTransfer.getData('docId')
    if (!docId) return
    setDocFolderMap(prev => ({ ...prev, [docId]: folderId }))
    setDocDragOverId(null)
  }

  const allDocs = useMemo(() => casesToDocs(cases), [cases])

  // Attach in-session folder assignments to docs
  const allDocsWithFolders = useMemo(() =>
    allDocs.map(d => ({ ...d, _folderId: docFolderMap[d.id] ?? null }))
  , [allDocs, docFolderMap])

  const filtersActive = filters.types.size + filters.statuses.size + (filters.datePreset ? 1 : 0)

  const categoryFiltered = useMemo(() => {
    if (category === 'all') return allDocsWithFolders
    return allDocsWithFolders.filter(d => d.status === category)
  }, [allDocsWithFolders, category])

  const searched = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return categoryFiltered
    return categoryFiltered.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.case.toLowerCase().includes(q) ||
      d.type.toLowerCase().includes(q)
    )
  }, [categoryFiltered, search])

  const filterApplied = useMemo(() => {
    let docs = searched
    if (filters.statuses.size) docs = docs.filter(d => filters.statuses.has(d.status))
    if (filters.types.size)    docs = docs.filter(d => filters.types.has(d.type))
    docs = filterByDate(docs, filters.datePreset)
    return docs
  }, [searched, filters, activeDocFolder])

  const sorted = useMemo(() => {
    return [...filterApplied].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'case') return a.case.localeCompare(b.case)
      if (sortBy === 'type') return a.type.localeCompare(b.type)
      return new Date(b.uploadedAt) - new Date(a.uploadedAt)
    })
  }, [filterApplied, sortBy])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const paginated  = sorted.slice((page - 1) * pageSize, page * pageSize)

  const docFolderCounts = useMemo(() => {
    const map = {}
    docFolders.forEach(f => {
      map[f.id] = Object.values(docFolderMap).filter(v => v === f.id).length
    })
    return map
  }, [docFolders, docFolderMap])

  const toggleSelect = id => setSelected(s => {
    const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n
  })
  const selectAll = () => {
    setSelected(s => s.size === paginated.length ? new Set() : new Set(paginated.map(d => d.id)))
  }

  const counts = useMemo(() => ({
    all:         allDocsWithFolders.length,
    pending:     allDocsWithFolders.filter(d => d.status === 'pending').length,
    in_progress: allDocsWithFolders.filter(d => d.status === 'in_progress').length,
    complete:    allDocsWithFolders.filter(d => d.status === 'complete').length,
  }), [allDocsWithFolders])

  useEffect(() => { setPage(1) }, [category, search, filters, sortBy])

  const handlePreview = async (doc) => {
    if (!doc.path) return
    const { data, error } = await supabase.storage.from('case-documents').createSignedUrl(doc.path, 3600)
    if (!error && data?.signedUrl) setPreviewDoc({ ...doc, url: data.signedUrl })
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
      <TopBar
        search={search} setSearch={setSearch}
        view={view} setView={setView}
        sortBy={sortBy} setSortBy={setSortBy}
        count={sorted.length} total={allDocsWithFolders.length}
        filters={filters} setFilters={setFilters}
        filtersActive={filtersActive}
      />

      {view !== 'columns' && selected.size > 0 && <SelectionBar count={selected.size} clear={() => setSelected(new Set())} />}

      {view === 'columns' ? (
        <div className="flex-1 overflow-hidden">
          <ColumnsView
            docs={sorted}
            activeDocId={activeDocId}
            setActiveDocId={setActiveDocId}
            onPreview={handlePreview}
            docFolders={docFolders}
            activeDocFolder={activeDocFolder}
            setActiveDocFolder={setActiveDocFolder}
            onAddDocFolder={handleAddDocFolder}
            onDeleteDocFolder={handleDeleteDocFolder}
            onDocFolderDrop={handleDocFolderDrop}
            docDragOverId={docDragOverId}
            setDocDragOverId={setDocDragOverId}
            docFolderCounts={docFolderCounts}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          {view === 'list'
            ? <ListView rows={paginated} selected={selected} toggleSelect={toggleSelect} selectAll={selectAll} onPreview={handlePreview} />
            : <GridView
                docs={sorted}
                docFolders={docFolders}
                docFolderCounts={docFolderCounts}
                gridDocFolderView={gridDocFolderView}
                setGridDocFolderView={setGridDocFolderView}
                selected={selected}
                toggleSelect={toggleSelect}
                onPreview={handlePreview}
                onAddDocFolder={handleAddDocFolder}
                onDeleteDocFolder={handleDeleteDocFolder}
                docDragOverId={docDragOverId}
                setDocDragOverId={setDocDragOverId}
                onDocFolderDrop={handleDocFolderDrop}
              />
          }
        </div>
      )}

      <StatusFooter
        count={sorted.length}
        selected={selected.size}
        pageSize={pageSize} setPageSize={p => { setPageSize(p); setPage(1) }}
        page={page} totalPages={totalPages}
        onPrev={() => setPage(p => Math.max(1, p - 1))}
        onNext={() => setPage(p => Math.min(totalPages, p + 1))}
      />

      {previewDoc && (
        <DocumentPreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}
    </div>
  )
}
