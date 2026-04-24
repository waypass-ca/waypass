export function Badge({ variant = 'warning', children }) {
  const variants = {
    warning: 'bg-warning-light text-warning',
    primary: 'bg-primary-light text-primary',
    blue: 'bg-info-tint text-info',
    red: 'bg-danger-tint text-danger',
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-sans ${variants[variant] ?? variants.warning}`}
    >
      {children}
    </span>
  )
}
