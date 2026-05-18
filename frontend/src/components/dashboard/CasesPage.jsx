import { useState, useMemo, useEffect, useRef } from 'react'
import {
  Folder, File, FileText, Search, Star, Clock, AlertTriangle, Archive,
  Users, Grid2x2, List, Columns2, ChevronRight, Plus, MoreHorizontal,
  Filter, Home, Phone, X, Check, Eye,
} from 'lucide-react'
import { PageTitle } from '../layout/PageTitle'
import { fetchFolders, createFolder, deleteFolder } from '../../lib/api.js'

// ─── Filled star ──────────────────────────────────────────────────────────────
const StarFilled = ({ size = 14, className = '' }) => (
  <Star size={size} className={`[&_*]:fill-current [&_*]:stroke-current ${className}`} />
)

// ─── Status / package config ──────────────────────────────────────────────────
const STATUS = {
  pending: { label: 'Pending', dot: 'bg-warning', text: 'text-warning', tint: 'bg-warning-light', border: 'border-warning/30' },
  transit: { label: 'In Transit', dot: 'bg-info', text: 'text-info', tint: 'bg-info-tint', border: 'border-info/30' },
  cremation: { label: 'Cremation', dot: 'bg-danger', text: 'text-danger', tint: 'bg-danger-tint', border: 'border-danger/30' },
  complete: { label: 'Complete', dot: 'bg-primary', text: 'text-primary', tint: 'bg-primary-light', border: 'border-primary/30' },
}

const PKG_TINT = {
  Essential: { ring: 'ring-muted/20', bg: 'bg-canvas', dot: 'bg-muted' },
  Comfort: { ring: 'ring-warning/20', bg: 'bg-warning-light', dot: 'bg-warning' },
  Tribute: { ring: 'ring-primary/20', bg: 'bg-primary-light', dot: 'bg-primary' },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function calcAge(dob, dop) {
  if (!dob || !dop) return null
  const birth = new Date(dob)
  const death = new Date(dop)
  if (isNaN(birth) || isNaN(death)) return null
  let age = death.getFullYear() - birth.getFullYear()
  const m = death.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && death.getDate() < birth.getDate())) age--
  return age
}

const StatusDot = ({ cls }) => <span className={`w-2 h-2 rounded-full ${cls} inline-block shrink-0`} />

// ─── Shared small components ──────────────────────────────────────────────────
function PackageChip({ pkg }) {
  const t = PKG_TINT[pkg] || PKG_TINT.Essential
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full ring-1 ${t.ring} ${t.bg} font-sans text-[11px] text-secondary shrink-0`}>
      <span className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />
      {pkg}
    </span>
  )
}

function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.pending
  return (
    <span className={`inline-flex items-center gap-1.5 font-sans text-[11.5px] font-medium ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}

function InfoRow({ label, value, sub }) {
  return (
    <div>
      <div className="font-sans text-[10.5px] uppercase tracking-[0.1em] text-muted mb-1">{label}</div>
      <div className="font-sans text-[13px] text-ink">{value}</div>
      {sub && <div className="font-sans text-[11px] text-muted mt-0.5">{sub}</div>}
    </div>
  )
}

// ─── Top bar ──────────────────────────────────────────────────────────────────
function TopBar({ search, setSearch, view, setView, sortBy, setSortBy,
  count, total, filters, setFilters, filtersActive, crematoriumOptions, onNewCase }) {
  const [filterOpen, setFilterOpen] = useState(false)
  const filterRef = useRef(null)

  useEffect(() => {
    if (!filterOpen) return
    const h = (e) => { if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [filterOpen])

  const toggleSet = (key, val) => setFilters(f => {
    const s = new Set(f[key])
    s.has(val) ? s.delete(val) : s.add(val)
    return { ...f, [key]: s }
  })
  const toggle = (k) => setFilters(f => ({ ...f, [k]: !f[k] }))
  const clearAll = () => setFilters({ packages: new Set(), statuses: new Set(), crematoriums: new Set(), datePreset: '', hasDocs: false, starredOnly: false })

  return (
    <div className="border-b border-line bg-surface/80 backdrop-blur shrink-0 relative z-10">
      <div className="px-6 pt-5 pb-3 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 font-sans text-[11.5px] text-muted mb-1.5">
          </div>
          <div className="flex items-baseline gap-3">
            <PageTitle className="leading-none">Cases</PageTitle>
            <span className="font-sans text-[12.5px] text-muted">{count} of {total}</span>
          </div>
        </div>
        <button onClick={onNewCase}
          className="h-9 px-3.5 rounded-lg bg-ink hover:bg-ink/90 text-surface font-sans text-[12.5px] font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 mt-1">
          <Plus size={14} /> New Case
        </button>
      </div>

      <div className="px-6 pb-3 flex items-end justify-between gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name, family, case ID…"
            className="w-full pl-9 pr-4 h-9 rounded-lg border border-line bg-white text-[13px] text-ink font-sans placeholder:text-muted outline-none focus:border-ink/60 transition" />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 px-2 h-9 rounded-lg border border-line bg-white">
            <span className="font-sans text-[11.5px] text-muted">Sort</span>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="font-sans text-[12.5px] text-ink bg-transparent outline-none cursor-pointer pr-1">
              <option value="date">Date opened</option>
              <option value="name">Name</option>
              <option value="amount">Amount</option>
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
              <div className="absolute right-0 top-[calc(100%+6px)] w-80 bg-surface border border-line rounded-xl shadow-[0_12px_32px_-8px_rgba(28,28,30,0.18)] z-[60] overflow-hidden max-h-[70vh] flex flex-col">
                <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-line shrink-0">
                  <div className="font-sans text-[12px] font-medium text-ink">Filters</div>
                  <button onClick={clearAll}
                    className={`font-sans text-[11px] ${filtersActive ? 'text-danger hover:underline cursor-pointer' : 'text-muted cursor-default'}`}
                    disabled={!filtersActive}>Clear all</button>
                </div>

                <div className="overflow-auto flex-1 bg-white">
                  <div className="px-4 pt-3 pb-2">
                    <div className="font-sans text-[10.5px] uppercase tracking-[0.1em] text-muted mb-2">Status</div>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { id: 'pending',   label: 'Pending',      dot: 'bg-warning'    },
                        { id: 'transit',   label: 'In Transit',   dot: 'bg-info' },
                        { id: 'cremation', label: 'At Cremation', dot: 'bg-danger'  },
                        { id: 'complete',  label: 'Complete',     dot: 'bg-primary'      },
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
                    <div className="font-sans text-[10.5px] uppercase tracking-[0.1em] text-muted mb-2">Date Opened</div>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { id: '7d',  label: 'Last 7 days'  },
                        { id: '30d', label: 'Last 30 days' },
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

                  <div className="px-4 pb-3 border-t border-line/60 pt-3">
                    <div className="font-sans text-[10.5px] uppercase tracking-[0.1em] text-muted mb-2">Package</div>
                    <div className="flex flex-wrap gap-1.5">
                      {['Essential', 'Comfort', 'Tribute'].map(p => {
                        const on = filters.packages.has(p)
                        return (
                          <button key={p} onClick={() => toggleSet('packages', p)}
                            className={`px-2.5 py-1 rounded-full border font-sans text-[11.5px] cursor-pointer transition
                              ${on ? 'border-ink bg-ink text-surface' : 'border-line bg-white text-secondary hover:border-secondary'}`}>
                            {p}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {crematoriumOptions.length > 0 && (
                    <div className="px-4 pb-3 border-t border-line/60 pt-3">
                      <div className="font-sans text-[10.5px] uppercase tracking-[0.1em] text-muted mb-2">Crematorium</div>
                      <div className="flex flex-col gap-1">
                        {crematoriumOptions.map(crm => {
                          const on = filters.crematoriums.has(crm)
                          return (
                            <label key={crm} className="flex items-center gap-2.5 py-1 px-1 rounded hover:bg-canvas/60 cursor-pointer">
                              <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition ${on ? 'border-ink bg-ink' : 'border-line bg-white'}`}>
                                {on && <Check size={11} className="text-surface" />}
                              </span>
                              <input type="checkbox" checked={on} onChange={() => toggleSet('crematoriums', crm)} className="sr-only" />
                              <span className="font-sans text-[12px] text-ink truncate">{crm}</span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <div className="px-4 pb-3 border-t border-line/60 pt-3">
                    <div className="font-sans text-[10.5px] uppercase tracking-[0.1em] text-muted mb-1">Other</div>
                    {[
                      ['starredOnly', 'Starred only'],
                      ['hasDocs',     'Has documents'],
                    ].map(([k, label]) => (
                      <label key={k} className="flex items-center gap-2.5 py-1.5 px-1 rounded hover:bg-canvas/60 cursor-pointer">
                        <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition ${filters[k] ? 'border-ink bg-ink' : 'border-line bg-white'}`}>
                          {filters[k] && <Check size={11} className="text-surface" />}
                        </span>
                        <input type="checkbox" checked={filters[k]} onChange={() => toggle(k)} className="sr-only" />
                        <span className="font-sans text-[12.5px] text-ink">{label}</span>
                      </label>
                    ))}
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
              ['list', <List size={15} />, 'List'],
              ['grid', <Grid2x2 size={14} />, 'Grid'],
              ['columns', <Columns2 size={15} />, 'Board'],
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

// ─── Smart folder definitions ─────────────────────────────────────────────────
const SMART_FOLDERS = [
  { id: 'all', label: 'Cases', icon: <Home size={13} />, tint: null },
  { id: 'recent', label: 'Active', icon: <Clock size={13} />, tint: null },
  { id: 'starred', label: 'Starred', icon: <StarFilled size={13} />, tint: 'text-warning' },
  { id: 'needs-attention', label: 'Needs Attention', icon: <AlertTriangle size={13} />, tint: 'text-danger' },
  { id: 'unassigned', label: 'Unassigned', icon: <Users size={13} />, tint: null },
  { id: 'pending', label: 'Pending', icon: <StatusDot cls="bg-warning" />, tint: null },
  { id: 'transit', label: 'In Transit', icon: <StatusDot cls="bg-info" />, tint: null },
  { id: 'cremation', label: 'At Cremation', icon: <StatusDot cls="bg-danger" />, tint: null },
  { id: 'complete', label: 'Complete', icon: <StatusDot cls="bg-primary" />, tint: null },
]

const SMART_FOLDER_IDS = new Set(SMART_FOLDERS.map(f => f.id))

// ─── Folder card (Apple-style) ───────────────────────────────────────────────
function FolderCard({ folder, count, onClick, onDelete, onDragOver, onDragLeave, onDrop, isDragOver }) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onClick}
      className={`group relative bg-white border rounded-lg overflow-hidden cursor-pointer transition
        hover:shadow-[0_6px_18px_-10px_rgba(28,28,30,0.15)] hover:-translate-y-0.5
        ${isDragOver ? 'border-primary ring-2 ring-primary/20 -translate-y-0.5 shadow-[0_6px_18px_-10px_rgba(28,28,30,0.15)]' : 'border-line'}`}>
      {/* Folder icon */}
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

function NewFolderCard({ onAdd }) {
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
        {['Assign', 'Export', 'Archive'].map(a => (
          <button key={a} className="h-7 px-2.5 rounded-md font-sans text-[11.5px] text-surface/85 hover:bg-surface/10 cursor-pointer">{a}</button>
        ))}
      </div>
    </div>
  )
}

// ─── Status footer ────────────────────────────────────────────────────────────
function StatusFooter({ count, selected, pageSize, setPageSize, page, totalPages, onPrev, onNext, showPagination }) {
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

// ─── List view ────────────────────────────────────────────────────────────────
function ListView({ rows, selected, toggleSelect, selectAll, activeId, setActiveId, isStarred, onViewCase }) {
  const allChecked = rows.length > 0 && rows.every(r => selected.has(r.id))

  const Th = ({ children, className = '' }) => (
    <th className={`font-sans text-[10.5px] uppercase tracking-[0.08em] text-muted font-medium text-left px-3 py-2.5 ${className}`}>{children}</th>
  )

  return (
    <div>
      <div className="bg-white rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: 760 }}>
            <colgroup>
              <col style={{ width: 36 }} />
              <col style={{ minWidth: 200 }} />
              <col style={{ width: 110 }} />
              <col style={{ minWidth: 160 }} />
              <col style={{ width: 120 }} />
              <col style={{ width: 110 }} />
              <col style={{ width: 90 }} />
              <col style={{ width: 40 }} />
            </colgroup>
            <thead className="bg-white border-b border-line">
              <tr>
                <th className="px-3 py-2.5">
                  <button onClick={selectAll} className="w-4 h-4 rounded border border-line bg-white flex items-center justify-center hover:border-secondary cursor-pointer">
                    {allChecked && <Check size={11} className="text-ink" />}
                  </button>
                </th>
                <Th>Name</Th>
                <Th>Package</Th>
                <Th>Crematorium</Th>
                <Th>Status</Th>
                <Th>Opened</Th>
                <Th className="text-right pr-4">Amount</Th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <Folder size={32} className="mx-auto text-muted/40 mb-3" />
                    <p className="font-display text-[17px] text-secondary">No cases here</p>
                    <p className="font-sans text-[12px] text-muted mt-1">Try a different folder or adjust your search.</p>
                  </td>
                </tr>
              ) : rows.map(c => (
                <tr key={c.id}
                  onClick={() => onViewCase(c.id)}
                  className={`border-b border-line last:border-b-0 cursor-default group transition-colors
                    ${activeId === c.id ? 'bg-canvas/80' : 'hover:bg-canvas/40'}
                    ${selected.has(c.id) ? 'bg-info-tint/40' : ''}`}>
                  <td className="px-3 py-2.5 align-middle">
                    <button onClick={e => { e.stopPropagation(); toggleSelect(c.id) }}
                      className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition
                        ${selected.has(c.id) ? 'border-ink bg-ink' : 'border-line bg-white hover:border-secondary'}`}>
                      {selected.has(c.id) && <Check size={11} className="text-surface" />}
                    </button>
                  </td>
                  <td className="px-3 py-2.5 align-middle">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-sans text-[13.5px] font-medium text-ink truncate">{c.deceased}</span>
                        {isStarred(c.id) && <StarFilled size={11} className="text-warning shrink-0" />}
                      </div>
                      <div className="font-sans text-[11.5px] text-muted truncate">{c.family}</div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 align-middle"><PackageChip pkg={c.package} /></td>
                  <td className="px-3 py-2.5 align-middle">
                    <span className="font-sans text-[12px] text-secondary truncate block max-w-[200px]">
                      {c.crematorium || <span className="italic text-muted">— Unassigned</span>}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 align-middle"><StatusBadge status={c.status} /></td>
                  <td className="px-3 py-2.5 align-middle">
                    <span className="font-sans text-[11.5px] text-muted whitespace-nowrap">{c.date}</span>
                  </td>
                  <td className="px-3 py-2.5 align-middle text-right pr-4">
                    <span className="font-sans text-[12.5px] font-medium text-ink tabular-nums whitespace-nowrap">${c.amount.toLocaleString()}</span>
                  </td>
                  <td className="px-2 py-2.5 align-middle">
                    <button
                      onClick={e => { e.stopPropagation(); setActiveId(c.id === activeId ? null : c.id) }}
                      title="Preview"
                      className={`w-7 h-7 rounded-md flex items-center justify-center cursor-pointer transition-all opacity-0 group-hover:opacity-100
                        ${activeId === c.id ? 'bg-ink text-surface opacity-100' : 'hover:bg-canvas text-muted'}`}>
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Case card (reusable in grid) ────────────────────────────────────────────
function CaseCard({ c, selected, toggleSelect, activeId, setActiveId, isStarred, onViewCase }) {
  const s = STATUS[c.status] || STATUS.pending
  return (
    <div
      draggable
      onDragStart={e => e.dataTransfer.setData('caseId', c.id)}
      onClick={() => onViewCase(c.id)}
      className={`group relative bg-white border rounded-lg overflow-hidden cursor-default transition
        hover:shadow-[0_6px_18px_-10px_rgba(28,28,30,0.15)] hover:-translate-y-0.5
        ${activeId === c.id ? 'border-ink/40 ring-2 ring-ink/10' : 'border-line'}
        ${selected.has(c.id) ? 'ring-2 ring-info/60' : ''}`}>
      <div className={`h-14 ${s.tint} relative border-b ${s.border} flex items-center justify-center`}>
        <div className="absolute top-1.5 left-1.5">
          <button onClick={e => { e.stopPropagation(); toggleSelect(c.id) }}
            className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition
              ${selected.has(c.id) ? 'border-ink bg-ink' : 'border-line bg-white hover:border-secondary'}`}>
            {selected.has(c.id) && <Check size={11} className="text-surface" />}
          </button>
        </div>
        <button
          onClick={e => { e.stopPropagation(); setActiveId(c.id === activeId ? null : c.id) }}
          title="Preview"
          className={`absolute top-1.5 right-1.5 w-5 h-5 rounded-md flex items-center justify-center cursor-pointer transition-all opacity-0 group-hover:opacity-100
            ${activeId === c.id ? 'bg-ink text-surface opacity-100' : 'bg-white text-secondary hover:bg-surface'}`}>
          <Eye size={11} />
        </button>
        {isStarred(c.id) && <StarFilled size={12} className="absolute top-2 left-7 text-warning" />}
        <div className="w-9 h-10 bg-white rounded-[4px] shadow-[0_2px_6px_rgba(28,28,30,0.08)] flex flex-col items-center justify-center gap-0.5">
          <div className={`w-4 h-[2px] ${s.dot} rounded-full`} />
          <span className="font-display text-[14px] text-ink leading-none">
            {(c.deceased || '').split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('')}
          </span>
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-1.5 mb-1">
          <div className="min-w-0">
            <div className="font-sans text-[12.5px] font-medium text-ink truncate">{c.deceased}</div>
            <div className="font-sans text-[11px] text-muted truncate">{c.family}</div>
          </div>
          <PackageChip pkg={c.package} />
        </div>
        <div className="flex items-center justify-between mt-2">
          <StatusBadge status={c.status} />
          <span className="font-sans text-[11.5px] font-medium text-ink tabular-nums">${c.amount.toLocaleString()}</span>
        </div>
        <div className="mt-2 pt-2 border-t border-line flex items-center justify-between font-sans text-[10.5px] text-muted">
          <span className="truncate pr-2">{c.crematorium || <span className="italic">Unassigned</span>}</span>
          <span className="shrink-0">{c.date}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Grid view ────────────────────────────────────────────────────────────────
function GridView({ cases, userFolders, folderCounts, gridFolderView, setGridFolderView,
  selected, toggleSelect, activeId, setActiveId, isStarred, onViewCase,
  onAddFolder, onDeleteFolder, dragOverFolderId, setDragOverFolderId, onFolderDrop }) {

  const currentFolder = gridFolderView ? userFolders.find(f => f.id === gridFolderView) : null

  // Inside a folder: show cases in that folder. Top level: show only unfiled cases.
  const displayCases = gridFolderView
    ? cases.filter(c => c.folderId === gridFolderView)
    : cases.filter(c => !c.folderId)

  const hasFolders = !gridFolderView && userFolders.length > 0
  const hasUnfiled = !gridFolderView && displayCases.length > 0

  return (
    <div className="px-4 py-4">
      {/* Breadcrumb when inside folder */}
      {gridFolderView && (
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setGridFolderView(null)}
            className="flex items-center gap-1 font-sans text-[12.5px] text-muted hover:text-ink cursor-pointer transition-colors">
            <ChevronRight size={13} className="rotate-180" />
            Cases
          </button>
          <ChevronRight size={12} className="text-muted/40" />
          <span className="font-sans text-[12.5px] font-medium text-ink flex items-center gap-1.5">
            <Folder size={13} className="text-secondary" />
            {currentFolder?.name}
          </span>
        </div>
      )}

      {/* Folders section — always show at top level */}
      {!gridFolderView && (
        <>
          {hasUnfiled && (
            <div className="font-sans text-[10.5px] uppercase tracking-[0.1em] text-muted mb-3">Folders</div>
          )}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3 mb-5">
            {userFolders.map(f => (
              <FolderCard
                key={f.id}
                folder={f}
                count={folderCounts[f.id] ?? 0}
                onClick={() => setGridFolderView(f.id)}
                onDelete={onDeleteFolder}
                onDragOver={e => { e.preventDefault(); setDragOverFolderId(f.id) }}
                onDragLeave={() => setDragOverFolderId(null)}
                onDrop={e => onFolderDrop(e, f.id)}
                isDragOver={dragOverFolderId === f.id}
              />
            ))}
            <NewFolderCard onAdd={onAddFolder} />
          </div>

          {hasUnfiled && (
            <div className="font-sans text-[10.5px] uppercase tracking-[0.1em] text-muted mb-3">Unfiled</div>
          )}
        </>
      )}

      {/* Cases */}
      {displayCases.length === 0 ? (
        <div className="py-12 text-center">
          <Folder size={32} className="mx-auto text-muted/40 mb-3" />
          <p className="font-display text-[17px] text-secondary">
            {gridFolderView ? 'This folder is empty' : 'No unfiled cases'}
          </p>
          <p className="font-sans text-[12px] text-muted mt-1">
            {gridFolderView ? 'Drag cases here to add them.' : 'All cases are in folders, or try adjusting your search.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
          {displayCases.map(c => (
            <CaseCard
              key={c.id}
              c={c}
              selected={selected}
              toggleSelect={toggleSelect}
              activeId={activeId}
              setActiveId={setActiveId}
              isStarred={isStarred}
              onViewCase={onViewCase}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Columns view (Finder-style 3-pane) ──────────────────────────────────────
function ColumnsView({
  rows, activeId, setActiveId, folder, setFolder, counts, cases, isStarred, onViewCase,
  userFolders, onAddFolder, onDeleteFolder, onFolderDrop, dragOverFolderId, setDragOverFolderId,
}) {
  const smartFolders = SMART_FOLDERS.map(f => ({ ...f, count: counts[f.id] }))
  const c = activeId ? (rows.find(r => r.id === activeId) || cases.find(r => r.id === activeId)) : null

  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const inputRef = useRef(null)
  useEffect(() => { if (adding) inputRef.current?.focus() }, [adding])

  function submitAdd() {
    if (newName.trim()) onAddFolder(newName.trim())
    setNewName(''); setAdding(false)
  }

  const wrapRef = useRef(null)
  const [col1, setCol1] = useState(() => Number(localStorage.getItem('cases-col1')) || 200)
  const [col3, setCol3] = useState(() => Number(localStorage.getItem('cases-col3')) || 360)
  useEffect(() => { localStorage.setItem('cases-col1', col1) }, [col1])
  useEffect(() => { localStorage.setItem('cases-col3', col3) }, [col3])

  const startDrag = (which) => (e) => {
    e.preventDefault()
    const startX = e.clientX
    const start1 = col1, start3 = col3
    const totalW = wrapRef.current?.offsetWidth || 900
    const onMove = (ev) => {
      const dx = ev.clientX - startX
      if (which === 1) {
        const next = Math.max(160, Math.min(360, start1 + dx))
        if (totalW - next - col3 >= 180) setCol1(next)
      } else {
        const next = Math.max(240, Math.min(500, start3 - dx))
        if (totalW - col1 - next >= 180) setCol3(next)
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

  return (
    <div className="h-full">
      <div ref={wrapRef} className="bg-white overflow-hidden flex h-full">
        {/* Col 1: Folders */}
        <div className="overflow-auto py-2 shrink-0 flex flex-col" style={{ width: col1 }}>
          {/* Smart folders */}
          <div className="px-3 pt-1 pb-0.5 font-sans text-[10px] uppercase tracking-[0.1em] text-muted/60">Smart</div>
          {smartFolders.map(f => (
            <button key={f.id} onClick={() => { setFolder(f.id); setActiveId(null) }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-left cursor-pointer transition-colors
                ${folder === f.id ? 'bg-ink/5 font-medium' : 'hover:bg-ink/5'}`}>
              <span className={`shrink-0 ${f.tint || 'text-secondary'}`}>{f.icon}</span>
              <span className="flex-1 font-sans text-[13px] text-ink truncate">{f.label}</span>
              <span className="font-sans text-[11px] text-muted tabular-nums shrink-0">{f.count}</span>
              <ChevronRight size={12} className="text-muted shrink-0" />
            </button>
          ))}

          {/* Divider + My Folders */}
          <div className="mx-3 my-2 h-px bg-line shrink-0" />
          <div className="px-3 pb-0.5 font-sans text-[10px] uppercase tracking-[0.1em] text-muted/60">My Folders</div>

          {userFolders.map(f => (
            <div
              key={f.id}
              onDragOver={e => { e.preventDefault(); setDragOverFolderId(f.id) }}
              onDragLeave={() => setDragOverFolderId(null)}
              onDrop={e => onFolderDrop(e, f.id)}
              onClick={() => { setFolder(f.id); setActiveId(null) }}
              className={`group w-full flex items-center gap-2.5 px-3 py-2 text-left cursor-pointer transition-colors
                ${folder === f.id ? 'bg-ink/5 font-medium' : 'hover:bg-ink/5'}
                ${dragOverFolderId === f.id ? 'bg-primary-light' : ''}`}>
              <Folder size={13} className="text-secondary shrink-0" />
              <span className="flex-1 font-sans text-[13px] text-ink truncate">{f.name}</span>
              <span className="font-sans text-[11px] text-muted tabular-nums shrink-0">{counts[f.id] ?? 0}</span>
              <button
                onClick={e => { e.stopPropagation(); onDeleteFolder(f.id) }}
                className="opacity-0 group-hover:opacity-100 w-4 h-4 rounded flex items-center justify-center text-muted hover:bg-danger-tint hover:text-danger cursor-pointer transition-all shrink-0">
                <X size={10} />
              </button>
            </div>
          ))}

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
              className="w-full flex items-center gap-2 px-3 py-1.5 text-muted hover:text-secondary hover:bg-ink/5 cursor-pointer transition-colors">
              <Plus size={12} className="shrink-0" />
              <span className="font-sans text-[12px]">New Folder</span>
            </button>
          )}
        </div>

        <Handle onMouseDown={startDrag(1)} />

        {/* Col 2: Cases list */}
        <div className="flex-1 overflow-auto min-w-0">
          {rows.length === 0 && <div className="p-6 text-center font-sans text-[12px] text-muted">Empty folder</div>}
          {rows.map(r => (
            <div
              key={r.id}
              draggable
              onDragStart={e => e.dataTransfer.setData('caseId', r.id)}
              onDoubleClick={() => onViewCase(r.id)}
              onClick={() => setActiveId(r.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 border-b border-line/60 text-left cursor-pointer transition-colors
                ${activeId === r.id ? 'bg-canvas/60' : 'hover:bg-canvas/60'}`}>
              <div className="flex-1 min-w-0">
                <div className="font-sans text-[13px] truncate flex items-center gap-1.5 text-ink">
                  {r.deceased}
                  {isStarred(r.id) && <StarFilled size={10} className={activeId === r.id ? 'text-warning-light' : 'text-warning'} />}
                </div>
                <div className="font-sans text-[11px] truncate text-muted">
                  {r.family} · {r.date}
                </div>
              </div>
              <ChevronRight size={12} className="text-muted shrink-0" />
            </div>
          ))}
        </div>

        <Handle onMouseDown={startDrag(3)} />

        {/* Col 3: Preview */}
        <div className="overflow-auto shrink-0" style={{ width: col3 }}>
          {c ? <CasePreviewBody c={c} isStarred={isStarred} /> : (
            <div className="h-full flex flex-col items-center justify-center px-8 text-center">
              <File size={32} className="text-muted/40 mb-3" />
              <div className="font-display text-[18px] text-secondary">Select a case</div>
              <div className="font-sans text-[12px] text-muted mt-1">Choose a case to see details here.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Preview panel (side drawer) ──────────────────────────────────────────────
function PreviewPanel({ c, close, onViewCase, isStarred }) {
  return (
    <aside className="w-[360px] border-l border-line bg-white overflow-auto shrink-0 flex flex-col">
      <div className="flex items-center justify-between px-5 py-3 border-b border-line shrink-0 bg-surface sticky top-0 z-10">
        <div className="font-sans text-[11px] uppercase tracking-[0.1em] text-muted">Case Details</div>
        <button onClick={close} className="w-7 h-7 rounded-md hover:bg-canvas flex items-center justify-center text-muted cursor-pointer">
          <X size={15} />
        </button>
      </div>
      <CasePreviewBody c={c} onViewCase={onViewCase} isStarred={isStarred} />
    </aside>
  )
}

function CasePreviewBody({ c, onViewCase, isStarred }) {
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
        </div>
      )}
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function CasesPage({ cases, onViewCase, onNewCase, onCaseFolderAssign }) {
  const [folder, setFolder] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(new Set())
  const [activeId, setActiveId] = useState(null)
  const [starredIds, setStarredIds] = useState(new Set())
  const [filters, setFilters] = useState({ packages: new Set(), statuses: new Set(), crematoriums: new Set(), datePreset: '', hasDocs: false, starredOnly: false })
  const [viewMode, setViewMode] = useState(() => {
    try { return localStorage.getItem('cases-view-mode') || 'list' } catch { return 'list' }
  })
  const [sortBy, setSortBy] = useState('date')
  const [pageSize, setPageSize] = useState(20)
  const [page, setPage] = useState(1)

  // User-created folders
  const [userFolders, setUserFolders] = useState([])
  const [dragOverFolderId, setDragOverFolderId] = useState(null)
  const [gridFolderView, setGridFolderView] = useState(null) // null = top level, uuid = inside folder

  useEffect(() => {
    fetchFolders('cases').then(setUserFolders).catch(() => {})
  }, [])

  useEffect(() => {
    try { localStorage.setItem('cases-view-mode', viewMode) } catch { }
  }, [viewMode])

  useEffect(() => { setPage(1) }, [folder, search, filters, sortBy])

  const isStarred = (id) => starredIds.has(id)

  const filtersActive = filters.packages.size + filters.statuses.size + filters.crematoriums.size +
    (filters.datePreset ? 1 : 0) + (filters.hasDocs ? 1 : 0) + (filters.starredOnly ? 1 : 0)

  async function handleAddFolder(name) {
    try {
      const f = await createFolder({ name, type: 'cases' })
      setUserFolders(prev => [...prev, f])
    } catch (err) {
      console.error('Failed to create folder:', err.message)
    }
  }

  async function handleDeleteFolder(folderId) {
    try {
      await deleteFolder(folderId)
      setUserFolders(prev => prev.filter(f => f.id !== folderId))
      if (folder === folderId) setFolder('all')
    } catch (err) {
      console.error('Failed to delete folder:', err.message)
    }
  }

  async function handleFolderDrop(e, folderId) {
    e.preventDefault()
    const caseId = e.dataTransfer.getData('caseId')
    if (!caseId || !onCaseFolderAssign) return
    setDragOverFolderId(null)
    await onCaseFolderAssign(caseId, folderId)
  }

  const isUserFolder = (id) => !SMART_FOLDER_IDS.has(id) && userFolders.some(f => f.id === id)

  const filtered = useMemo(() => {
    let rows = cases

    if (viewMode === 'columns') {
      if (isUserFolder(folder)) rows = rows.filter(c => c.folderId === folder)
      else if (folder === 'starred') rows = rows.filter(c => starredIds.has(c.id))
      else if (folder === 'recent') rows = rows.filter(c => c.status !== 'complete')
      else if (folder === 'unassigned') rows = rows.filter(c => !c.crematorium)
      else if (folder === 'needs-attention') rows = rows.filter(c => c.status === 'pending' && (c.documents || []).length === 0)
      else if (['pending', 'transit', 'cremation', 'complete'].includes(folder)) rows = rows.filter(c => c.status === folder)
    }

    if (filters.starredOnly)      rows = rows.filter(c => starredIds.has(c.id))
    if (filters.hasDocs)          rows = rows.filter(c => (c.documents || []).length > 0)
    if (filters.statuses.size)    rows = rows.filter(c => filters.statuses.has(c.status))
    if (filters.packages.size)    rows = rows.filter(c => filters.packages.has(c.package))
    if (filters.crematoriums.size) rows = rows.filter(c => filters.crematoriums.has(c.crematorium))
    if (filters.datePreset) {
      const cutoff = new Date()
      if (filters.datePreset === '7d')  cutoff.setDate(cutoff.getDate() - 7)
      if (filters.datePreset === '30d') cutoff.setDate(cutoff.getDate() - 30)
      if (filters.datePreset === '3m')  cutoff.setMonth(cutoff.getMonth() - 3)
      if (filters.datePreset === '1y')  cutoff.setFullYear(cutoff.getFullYear() - 1)
      rows = rows.filter(c => new Date(c.date || c.dateOpened) >= cutoff)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      rows = rows.filter(c =>
        (c.deceased ?? '').toLowerCase().includes(q) ||
        (c.family ?? '').toLowerCase().includes(q) ||
        (c.id ?? '').toLowerCase().includes(q) ||
        (c.package ?? '').toLowerCase().includes(q) ||
        (c.crematorium ?? '').toLowerCase().includes(q)
      )
    }

    rows = [...rows]
    rows.sort((a, b) => {
      if (sortBy === 'name') {
        if (a.name == null && b.name == null) return 0
        if (a.name == null) return 1
        if (b.name == null) return -1
        return a.name.localeCompare(b.name)
      }
      if (sortBy === 'amount') {
        if (a.amount == null && b.amount == null) return 0
        if (a.amount == null) return 1
        if (b.amount == null) return -1
        return a.amount - b.amount
      }
      if (a.dateOpened == null && b.dateOpened == null) return 0
      if (a.dateOpened == null) return 1
      if (b.dateOpened == null) return -1
      return new Date(b.dateOpened) - new Date(a.dateOpened)
    })

    return rows
  }, [cases, folder, viewMode, search, filters, sortBy, starredIds, userFolders])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const active = activeId ? cases.find(c => c.id === activeId) : null

  const folderCounts = useMemo(() => {
    const base = {
      all: cases.length,
      starred: cases.filter(c => starredIds.has(c.id)).length,
      recent: cases.filter(c => c.status !== 'complete').length,
      unassigned: cases.filter(c => !c.crematorium).length,
      'needs-attention': cases.filter(c => c.status === 'pending' && (c.documents || []).length === 0).length,
      pending: cases.filter(c => c.status === 'pending').length,
      transit: cases.filter(c => c.status === 'transit').length,
      cremation: cases.filter(c => c.status === 'cremation').length,
      complete: cases.filter(c => c.status === 'complete').length,
    }
    userFolders.forEach(f => { base[f.id] = cases.filter(c => c.folderId === f.id).length })
    return base
  }, [cases, starredIds, userFolders])

  const toggleSelect = (id) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const selectAll = () => setSelected(filtered.length === selected.size ? new Set() : new Set(filtered.map(c => c.id)))

  const crematoriumOptions = useMemo(() =>
    [...new Set(cases.map(c => c.crematorium).filter(Boolean))].sort()
  , [cases])

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white text-ink">
      <TopBar
        search={search} setSearch={setSearch}
        view={viewMode} setView={setViewMode}
        sortBy={sortBy} setSortBy={setSortBy}
        count={filtered.length} total={cases.length}
        filters={filters} setFilters={setFilters}
        filtersActive={filtersActive}
        crematoriumOptions={crematoriumOptions}
        onNewCase={onNewCase}
      />

      {selected.size > 0 && <SelectionBar count={selected.size} clear={() => setSelected(new Set())} />}

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <div className="flex-1 overflow-auto min-h-0">
            {viewMode === 'list' && (
              <ListView
                rows={paginated} selected={selected}
                toggleSelect={toggleSelect} selectAll={selectAll}
                activeId={activeId} setActiveId={setActiveId}
                isStarred={isStarred}
                onViewCase={onViewCase}
              />
            )}
            {viewMode === 'grid' && (
              <GridView
                cases={filtered}
                userFolders={userFolders}
                folderCounts={folderCounts}
                gridFolderView={gridFolderView}
                setGridFolderView={setGridFolderView}
                selected={selected}
                toggleSelect={toggleSelect}
                activeId={activeId} setActiveId={setActiveId}
                isStarred={isStarred}
                onViewCase={onViewCase}
                onAddFolder={handleAddFolder}
                onDeleteFolder={handleDeleteFolder}
                dragOverFolderId={dragOverFolderId}
                setDragOverFolderId={setDragOverFolderId}
                onFolderDrop={handleFolderDrop}
              />
            )}
            {viewMode === 'columns' && (
              <ColumnsView
                rows={paginated} activeId={activeId} setActiveId={setActiveId}
                folder={folder} setFolder={setFolder}
                counts={folderCounts} cases={cases}
                isStarred={isStarred}
                onViewCase={onViewCase}
                userFolders={userFolders}
                onAddFolder={handleAddFolder}
                onDeleteFolder={handleDeleteFolder}
                onFolderDrop={handleFolderDrop}
                dragOverFolderId={dragOverFolderId}
                setDragOverFolderId={setDragOverFolderId}
              />
            )}
        </div>

        {viewMode !== 'columns' && active && (
          <PreviewPanel c={active} close={() => setActiveId(null)} onViewCase={onViewCase} isStarred={isStarred} />
        )}
      </div>

      <StatusFooter
        count={filtered.length} selected={selected.size}
        pageSize={pageSize} setPageSize={v => { setPageSize(v); setPage(1) }}
        page={currentPage} totalPages={totalPages}
        onPrev={() => setPage(p => Math.max(1, p - 1))}
        onNext={() => setPage(p => Math.min(totalPages, p + 1))}
        showPagination={viewMode !== 'columns'}
      />
    </div>
  )
}
