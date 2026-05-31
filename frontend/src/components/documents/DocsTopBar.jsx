import { useState, useEffect, useRef } from 'react'
import { Search, Filter, List, Grid2x2, Columns2, Check } from 'lucide-react'
import { PageTitle } from '../layout/PageTitle'
import { DOC_TYPES, CATEGORY_TABS } from './docsShared'

export function DocsTopBar({ search, setSearch, view, setView, sortBy, setSortBy,
  count, total, filters, setFilters, filtersActive, category, setCategory }) {
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
                        { id: 'pending',     label: 'Pending',     dot: 'bg-warning' },
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
              ['list',    <List size={15} />,     'List'],
              ['grid',    <Grid2x2 size={14} />,  'Grid'],
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
