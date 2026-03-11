export function StatCard({ label, value, change }) {
  return (
    <div className="bg-warm-white rounded-xl p-5 border border-border">
      <p className="text-xs font-sans text-muted uppercase tracking-wide">{label}</p>
      <p className="font-display text-3xl text-charcoal mt-2 leading-none">{value}</p>
      {change && (
        <p className="text-xs font-sans text-sage mt-2">{change}</p>
      )}
    </div>
  )
}
