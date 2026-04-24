export function StatCard({ label, value, change }) {
  return (
    <div className="bg-surface rounded-xl p-5 border border-line">
      <p className="text-xs font-sans text-muted uppercase tracking-wide">{label}</p>
      <p className="font-display text-3xl text-ink mt-2 leading-none">{value}</p>
      {change && (
        <p className="text-xs font-sans text-primary mt-2">{change}</p>
      )}
    </div>
  )
}
