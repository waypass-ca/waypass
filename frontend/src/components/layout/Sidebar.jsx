import { useState } from 'react'

function NavIcon({ children }) {
  return <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">{children}</span>
}

const ICONS = {
  search: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
    </svg>
  ),
  home: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12L12 3l9 9M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" />
    </svg>
  ),
  inbox: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4m13 0l-3 3m0 0l-3-3" />
    </svg>
  ),
  cases: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
    </svg>
  ),
  familyEditor: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1m4-4a4 4 0 100-8 4 4 0 000 8z" />
    </svg>
  ),
  partners: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2M5 21H3m4-10h2m4 0h2M7 7h2m4 0h2" />
    </svg>
  ),
  bookCremation: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3M16 7V3M3 11h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  crematoryEditor: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  documents: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6M9 16h6M7 3H5a2 2 0 00-2 2v16a2 2 0 002 2h14a2 2 0 002-2V8l-5-5H7z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 3v5h5" />
    </svg>
  ),
  financials: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
    </svg>
  ),
  settings: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="12" r="3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  ),
  chevron: (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  ),
}

function NavItem({ id, label, icon, badge, isActive, onClick }) {
  return (
    <button
      onClick={() => onClick(id)}
      className={`
        w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] font-sans mb-px text-left transition-colors cursor-pointer border-0 outline-none
        ${isActive
          ? 'bg-charcoal/[0.06] text-charcoal font-medium'
          : 'text-slate hover:bg-charcoal/[0.04] font-normal'
        }
      `}
    >
      <NavIcon>
        <span className={isActive ? 'text-charcoal' : 'text-muted'}>{icon}</span>
      </NavIcon>
      <span className="flex-1 truncate">{label}</span>
      {badge && (
        <span className="font-sans text-[10px] font-semibold text-muted bg-border rounded-full px-1.5 py-px leading-none">
          {badge}
        </span>
      )}
    </button>
  )
}

function SectionHeader({ label, collapsed, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-1.5 px-2.5 py-1 mb-0.5 mt-3 text-left cursor-pointer border-0 bg-transparent outline-none group"
    >
      <span className={`text-muted transition-transform duration-150 ${collapsed ? '-rotate-90' : ''}`}>
        {ICONS.chevron}
      </span>
      <span className="font-sans text-[11px] font-semibold text-muted uppercase tracking-wider group-hover:text-slate transition-colors">
        {label}
      </span>
    </button>
  )
}

export function Sidebar({ activeItem = 'home', onItemChange }) {
  const [collapsed, setCollapsed] = useState({ patients: false, crematoriums: false })

  function toggle(id) {
    setCollapsed(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <aside className="w-[220px] bg-warm-white border-r border-border flex flex-col flex-shrink-0 min-h-screen">
      {/* Org header */}
      <div className="px-3 py-4 border-b border-border">
        <button className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-charcoal/[0.04] transition-colors cursor-pointer border-0 bg-transparent outline-none text-left">
          <div className="w-5 h-5 rounded bg-charcoal flex items-center justify-center flex-shrink-0">
            <span className="font-sans text-[9px] font-bold text-warm-white leading-none">EG</span>
          </div>
          <span className="font-sans text-[13px] font-semibold text-charcoal flex-1 truncate">Evergreen Medical</span>
          <svg className="w-3 h-3 text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4M8 15l4 4 4-4" />
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="px-2.5 py-3 flex-1 overflow-y-auto">
        {/* Top items */}
        <NavItem id="search"  label="Search"  icon={ICONS.search}  isActive={activeItem === 'search'}  onClick={onItemChange} />
        <NavItem id="home"    label="Home"    icon={ICONS.home}    isActive={activeItem === 'home'}    onClick={onItemChange} />
        <NavItem id="inbox"   label="Inbox"   icon={ICONS.inbox}   isActive={activeItem === 'inbox'}   onClick={onItemChange} />

        {/* Patients section */}
        <SectionHeader label="Patients" collapsed={collapsed.patients} onToggle={() => toggle('patients')} />
        {!collapsed.patients && (
          <>
            <NavItem id="cases"         label="Cases"         icon={ICONS.cases}         isActive={activeItem === 'cases'}         onClick={onItemChange} />
            <NavItem id="family-editor" label="Family Editor" icon={ICONS.familyEditor}  isActive={activeItem === 'family-editor'} onClick={onItemChange} />
          </>
        )}

        {/* Crematoriums section */}
        <SectionHeader label="Crematoriums" collapsed={collapsed.crematoriums} onToggle={() => toggle('crematoriums')} />
        {!collapsed.crematoriums && (
          <>
            <NavItem id="partners"          label="Partners"          icon={ICONS.partners}        isActive={activeItem === 'partners'}          onClick={onItemChange} />
            <NavItem id="book-cremation"    label="Book Cremation"    icon={ICONS.bookCremation}   isActive={activeItem === 'book-cremation'}    onClick={onItemChange} />
            <NavItem id="crematory-editor"  label="Crematory Editor"  icon={ICONS.crematoryEditor} isActive={activeItem === 'crematory-editor'}  onClick={onItemChange} />
          </>
        )}

        {/* Divider */}
        <div className="border-t border-border my-3" />

        {/* Bottom items */}
        <NavItem id="documents"  label="Documents"  icon={ICONS.documents}  isActive={activeItem === 'documents'}  onClick={onItemChange} />
        <NavItem id="financials" label="Financials" icon={ICONS.financials} isActive={activeItem === 'financials'} onClick={onItemChange} />
        <NavItem id="settings"   label="Settings"   icon={ICONS.settings}   isActive={activeItem === 'settings'}   onClick={onItemChange} />
      </nav>
    </aside>
  )
}
