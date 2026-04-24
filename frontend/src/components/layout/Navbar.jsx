import { Badge } from '../ui/Badge'

const TABS = [
  { label: 'Family Widget', badge: null },
  { label: 'Funeral Home', badge: '2' },
  { label: 'Crematorium', badge: null },
]

export function Navbar({ activeTab, onTabChange, user, onSignOut }) {
  return (
    <nav className="bg-ink h-[54px] flex items-center px-6 sticky top-0 z-50">
      {/* Logo */}
      <div className="flex-1 flex items-center">
        <span className="font-display text-xl text-surface tracking-wide">
          Passage
          <em className="text-warning not-italic">.</em>
        </span>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1">
        {TABS.map((tab, i) => (
          <button
            key={i}
            onClick={() => onTabChange(i)}
            className={`
              flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-sm font-sans font-medium transition-all cursor-pointer border-0 outline-none
              ${activeTab === i
                ? 'bg-white/12 text-surface'
                : 'text-muted hover:text-surface hover:bg-white/6'
              }
            `}
          >
            {tab.label}
            {tab.badge && (
              <span className="bg-warning text-surface text-[10px] font-medium rounded-full w-4 h-4 flex items-center justify-center leading-none">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Right — user info + sign out */}
      <div className="flex-1 flex justify-end items-center gap-3">
        {user ? (
          <>
            <span className="text-xs text-muted font-sans">{user.email}</span>
            <button
              onClick={onSignOut}
              className="text-xs text-muted hover:text-surface font-sans transition-colors cursor-pointer border-0 bg-transparent outline-none"
            >
              Sign out
            </button>
          </>
        ) : (
          <span className="text-xs text-muted font-sans">Prototype v0.1</span>
        )}
      </div>
    </nav>
  )
}
