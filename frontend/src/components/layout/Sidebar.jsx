const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    badge: null,
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: 'cases',
    label: 'Cases',
    badge: '5',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 3v4M8 3v4M3 11h18" />
      </svg>
    ),
  },
  {
    id: 'crematoriums',
    label: 'Crematoriums',
    badge: null,
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343M12 3v2M12 19v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M3 12H1M23 12h-2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
    ),
  },
  {
    id: 'revenue',
    label: 'Revenue',
    badge: null,
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 17l4-8 4 4 4-6 4 4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18" />
      </svg>
    ),
  },
  {
    id: 'documents',
    label: 'Documents',
    badge: null,
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6M9 16h6M7 3H5a2 2 0 00-2 2v16a2 2 0 002 2h14a2 2 0 002-2V8l-5-5H7z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 3v5h5" />
      </svg>
    ),
  },
  {
    id: 'settings',
    label: 'Settings',
    badge: null,
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <circle cx="12" cy="12" r="3" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
]

export function Sidebar({ activeItem = 'dashboard', onItemChange }) {
  return (
    <aside className="w-[220px] bg-warm-white border-r border-border flex flex-col flex-shrink-0 min-h-screen">
      {/* Funeral home info */}
      <div className="px-5 py-5 border-b border-border">
        <p className="font-sans font-semibold text-charcoal text-sm leading-tight">Evergreen Memorial</p>
        <p className="font-sans text-xs text-muted mt-0.5">San Francisco, CA</p>
      </div>

      {/* Nav */}
      <nav className="px-3 py-4 flex-1">
        {NAV_ITEMS.map(item => {
          const isActive = activeItem === item.id
          return (
            <button
              key={item.id}
              onClick={() => onItemChange?.(item.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-sans font-medium mb-0.5 text-left transition-all cursor-pointer border-0 outline-none
                ${isActive
                  ? 'bg-sage-light text-sage'
                  : 'text-slate hover:bg-cream hover:text-charcoal'
                }
              `}
            >
              <span className={isActive ? 'text-sage' : 'text-muted'}>{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="bg-amber-light text-amber text-[10px] font-semibold rounded-full px-1.5 py-0.5 leading-none">
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-border">
        <p className="text-xs text-muted font-sans">Powered by Passage</p>
      </div>
    </aside>
  )
}
