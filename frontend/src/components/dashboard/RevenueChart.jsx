const BAR_DATA = [
  { month: 'Jan', pct: 58, value: '$4,210' },
  { month: 'Feb', pct: 72, value: '$5,890' },
  { month: 'Mar', pct: 100, value: '$8,475' },
]

export function RevenueChart() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Left — bar chart */}
      <div className="bg-surface rounded-xl p-6 border border-line">
        <p className="font-sans text-xs text-muted uppercase tracking-wide">Monthly Revenue</p>
        <p className="font-display text-2xl text-ink mt-1">2024 Overview</p>

        <div className="flex items-end gap-4 mt-6" style={{ height: '120px' }}>
          {BAR_DATA.map(bar => (
            <div key={bar.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <span className="font-sans text-xs text-muted">{bar.value}</span>
              <div
                className="w-full rounded-t-md bg-primary opacity-80 hover:opacity-100 transition-opacity"
                style={{ height: `${bar.pct}%` }}
              />
              <span className="font-sans text-xs text-muted">{bar.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right — revenue recaptured */}
      <div className="bg-surface rounded-xl p-6 border border-line">
        <p className="font-sans text-xs text-muted uppercase tracking-wide">Revenue Recaptured</p>
        <p className="font-display text-4xl font-light text-ink mt-2">$18,575</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="font-sans text-sm text-primary font-medium">↑ 34%</span>
          <span className="font-sans text-xs text-muted">vs outsourcing to third party</span>
        </div>

        <div className="mt-6 pt-5 border-t border-line space-y-3">
          <div className="flex justify-between">
            <span className="font-sans text-xs text-muted">Cases handled in-house</span>
            <span className="font-sans text-xs font-medium text-ink">31 YTD</span>
          </div>
          <div className="flex justify-between">
            <span className="font-sans text-xs text-muted">Avg. margin per case</span>
            <span className="font-sans text-xs font-medium text-ink">$599</span>
          </div>
          <div className="flex justify-between">
            <span className="font-sans text-xs text-muted">Avg. turnaround</span>
            <span className="font-sans text-xs font-medium text-ink">2.4 days</span>
          </div>
        </div>
      </div>
    </div>
  )
}
