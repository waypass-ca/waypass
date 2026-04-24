import { StatusPill } from '../ui/StatusPill'
import { Button } from '../ui/Button'

export function CasesTable({ cases, onViewCase, onViewAll }) {
  return (
    <div className="bg-surface rounded-xl overflow-hidden border border-line mb-6">
      {/* Table header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-line">
        <h2 className="font-display text-xl text-ink">Recent Cases</h2>
        <button
          onClick={onViewAll}
          className="text-xs font-sans font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer border-0 bg-transparent outline-none"
        >
          View All →
        </button>
      </div>

      {/* Table */}
      <table className="w-full">
        <thead>
          <tr className="bg-canvas">
            <th className="text-left px-6 py-3 text-xs font-sans font-medium text-muted uppercase tracking-wide">Deceased</th>
            <th className="text-left px-4 py-3 text-xs font-sans font-medium text-muted uppercase tracking-wide">Case ID</th>
            <th className="text-left px-4 py-3 text-xs font-sans font-medium text-muted uppercase tracking-wide">Package</th>
            <th className="text-left px-4 py-3 text-xs font-sans font-medium text-muted uppercase tracking-wide">Status</th>
            <th className="text-right px-4 py-3 text-xs font-sans font-medium text-muted uppercase tracking-wide">Amount</th>
            <th className="text-right px-6 py-3 text-xs font-sans font-medium text-muted uppercase tracking-wide">Action</th>
          </tr>
        </thead>
        <tbody>
          {cases.map((c) => (
            <tr
              key={c.id}
              onClick={() => onViewCase?.(c.id)}
              className="border-t border-line hover:bg-canvas/60 transition-colors cursor-pointer"
            >
              <td className="px-6 py-4">
                <p className="font-sans font-medium text-sm text-ink">{c.deceased}</p>
                <p className="font-sans text-xs text-muted mt-0.5">{c.family}</p>
              </td>
              <td className="px-4 py-4">
                <span className="font-mono text-xs text-muted">{c.id}</span>
              </td>
              <td className="px-4 py-4">
                <span className="font-sans text-sm text-secondary">{c.package}</span>
              </td>
              <td className="px-4 py-4">
                <StatusPill status={c.status} />
              </td>
              <td className="px-4 py-4 text-right">
                <span className="font-sans text-sm font-medium text-ink">
                  ${c.amount.toLocaleString()}
                </span>
              </td>
              <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                <Button variant="small" onClick={() => onViewCase?.(c.id)}>View</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
