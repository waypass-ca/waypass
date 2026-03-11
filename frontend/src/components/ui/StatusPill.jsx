const STATUS_CONFIG = {
  pending: { dot: 'bg-amber', label: 'Pending', text: 'text-amber' },
  transit: { dot: 'bg-blue-soft', label: 'In Transit', text: 'text-blue-soft' },
  cremation: { dot: 'bg-red-soft', label: 'Cremation', text: 'text-red-soft' },
  complete: { dot: 'bg-sage', label: 'Complete', text: 'text-sage' },
}

export function StatusPill({ status }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending

  return (
    <span className={`inline-flex items-center gap-1.5 font-sans text-xs font-medium ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  )
}
