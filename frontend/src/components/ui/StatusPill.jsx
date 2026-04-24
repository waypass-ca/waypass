const STATUS_CONFIG = {
  pending: { dot: 'bg-warning', label: 'Pending', text: 'text-warning' },
  transit: { dot: 'bg-info', label: 'In Transit', text: 'text-info' },
  cremation: { dot: 'bg-danger', label: 'Cremation', text: 'text-danger' },
  complete: { dot: 'bg-primary', label: 'Complete', text: 'text-primary' },
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
