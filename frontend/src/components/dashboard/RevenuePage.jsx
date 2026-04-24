import { PageHeader } from '../layout/PageHeader'
import { Button } from '../ui/Button'

const MONTHLY_DATA = [
  { month: 'Oct', revenue: 3800, cases: 3 },
  { month: 'Nov', revenue: 4200, cases: 4 },
  { month: 'Dec', revenue: 3100, cases: 2 },
  { month: 'Jan', revenue: 4210, cases: 3 },
  { month: 'Feb', revenue: 5890, cases: 5 },
  { month: 'Mar', revenue: 8475, cases: 6 },
]

const PACKAGE_BREAKDOWN = [
  { name: 'Tribute', cases: 8, total: 17560, pct: 47 },
  { name: 'Comfort', cases: 14, total: 19530, pct: 38 },
  { name: 'Essential', cases: 9, total: 8055, pct: 15 },
]

const maxRevenue = Math.max(...MONTHLY_DATA.map(d => d.revenue))

export function RevenuePage() {
  const totalRevenue = MONTHLY_DATA.reduce((s, d) => s + d.revenue, 0)
  const totalCases = MONTHLY_DATA.reduce((s, d) => s + d.cases, 0)
  const avgCaseValue = Math.round(totalRevenue / totalCases)

  return (
    <div>
      <PageHeader
        title="Revenue"
        subtitle="6-month performance overview"
        // date="March 10, 2024"
        rightSlot={
          <Button variant="secondary">
            <svg className="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </Button>
        }
      />

      {/* Top metrics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: '6-Month Revenue', value: `$${totalRevenue.toLocaleString()}`, sub: 'Oct 2023 – Mar 2024' },
          { label: 'Total Cases', value: totalCases, sub: 'Across all packages' },
          { label: 'Avg Case Value', value: `$${avgCaseValue.toLocaleString()}`, sub: '↑ $112 vs prior period' },
          { label: 'Revenue Recaptured', value: '$18,575', sub: '↑ 34% vs outsourcing' },
        ].map(m => (
          <div key={m.label} className="bg-surface rounded-xl border border-line p-5">
            <p className="font-sans text-xs text-muted uppercase tracking-wide">{m.label}</p>
            <p className="font-display text-3xl text-ink mt-2 leading-none">{m.value}</p>
            <p className="font-sans text-xs text-primary mt-2">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Bar chart + breakdown */}
      <div className="grid grid-cols-5 gap-5 mb-5">
        {/* Bar chart */}
        <div className="col-span-3 bg-surface rounded-xl border border-line p-6">
          <h2 className="font-display text-xl text-ink mb-1">Monthly Revenue</h2>
          <p className="font-sans text-xs text-muted mb-6">October 2023 – March 2024</p>

          <div className="flex items-end gap-4" style={{ height: '160px' }}>
            {MONTHLY_DATA.map(d => {
              const pct = Math.round((d.revenue / maxRevenue) * 100)
              const isCurrent = d.month === 'Mar'
              return (
                <div key={d.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="text-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="font-sans text-xs font-medium text-ink">${(d.revenue / 1000).toFixed(1)}k</p>
                    <p className="font-sans text-[10px] text-muted">{d.cases} cases</p>
                  </div>
                  <div
                    className={`w-full rounded-t-md transition-opacity ${isCurrent ? 'bg-primary' : 'bg-primary opacity-50 hover:opacity-75'}`}
                    style={{ height: `${pct}%` }}
                  />
                  <span className="font-sans text-xs text-muted">{d.month}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Package breakdown */}
        <div className="col-span-2 bg-surface rounded-xl border border-line p-6">
          <h2 className="font-display text-xl text-ink mb-1">By Package</h2>
          <p className="font-sans text-xs text-muted mb-6">Revenue distribution</p>

          <div className="space-y-5">
            {PACKAGE_BREAKDOWN.map(pkg => (
              <div key={pkg.name}>
                <div className="flex justify-between mb-1.5">
                  <span className="font-sans text-sm font-medium text-ink">{pkg.name}</span>
                  <span className="font-sans text-sm text-secondary">${pkg.total.toLocaleString()}</span>
                </div>
                <div className="w-full bg-canvas rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${pkg.pct}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="font-sans text-[10px] text-muted">{pkg.cases} cases</span>
                  <span className="font-sans text-[10px] text-muted">{pkg.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly detail table */}
      <div className="bg-surface rounded-xl border border-line overflow-hidden">
        <div className="px-6 py-4 border-b border-line">
          <h2 className="font-display text-xl text-ink">Monthly Detail</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-canvas border-b border-line">
              {['Month', 'Cases', 'Revenue', 'Avg Case Value', 'vs Prior Month'].map(col => (
                <th key={col} className="text-left px-6 py-3 text-xs font-sans font-medium text-muted uppercase tracking-wide">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MONTHLY_DATA.map((d, i) => {
              const prior = i > 0 ? MONTHLY_DATA[i - 1].revenue : null
              const change = prior ? Math.round(((d.revenue - prior) / prior) * 100) : null
              const isCurrent = d.month === 'Mar'
              return (
                <tr key={d.month} className={`border-t border-line ${isCurrent ? 'bg-primary-light/40' : 'hover:bg-canvas/50'} transition-colors`}>
                  <td className="px-6 py-3">
                    <span className={`font-sans text-sm ${isCurrent ? 'font-semibold text-primary' : 'text-ink'}`}>
                      {d.month} 2024
                    </span>
                    {isCurrent && <span className="ml-2 text-[10px] font-sans text-primary bg-primary-light px-1.5 py-0.5 rounded-full">Current</span>}
                  </td>
                  <td className="px-6 py-3"><span className="font-sans text-sm text-secondary">{d.cases}</span></td>
                  <td className="px-6 py-3"><span className="font-sans text-sm font-medium text-ink">${d.revenue.toLocaleString()}</span></td>
                  <td className="px-6 py-3"><span className="font-sans text-sm text-secondary">${Math.round(d.revenue / d.cases).toLocaleString()}</span></td>
                  <td className="px-6 py-3">
                    {change !== null ? (
                      <span className={`font-sans text-xs font-medium ${change >= 0 ? 'text-primary' : 'text-danger'}`}>
                        {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
                      </span>
                    ) : (
                      <span className="font-sans text-xs text-muted">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
