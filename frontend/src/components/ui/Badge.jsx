export function Badge({ variant = 'amber', children }) {
  const variants = {
    amber: 'bg-amber-light text-amber',
    sage: 'bg-sage-light text-sage',
    blue: 'bg-blue-light text-blue-soft',
    red: 'bg-red-light text-red-soft',
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-sans ${variants[variant] ?? variants.amber}`}
    >
      {children}
    </span>
  )
}
