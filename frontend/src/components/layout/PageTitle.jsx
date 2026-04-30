export function PageTitle({ children, className = '' }) {
  return (
    <h1 className={`font-display text-3xl font-light text-ink leading-tight ${className}`}>
      {children}
    </h1>
  )
}
