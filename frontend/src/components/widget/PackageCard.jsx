import { Badge } from '../ui/Badge'

export function PackageCard({ pkg, selected, onSelect }) {
  return (
    <div
      onClick={onSelect}
      className={`
        relative bg-surface rounded-xl p-6 cursor-pointer border-2 transition-all
        ${selected
          ? 'border-ink shadow-lg shadow-ink/10'
          : 'border-line shadow-sm hover:shadow-md hover:border-secondary/30'
        }
      `}
    >
      {/* Popular badge */}
      {pkg.popular && (
        <div className="absolute top-4 right-4">
          <Badge variant="warning">Popular</Badge>
        </div>
      )}

      {/* Name */}
      <p className="font-sans text-xs text-muted uppercase tracking-wide mb-1">{pkg.name} Plan</p>

      {/* Price */}
      <div className="flex items-baseline gap-1 mb-4">
        <span className="font-display text-4xl font-light text-ink">${pkg.price.toLocaleString()}</span>
        <span className="text-sm text-muted font-sans">/service</span>
      </div>

      {/* Features */}
      <ul className="space-y-2 mb-6">
        {pkg.features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2 text-sm font-sans text-secondary">
            <span className="text-muted mt-px">—</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {/* Selection indicator */}
      <div
        className={`
          w-full py-2 rounded-lg text-center text-sm font-sans font-medium transition-all
          ${selected
            ? 'bg-ink text-surface'
            : 'border border-line text-muted'
          }
        `}
      >
        {selected ? '✓ Selected' : 'Select'}
      </div>
    </div>
  )
}
