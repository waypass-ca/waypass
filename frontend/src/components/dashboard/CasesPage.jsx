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

export function CasesPage({ cases, onViewCase, onNewCase }) {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = cases.filter(c => {
    const matchesFilter = filter === 'all' || c.status === filter
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      c.deceased.toLowerCase().includes(q) ||
      c.family.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      c.package.toLowerCase().includes(q)
    return matchesFilter && matchesSearch
  })

  const counts = STATUS_FILTERS.reduce((acc, s) => {
    acc[s] = s === 'all' ? cases.length : cases.filter(c => c.status === s).length
    return acc
  }, {})

  return (
    <div>
      <PageHeader
        title="Cases"
        subtitle={`${cases.length} total · ${cases.filter(c => c.status !== 'complete').length} active`}
        date="March 10, 2024"
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
              <th className="text-right px-4 py-3 text-xs font-sans font-medium text-muted uppercase tracking-wide">Amount</th>
              <th className="text-right px-6 py-3 text-xs font-sans font-medium text-muted uppercase tracking-wide"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center font-sans text-sm text-muted">
                  No cases match your search.
                </td>
              </tr>
            ) : (
              filtered.map(c => (
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
                  <td className="px-4 py-4 text-right">
                    <span className="font-sans text-sm font-medium text-charcoal">
                      ${c.amount.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                    <Button variant="small" onClick={() => onViewCase(c.id)}>View</Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="font-sans text-xs text-muted mt-3 text-right">
        Showing {filtered.length} of {cases.length} cases
      </p>
    </div>
  )
}
