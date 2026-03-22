import { useState } from 'react'
import { StatusPill } from '../ui/StatusPill'
import { Button } from '../ui/Button'
import { PageHeader } from '../layout/PageHeader'

const STATUS_FILTERS = ['all', 'pending', 'transit', 'cremation', 'complete']
const FILTER_LABELS = {
  all: 'All Cases',
  pending: 'Pending',
  transit: 'In Transit',
  cremation: 'Cremation',
  complete: 'Complete',
}
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

export function CasesPage({ cases, onViewCase, onNewCase }) {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [pageSize, setPageSize] = useState(20)
  const [page, setPage] = useState(1)

  const filtered = cases.filter(c => {
    const matchesFilter = filter === 'all' || c.status === filter
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      c.deceased?.toLowerCase().includes(q) ||
      c.family?.toLowerCase().includes(q) ||
      c.id?.toLowerCase().includes(q) ||
      c.package?.toLowerCase().includes(q)
    return matchesFilter && matchesSearch
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const counts = STATUS_FILTERS.reduce((acc, s) => {
    acc[s] = s === 'all' ? cases.length : cases.filter(c => c.status === s).length
    return acc
  }, {})

  return (
    <div>
      <PageHeader
        title="Cases"
        subtitle={`${cases.length} total · ${cases.filter(c => c.status !== 'complete').length} active`}
        // date="March 10, 2024"
        rightSlot={<Button variant="primary" onClick={onNewCase}>+ New Case</Button>}
      />

      {/* Filters + search */}
      <div className="flex items-center justify-between mb-4">
        {/* Status filter pills */}
        <div className="flex gap-1 bg-warm-white border border-border rounded-xl p-1">
          {STATUS_FILTERS.map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`
                px-3.5 py-1.5 rounded-lg text-xs font-sans font-medium transition-all cursor-pointer border-0 outline-none
                ${filter === s
                  ? 'bg-charcoal text-warm-white'
                  : 'text-slate hover:text-charcoal'
                }
              `}
            >
              {FILTER_LABELS[s]}
              {counts[s] > 0 && (
                <span className={`ml-1.5 ${filter === s ? 'text-white/60' : 'text-muted'}`}>
                  {counts[s]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <circle cx="11" cy="11" r="8" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search cases…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm font-sans text-charcoal border border-border rounded-lg outline-none focus:border-charcoal transition-colors bg-warm-white w-56"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-warm-white rounded-xl overflow-hidden border border-border">
        <table className="w-full">
          <thead>
            <tr className="bg-cream border-b border-border">
              <th className="text-left px-6 py-3 text-xs font-sans font-medium text-muted uppercase tracking-wide">Deceased</th>
              <th className="text-left px-4 py-3 text-xs font-sans font-medium text-muted uppercase tracking-wide">Case ID</th>
              <th className="text-left px-4 py-3 text-xs font-sans font-medium text-muted uppercase tracking-wide">Package</th>
              <th className="text-left px-4 py-3 text-xs font-sans font-medium text-muted uppercase tracking-wide">Crematorium</th>
              <th className="text-left px-4 py-3 text-xs font-sans font-medium text-muted uppercase tracking-wide">Status</th>
              <th className="text-left px-4 py-3 text-xs font-sans font-medium text-muted uppercase tracking-wide">Date</th>
              <th className="text-right px-6 py-3 text-xs font-sans font-medium text-muted uppercase tracking-wide">Amount</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center font-sans text-sm text-muted">
                  No cases match your search.
                </td>
              </tr>
            ) : (
              paginated.map(c => (
                <tr
                  key={c.id}
                  onClick={() => onViewCase(c.id)}
                  className="border-t border-border hover:bg-cream/60 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <p className="font-sans font-medium text-sm text-charcoal">{c.deceased}</p>
                    <p className="font-sans text-xs text-muted mt-0.5">{c.family}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className="font-mono text-xs text-muted">{c.id}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="font-sans text-sm text-slate">{c.package}</span>
                  </td>
                  <td className="px-4 py-4">
                    {c.crematorium
                      ? <span className="font-sans text-xs text-slate">{c.crematorium}</span>
                      : <span className="font-sans text-xs text-muted italic">Unassigned</span>
                    }
                  </td>
                  <td className="px-4 py-4">
                    <StatusPill status={c.status} />
                  </td>
                  <td className="px-4 py-4">
                    <span className="font-sans text-xs text-muted">{c.date}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-sans text-sm font-medium text-charcoal">
                      ${c.amount.toLocaleString()}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer: rows per page + pagination */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          <span className="font-sans text-xs text-muted">Rows per page</span>
          <select
            value={pageSize}
            onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
            className="font-sans text-xs text-charcoal border border-border rounded-lg px-2 py-1 bg-warm-white outline-none focus:border-charcoal transition-colors cursor-pointer"
          >
            {PAGE_SIZE_OPTIONS.map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-sans text-xs text-muted">
            {filtered.length === 0 ? '0' : `${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, filtered.length)}`} of {filtered.length}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded-lg border border-border font-sans text-xs text-slate hover:text-charcoal hover:bg-cream disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              ‹
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded-lg border border-border font-sans text-xs text-slate hover:text-charcoal hover:bg-cream disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
