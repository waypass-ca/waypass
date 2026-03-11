export function AddonRow({ addon, selected, onToggle }) {
  return (
    <div
      onClick={onToggle}
      className={`
        flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all
        ${selected ? 'border-charcoal bg-warm-white' : 'border-border bg-warm-white hover:bg-cream'}
      `}
    >
      {/* Circular checkbox */}
      <div
        className={`
          w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
          ${selected ? 'border-charcoal bg-charcoal' : 'border-gray-300 bg-white'}
        `}
      >
        {selected && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>

      {/* Name + description */}
      <div className="flex-1 min-w-0">
        <p className="font-sans font-medium text-sm text-charcoal">{addon.name}</p>
        <p className="font-sans text-xs text-muted mt-0.5">{addon.description}</p>
      </div>

      {/* Price */}
      <span className="font-sans text-sm font-medium text-slate flex-shrink-0">
        +${addon.price}
      </span>
    </div>
  )
}
