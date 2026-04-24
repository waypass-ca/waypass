export function Button({ variant = 'primary', onClick, children, disabled, className = '' }) {
  const base =
    'inline-flex items-center justify-center font-sans font-medium rounded-lg transition-all cursor-pointer border-0 outline-none'

  const variants = {
    primary:   'bg-primary text-surface px-5 py-2.5 text-sm hover:opacity-90 disabled:opacity-40',
    secondary: 'bg-transparent text-secondary px-5 py-2.5 text-sm border border-line hover:bg-canvas disabled:opacity-40',
    dark:      'bg-ink text-surface px-5 py-2.5 text-sm hover:opacity-90 disabled:opacity-40',
    small:     'bg-ink text-surface px-3 py-1.5 text-xs hover:opacity-90 disabled:opacity-40',
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant] ?? variants.primary} ${disabled ? 'cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  )
}
