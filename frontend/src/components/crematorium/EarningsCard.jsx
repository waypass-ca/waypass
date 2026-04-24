export function EarningsCard() {
  return (
    <div className="bg-ink rounded-xl p-6 flex items-center justify-between mb-6">
      {/* Left — earnings */}
      <div>
        <p className="font-sans text-xs text-white/50 uppercase tracking-wide">March Earnings</p>
        <p className="font-display text-5xl font-light text-surface mt-2">$4,820</p>
        <p className="font-sans text-sm text-white/50 mt-2">3 active · 12 completed this month</p>
      </div>

      {/* Right — stat pills */}
      <div className="flex items-center gap-3">
        <div className="bg-white/8 rounded-xl px-5 py-4 text-center border border-white/10">
          <p className="font-display text-2xl text-surface">15</p>
          <p className="font-sans text-xs text-white/50 mt-1 whitespace-nowrap">Orders MTD</p>
        </div>
        <div className="bg-white/8 rounded-xl px-5 py-4 text-center border border-white/10">
          <p className="font-display text-2xl text-surface">3</p>
          <p className="font-sans text-xs text-white/50 mt-1 whitespace-nowrap">Partners</p>
        </div>
        <div className="bg-white/8 rounded-xl px-5 py-4 text-center border border-white/10">
          <p className="font-display text-2xl text-surface">2.4d</p>
          <p className="font-sans text-xs text-white/50 mt-1 whitespace-nowrap">Avg Turnaround</p>
        </div>
      </div>
    </div>
  )
}
