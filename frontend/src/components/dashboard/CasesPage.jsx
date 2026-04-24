import { useState, useMemo, useEffect, useRef } from 'react'
import {
  Folder, File, FileText, Search, Star, Clock, AlertTriangle, Archive,
  Users, Grid2x2, List, Columns2, ChevronRight, Plus, MoreHorizontal,
  Filter, Home, Phone, X, Check, Eye,
} from 'lucide-react'

// ─── Filled star (lucide Star forced-fill via CSS selector) ───────────────────
const StarFilled = ({ size = 14, className = '' }) => (
  <Star size={size} className={`[&_*]:fill-current [&_*]:stroke-current ${className}`} />
)

// ─── Status / package config ──────────────────────────────────────────────────
const STATUS = {
  pending: { label: 'Pending', dot: 'bg-amber', text: 'text-amber', tint: 'bg-amber-light', border: 'border-amber/30' },
  transit: { label: 'In Transit', dot: 'bg-blue-soft', text: 'text-blue-soft', tint: 'bg-blue-light', border: 'border-blue-soft/30' },
  cremation: { label: 'Cremation', dot: 'bg-red-soft', text: 'text-red-soft', tint: 'bg-red-light', border: 'border-red-soft/30' },
  complete: { label: 'Complete', dot: 'bg-sage', text: 'text-sage', tint: 'bg-sage-light', border: 'border-sage/30' },
}

const PKG_TINT = {
  Essential: { ring: 'ring-muted/20', bg: 'bg-cream', dot: 'bg-muted' },
  Comfort: { ring: 'ring-amber/20', bg: 'bg-amber-light', dot: 'bg-amber' },
  Tribute: { ring: 'ring-sage/20', bg: 'bg-sage-light', dot: 'bg-sage' },
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
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full ring-1 ${t.ring} ${t.bg} font-sans text-[11px] text-slate shrink-0`}>
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
      <div className="font-sans text-[13px] text-charcoal">{value}</div>
      {sub && <div className="font-sans text-[11px] text-muted mt-0.5">{sub}</div>}
    </div>
  )
}

// ─── Top bar ──────────────────────────────────────────────────────────────────
function TopBar({ folderLabel, search, setSearch, view, setView, sortBy, setSortBy,
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
    <div className="border-b border-border bg-warm-white/80 backdrop-blur shrink-0">
      {/* Row 1: breadcrumb + title + new case */}
      <div className="px-6 pt-5 pb-3 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 font-sans text-[11.5px] text-muted mb-1.5">
          </div>
          <div className="flex items-baseline gap-3">
            <h1 className="font-display font-light text-[30px] leading-none text-charcoal">{folderLabel}</h1>
            <span className="font-sans text-[12.5px] text-muted">{count} of {total}</span>
          </div>
        </div>
        <button onClick={onNewCase}
          className="h-9 px-3.5 rounded-lg bg-charcoal hover:bg-charcoal/90 text-warm-white font-sans text-[12.5px] font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 mt-1">
          <Plus size={14} /> New Case
        </button>
      </div>

      {/* Row 2: search + sort + filter + view */}
      <div className="px-6 pb-3 flex items-end justify-between gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name, family, case ID…"
            className="w-full pl-9 pr-4 h-9 rounded-lg border border-border bg-warm-white text-[13px] text-charcoal font-sans placeholder:text-muted outline-none focus:border-charcoal/60 transition" />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 px-2 h-9 rounded-lg border border-border bg-warm-white">
            <span className="font-sans text-[11.5px] text-muted">Sort</span>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="font-sans text-[12.5px] text-charcoal bg-transparent outline-none cursor-pointer pr-1">
              <option value="date">Date opened</option>
              <option value="name">Name</option>
              <option value="amount">Amount</option>
            </select>
          </div>

          <div ref={filterRef} className="relative">
            <button onClick={() => setFilterOpen(o => !o)}
              className={`relative h-9 w-9 rounded-lg border bg-warm-white hover:bg-cream flex items-center justify-center cursor-pointer
          ${filterOpen || filtersActive ? 'border-charcoal text-charcoal' : 'border-border text-slate'}`}>
              <Filter size={15} />
              {filtersActive > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-charcoal text-warm-white font-sans text-[9px] font-medium flex items-center justify-center">{filtersActive}</span>
              )}
            </button>

            {filterOpen && (
              <div className="absolute right-0 top-[calc(100%+6px)] w-80 bg-warm-white border border-border rounded-xl shadow-[0_12px_32px_-8px_rgba(28,28,30,0.18)] z-[60] overflow-hidden max-h-[70vh] flex flex-col">
                <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-border shrink-0">
                  <div className="font-sans text-[12px] font-medium text-charcoal">Filters</div>
                  <button onClick={clearAll}
                    className={`font-sans text-[11px] ${filtersActive ? 'text-red-soft hover:underline cursor-pointer' : 'text-muted cursor-default'}`}
                    disabled={!filtersActive}>Clear all</button>
                </div>

                <div className="overflow-auto flex-1">
                  {/* Status */}
                  <div className="px-4 pt-3 pb-2">
                    <div className="font-sans text-[10.5px] uppercase tracking-[0.1em] text-muted mb-2">Status</div>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { id: 'pending',   label: 'Pending',      dot: 'bg-amber'    },
                        { id: 'transit',   label: 'In Transit',   dot: 'bg-blue-soft' },
                        { id: 'cremation', label: 'At Cremation', dot: 'bg-red-soft'  },
                        { id: 'complete',  label: 'Complete',     dot: 'bg-sage'      },
                      ].map(({ id, label, dot }) => {
                        const on = filters.statuses.has(id)
                        return (
                          <button key={id} onClick={() => toggleSet('statuses', id)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-sans text-[11.5px] cursor-pointer transition
                              ${on ? 'border-charcoal bg-charcoal text-warm-white' : 'border-border bg-warm-white text-slate hover:border-slate'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${on ? 'bg-warm-white/60' : dot}`} />
                            {label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Date opened */}
                  <div className="px-4 pb-3 border-t border-border/60 pt-3">
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
                              ${on ? 'border-charcoal bg-charcoal text-warm-white' : 'border-border bg-warm-white text-slate hover:border-slate'}`}>
                            {label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Package */}
                  <div className="px-4 pb-3 border-t border-border/60 pt-3">
                    <div className="font-sans text-[10.5px] uppercase tracking-[0.1em] text-muted mb-2">Package</div>
                    <div className="flex flex-wrap gap-1.5">
                      {['Essential', 'Comfort', 'Tribute'].map(p => {
                        const on = filters.packages.has(p)
                        return (
                          <button key={p} onClick={() => toggleSet('packages', p)}
                            className={`px-2.5 py-1 rounded-full border font-sans text-[11.5px] cursor-pointer transition
                              ${on ? 'border-charcoal bg-charcoal text-warm-white' : 'border-border bg-warm-white text-slate hover:border-slate'}`}>
                            {p}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Crematorium */}
                  {crematoriumOptions.length > 0 && (
                    <div className="px-4 pb-3 border-t border-border/60 pt-3">
                      <div className="font-sans text-[10.5px] uppercase tracking-[0.1em] text-muted mb-2">Crematorium</div>
                      <div className="flex flex-col gap-1">
                        {crematoriumOptions.map(crm => {
                          const on = filters.crematoriums.has(crm)
                          return (
                            <label key={crm} className="flex items-center gap-2.5 py-1 px-1 rounded hover:bg-cream/60 cursor-pointer">
                              <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition ${on ? 'border-charcoal bg-charcoal' : 'border-border bg-warm-white'}`}>
                                {on && <Check size={11} className="text-warm-white" />}
                              </span>
                              <input type="checkbox" checked={on} onChange={() => toggleSet('crematoriums', crm)} className="sr-only" />
                              <span className="font-sans text-[12px] text-charcoal truncate">{crm}</span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Other conditions */}
                  <div className="px-4 pb-3 border-t border-border/60 pt-3">
                    <div className="font-sans text-[10.5px] uppercase tracking-[0.1em] text-muted mb-1">Other</div>
                    {[
                      ['starredOnly', 'Starred only'],
                      ['hasDocs',     'Has documents'],
                    ].map(([k, label]) => (
                      <label key={k} className="flex items-center gap-2.5 py-1.5 px-1 rounded hover:bg-cream/60 cursor-pointer">
                        <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition ${filters[k] ? 'border-charcoal bg-charcoal' : 'border-border bg-warm-white'}`}>
                          {filters[k] && <Check size={11} className="text-warm-white" />}
                        </span>
                        <input type="checkbox" checked={filters[k]} onChange={() => toggle(k)} className="sr-only" />
                        <span className="font-sans text-[12.5px] text-charcoal">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="px-4 py-2.5 border-t border-border bg-cream/30 flex items-center justify-between shrink-0">
                  <span className="font-sans text-[11px] text-muted">{filtersActive === 0 ? 'No filters applied' : `${filtersActive} active`}</span>
                  <button onClick={() => setFilterOpen(false)} className="h-7 px-3 rounded-md bg-charcoal text-warm-white font-sans text-[11.5px] cursor-pointer">Done</button>
                </div>
              </div>
            )}
          </div>

          <div className="flex bg-cream border border-border rounded-lg p-0.5 h-9">
            {[
              ['list', <List size={15} />, 'List'],
              ['grid', <Grid2x2 size={14} />, 'Grid'],
              ['columns', <Columns2 size={15} />, 'Board'],
            ].map(([k, icon, label]) => (
              <button key={k} onClick={() => setView(k)} title={label}
                className={`px-2.5 rounded-md font-sans text-[12px] flex items-center gap-1.5 cursor-pointer transition
            ${view === k ? 'bg-warm-white text-charcoal shadow-[0_1px_2px_rgba(0,0,0,0.05)]' : 'text-muted hover:text-slate'}`}>
                {icon}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Folder tabs (horizontal) ─────────────────────────────────────────────────
const FOLDERS = [
  { id: 'all', label: 'Cases', icon: <Home size={13} />, tint: null },
  { id: 'recent', label: 'Active', icon: <Clock size={13} />, tint: null },
  { id: 'starred', label: 'Starred', icon: <StarFilled size={13} />, tint: 'text-amber' },
  { id: 'needs-attention', label: 'Needs Attention', icon: <AlertTriangle size={13} />, tint: 'text-red-soft' },
  { id: 'unassigned', label: 'Unassigned', icon: <Users size={13} />, tint: null },
  { id: 'pending', label: 'Pending', icon: <StatusDot cls="bg-amber" />, tint: null },
  { id: 'transit', label: 'In Transit', icon: <StatusDot cls="bg-blue-soft" />, tint: null },
  { id: 'cremation', label: 'At Cremation', icon: <StatusDot cls="bg-red-soft" />, tint: null },
  { id: 'complete', label: 'Complete', icon: <StatusDot cls="bg-sage" />, tint: null },
]


// ─── Selection bar ────────────────────────────────────────────────────────────
function SelectionBar({ count, clear }) {
  return (
    <div className="px-6 py-2 bg-charcoal text-warm-white flex items-center justify-between gap-2 shrink-0">
      <div className="flex items-center gap-3">
        <button onClick={clear} className="w-5 h-5 rounded border border-warm-white/30 flex items-center justify-center hover:bg-warm-white/10 cursor-pointer">
          <X size={12} />
        </button>
        <span className="font-sans text-[12.5px]">{count} selected</span>
      </div>
      <div className="flex items-center gap-1">
        {['Assign', 'Export', 'Archive'].map(a => (
          <button key={a} className="h-7 px-2.5 rounded-md font-sans text-[11.5px] text-warm-white/85 hover:bg-warm-white/10 cursor-pointer">{a}</button>
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
    <div className="px-4 h-9 border-t border-border bg-warm-white flex items-center justify-between gap-4 font-sans text-[11px] text-muted shrink-0">
      {/* Left: case count */}
      <div className="shrink-0">
        {count} {count === 1 ? 'case' : 'cases'}
        {selected > 0 ? ` · ${selected} selected` : ''}
      </div>

      {/* Centre: page size + navigation (list/grid only) */}
      {showPagination && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={e => setPageSize(Number(e.target.value))}
              className="font-sans text-[11px] text-charcoal bg-warm-white border border-border rounded px-1.5 py-0.5 outline-none cursor-pointer focus:border-charcoal/50 transition">
              {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <span>per page</span>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button onClick={onPrev} disabled={page === 1}
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-cream disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors">
                <ChevronRight size={12} className="rotate-180" />
              </button>
              <span className="tabular-nums">{start}–{end} of {count}</span>
              <button onClick={onNext} disabled={page === totalPages}
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-cream disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors">
                <ChevronRight size={12} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Right: connection status */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-sage" /> Connected
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
    <div className="px-6 py-4">
      <div className="bg-warm-white border border-border rounded-xl overflow-hidden">
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
            <thead className="bg-cream/60 border-b border-border">
              <tr>
                <th className="px-3 py-2.5">
                  <button onClick={selectAll} className="w-4 h-4 rounded border border-border bg-warm-white flex items-center justify-center hover:border-slate cursor-pointer">
                    {allChecked && <Check size={11} className="text-charcoal" />}
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
                    <p className="font-display text-[17px] text-slate">No cases here</p>
                    <p className="font-sans text-[12px] text-muted mt-1">Try a different folder or adjust your search.</p>
                  </td>
                </tr>
              ) : rows.map(c => (
                <tr key={c.id}
                  onClick={() => onViewCase(c.id)}
                  className={`border-b border-border last:border-b-0 cursor-default group transition-colors
                    ${activeId === c.id ? 'bg-cream/80' : 'hover:bg-cream/40'}
                    ${selected.has(c.id) ? 'bg-blue-light/40' : ''}`}>
                  <td className="px-3 py-2.5 align-middle">
                    <button onClick={e => { e.stopPropagation(); toggleSelect(c.id) }}
                      className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition
                        ${selected.has(c.id) ? 'border-charcoal bg-charcoal' : 'border-border bg-warm-white hover:border-slate'}`}>
                      {selected.has(c.id) && <Check size={11} className="text-warm-white" />}
                    </button>
                  </td>
                  <td className="px-3 py-2.5 align-middle">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-sans text-[13.5px] font-medium text-charcoal truncate">{c.deceased}</span>
                        {isStarred(c.id) && <StarFilled size={11} className="text-amber shrink-0" />}
                      </div>
                      <div className="font-sans text-[11.5px] text-muted truncate">{c.family}</div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 align-middle"><PackageChip pkg={c.package} /></td>
                  <td className="px-3 py-2.5 align-middle">
                    <span className="font-sans text-[12px] text-slate truncate block max-w-[200px]">
                      {c.crematorium || <span className="italic text-muted">— Unassigned</span>}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 align-middle"><StatusBadge status={c.status} /></td>
                  <td className="px-3 py-2.5 align-middle">
                    <span className="font-sans text-[11.5px] text-muted whitespace-nowrap">{c.date}</span>
                  </td>
                  <td className="px-3 py-2.5 align-middle text-right pr-4">
                    <span className="font-sans text-[12.5px] font-medium text-charcoal tabular-nums whitespace-nowrap">${c.amount.toLocaleString()}</span>
                  </td>
                  <td className="px-2 py-2.5 align-middle">
                    <button
                      onClick={e => { e.stopPropagation(); setActiveId(c.id === activeId ? null : c.id) }}
                      title="Preview"
                      className={`w-7 h-7 rounded-md flex items-center justify-center cursor-pointer transition-all opacity-0 group-hover:opacity-100
                        ${activeId === c.id ? 'bg-charcoal text-warm-white opacity-100' : 'hover:bg-cream text-muted'}`}>
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

// ─── Grid view ────────────────────────────────────────────────────────────────
function GridView({ rows, selected, toggleSelect, activeId, setActiveId, isStarred, onViewCase }) {
  return (
    <div className="px-6 py-5">
      {rows.length === 0 && (
        <div className="py-16 text-center">
          <Folder size={32} className="mx-auto text-muted/40 mb-3" />
          <p className="font-display text-[17px] text-slate">No cases here</p>
          <p className="font-sans text-[12px] text-muted mt-1">Try a different folder or adjust your search.</p>
        </div>
      )}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
        {rows.map(c => {
          const s = STATUS[c.status] || STATUS.pending
          return (
            <div key={c.id}
              onClick={() => onViewCase(c.id)}
              className={`group relative bg-warm-white border rounded-xl overflow-hidden cursor-default transition
                hover:shadow-[0_8px_24px_-12px_rgba(28,28,30,0.15)] hover:-translate-y-0.5
                ${activeId === c.id ? 'border-charcoal/40 ring-2 ring-charcoal/10' : 'border-border'}
                ${selected.has(c.id) ? 'ring-2 ring-blue-soft/60' : ''}`}>
              <div className={`h-20 ${s.tint} relative border-b ${s.border} flex items-center justify-center`}>
                <div className="absolute top-2 left-2">
                  <button onClick={e => { e.stopPropagation(); toggleSelect(c.id) }}
                      className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition
                        ${selected.has(c.id) ? 'border-charcoal bg-charcoal' : 'border-border bg-warm-white hover:border-slate'}`}>
                      {selected.has(c.id) && <Check size={11} className="text-warm-white" />}
                    </button>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); setActiveId(c.id === activeId ? null : c.id) }}
                  title="Preview"
                  className={`absolute top-2 right-2 w-6 h-6 rounded-md flex items-center justify-center cursor-pointer transition-all opacity-0 group-hover:opacity-100
                    ${activeId === c.id ? 'bg-charcoal text-warm-white opacity-100' : 'bg-warm-white/80 text-slate hover:bg-warm-white'}`}>
                  <Eye size={13} />
                </button>
                {isStarred(c.id) && <StarFilled size={14} className="absolute top-2.5 left-8 text-amber" />}
                <div className="w-12 h-14 bg-warm-white rounded-[4px] shadow-[0_2px_6px_rgba(28,28,30,0.08)] flex flex-col items-center justify-center gap-1">
                  <div className={`w-6 h-[2px] ${s.dot} rounded-full`} />
                  <span className="font-display text-[18px] text-charcoal leading-none">
                    {(c.deceased || '').split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('')}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="min-w-0">
                    <div className="font-sans text-[13.5px] font-medium text-charcoal truncate">{c.deceased}</div>
                    <div className="font-sans text-[11.5px] text-muted truncate">{c.family}</div>
                  </div>
                  <PackageChip pkg={c.package} />
                </div>
                <div className="flex items-center justify-between mt-3">
                  <StatusBadge status={c.status} />
                  <span className="font-sans text-[12px] font-medium text-charcoal tabular-nums">${c.amount.toLocaleString()}</span>
                </div>
                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between font-sans text-[11px] text-muted">
                  <span className="truncate pr-2">{c.crematorium || <span className="italic">Unassigned</span>}</span>
                  <span className="shrink-0">{c.date}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Columns view (Finder-style 3-pane) ──────────────────────────────────────
function ColumnsView({ rows, activeId, setActiveId, folder, setFolder, counts, cases, isStarred, onViewCase }) {
  const folders = FOLDERS.map(f => ({ ...f, count: counts[f.id] }))
  const c = activeId ? (rows.find(r => r.id === activeId) || cases.find(r => r.id === activeId)) : null

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
        const next = Math.max(140, Math.min(340, start1 + dx))
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
      className="group relative w-px bg-border shrink-0 cursor-col-resize hover:bg-charcoal/30 transition-colors">
      <div className="absolute inset-y-0 -left-1.5 -right-1.5" />
      <div className="absolute top-1/2 -translate-y-1/2 -left-[3px] w-[7px] h-10 rounded-full opacity-0 group-hover:opacity-100 bg-charcoal/20 transition-opacity" />
    </div>
  )

  return (
    <div className="px-6 py-4 h-full">
      <div ref={wrapRef} className="bg-warm-white border border-border rounded-xl overflow-hidden flex h-full">
        {/* Col 1: Smart folders */}
        <div className="overflow-auto py-2 shrink-0" style={{ width: col1 }}>
          {folders.map(f => (
            <button key={f.id} onClick={() => { setFolder(f.id); setActiveId(null) }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-left cursor-pointer transition-colors
                ${folder === f.id ? 'bg-charcoal/5 font-medium' : 'hover:bg-cream/60'}`}>
              <span className={`shrink-0 ${f.tint || 'text-slate'}`}>{f.icon}</span>
              <span className="flex-1 font-sans text-[13px] text-charcoal truncate">{f.label}</span>
              <span className="font-sans text-[11px] text-muted tabular-nums shrink-0">{f.count}</span>
              <ChevronRight size={12} className="text-muted shrink-0" />
            </button>
          ))}
        </div>

        <Handle onMouseDown={startDrag(1)} />

        {/* Col 2: Cases list */}
        <div className="flex-1 overflow-auto min-w-0">
          {rows.length === 0 && <div className="p-6 text-center font-sans text-[12px] text-muted">Empty folder</div>}
          {rows.map(r => (
            <button key={r.id} 
              onDoubleClick={()=> onViewCase(r.id)}
              onClick={() => setActiveId(r.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 border-b border-border/60 text-left cursor-pointer transition-colors
                ${activeId === r.id ? 'bg-charcoal text-warm-white' : 'hover:bg-cream/60'}`}>
              <div className="flex-1 min-w-0">
                <div className={`font-sans text-[13px] truncate flex items-center gap-1.5 ${activeId === r.id ? 'text-warm-white' : 'text-charcoal'}`}>
                  {r.deceased}
                  {isStarred(r.id) && <StarFilled size={10} className={activeId === r.id ? 'text-amber-light' : 'text-amber'} />}
                </div>
                <div className={`font-sans text-[11px] truncate ${activeId === r.id ? 'text-warm-white/60' : 'text-muted'}`}>
                  {r.family} · {r.date}
                </div>
              </div>
              <ChevronRight size={12} className={activeId === r.id ? 'text-warm-white/60' : 'text-muted'} />
            </button>
          ))}
        </div>

        <Handle onMouseDown={startDrag(3)} />

        {/* Col 3: Preview */}
        <div className="overflow-auto shrink-0" style={{ width: col3 }}>
          {c ? <CasePreviewBody c={c} isStarred={isStarred} /> : (
            <div className="h-full flex flex-col items-center justify-center px-8 text-center">
              <File size={32} className="text-muted/40 mb-3" />
              <div className="font-display text-[18px] text-slate">Select a case</div>
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
    <aside className="w-[360px] border-l border-border bg-warm-white overflow-auto shrink-0 flex flex-col">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0 bg-warm-white sticky top-0 z-10">
        <div className="font-sans text-[11px] uppercase tracking-[0.1em] text-muted">Case Details</div>
        <button onClick={close} className="w-7 h-7 rounded-md hover:bg-cream flex items-center justify-center text-muted cursor-pointer">
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
            <h2 className="font-display text-[26px] text-charcoal leading-tight">{c.deceased}</h2>
            <div className="font-sans text-[12.5px] text-slate mt-0.5">
              {c.family}{age != null ? ` · Age ${age}` : ''}
            </div>
          </div>
          {isStarred && isStarred(c.id) && <StarFilled size={16} className="text-amber shrink-0 mt-1" />}
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
              <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-md border border-border bg-cream/40 hover:bg-cream cursor-pointer transition-colors">
                <FileText size={14} className="text-slate shrink-0" />
                <span className="font-sans text-[12px] text-slate flex-1 truncate">{name}</span>
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
                <div className="w-6 h-6 rounded-full bg-sage-light flex items-center justify-center shrink-0 mt-0.5">
                  <span className="font-sans text-[10px] text-sage font-medium">
                    {note.author.split(' ').map(p => p[0]).join('').slice(0, 2)}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="font-sans text-[12px] text-charcoal leading-snug">{note.text}</div>
                  <div className="font-sans text-[10.5px] text-muted mt-0.5">{note.author} · {note.time}</div>
                </div>
              </div>
            ))}
          </div>
        ) : <div className="font-sans text-[12px] text-muted italic">No activity yet</div>}
      </div>

      {onViewCase && (
        <div className="sticky bottom-0 px-6 py-3 bg-warm-white border-t border-border flex gap-2">
          <button onClick={() => onViewCase(c.id)}
            className="flex-1 h-9 rounded-lg bg-charcoal hover:bg-charcoal/90 text-warm-white font-sans text-[12.5px] font-medium cursor-pointer transition-colors">
            Open case
          </button>
          {c.contactPhone && (
            <button className="h-9 px-3 rounded-lg border border-border hover:bg-cream font-sans text-[12.5px] text-slate cursor-pointer flex items-center gap-1.5 transition-colors">
              <Phone size={13} /> Call
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function CasesPage({ cases, onViewCase, onNewCase }) {
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

  useEffect(() => {
    try { localStorage.setItem('cases-view-mode', viewMode) } catch { }
  }, [viewMode])

  // Reset to page 1 whenever the result set changes
  useEffect(() => { setPage(1) }, [folder, search, filters, sortBy])

  const isStarred = (id) => starredIds.has(id)

  const filtersActive = filters.packages.size + filters.statuses.size + filters.crematoriums.size +
    (filters.datePreset ? 1 : 0) + (filters.hasDocs ? 1 : 0) + (filters.starredOnly ? 1 : 0)

  const filtered = useMemo(() => {
    let rows = cases

    if (folder === 'starred') rows = rows.filter(c => starredIds.has(c.id))
    else if (folder === 'recent') rows = rows.filter(c => c.status !== 'complete')
    else if (folder === 'unassigned') rows = rows.filter(c => !c.crematorium)
    else if (folder === 'needs-attention') rows = rows.filter(c => c.status === 'pending' && (c.documents || []).length === 0)
    else if (['pending', 'transit', 'cremation', 'complete'].includes(folder)) rows = rows.filter(c => c.status === folder)

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
      // date
      if (a.dateOpened == null && b.dateOpened == null) return 0
      if (a.dateOpened == null) return 1
      if (b.dateOpened == null) return -1
      return new Date(b.dateOpened) - new Date(a.dateOpened)
    })

    return rows
  }, [cases, folder, search, filters, sortBy, starredIds])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const active = activeId ? cases.find(c => c.id === activeId) : null

  const folderCounts = useMemo(() => ({
    all: cases.length,
    starred: cases.filter(c => starredIds.has(c.id)).length,
    recent: cases.filter(c => c.status !== 'complete').length,
    unassigned: cases.filter(c => !c.crematorium).length,
    'needs-attention': cases.filter(c => c.status === 'pending' && (c.documents || []).length === 0).length,
    pending: cases.filter(c => c.status === 'pending').length,
    transit: cases.filter(c => c.status === 'transit').length,
    cremation: cases.filter(c => c.status === 'cremation').length,
    complete: cases.filter(c => c.status === 'complete').length,
  }), [cases, starredIds])

  const folderLabel = {
    all: 'Cases', starred: 'Starred', recent: 'Cases', unassigned: 'Unassigned',
    'needs-attention': 'Needs Attention',
    pending: 'Pending', transit: 'In Transit', cremation: 'At Cremation', complete: 'Complete',
  }[folder] || 'Cases'

  const toggleSelect = (id) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const selectAll = () => setSelected(filtered.length === selected.size ? new Set() : new Set(filtered.map(c => c.id)))

  const crematoriumOptions = useMemo(() =>
    [...new Set(cases.map(c => c.crematorium).filter(Boolean))].sort()
  , [cases])

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-cream text-charcoal">
      <TopBar
        folderLabel={folderLabel}
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
              rows={paginated} selected={selected}
              toggleSelect={toggleSelect}
              activeId={activeId} setActiveId={setActiveId}
              isStarred={isStarred}
              onViewCase={onViewCase}
            />
          )}
          {viewMode === 'columns' && (
            <ColumnsView
              rows={paginated} activeId={activeId} setActiveId={setActiveId}
              folder={folder} setFolder={setFolder}
              counts={folderCounts} cases={cases}
              isStarred={isStarred}
              onViewCase={onViewCase}
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
