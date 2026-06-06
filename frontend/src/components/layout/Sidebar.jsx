import { useState } from 'react'
import {
  Search, Home, Inbox, Archive, Building2, UserPen,
  CalendarPlus, CalendarDays, FileText, Landmark, Settings, ChevronDown,
  ArrowLeftToLine, ArrowRightToLine,
} from 'lucide-react'

function NavItem({ id, label, icon: Icon, badge, isActive, onClick, collapsed }) {
  return (
    <button
      onClick={() => onClick(id)}
      title={collapsed ? label : undefined}
      className={`
        w-full flex items-center rounded-md text-[13px] font-sans mb-px text-left transition-colors cursor-pointer border-0 outline-none
        ${collapsed ? 'justify-center px-0 py-2' : 'gap-2.5 px-2.5 py-1.5'}
        ${isActive
          ? 'bg-ink/[0.06] text-ink font-medium'
          : 'text-secondary hover:bg-ink/[0.04] font-normal'
        }
      `}
    >
      <Icon size={14} className={`flex-shrink-0 ${isActive ? 'text-ink' : 'text-muted'}`} strokeWidth={1.8} />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{label}</span>
          {badge && (
            <span className="font-sans text-[10px] font-semibold text-muted bg-line rounded-full px-1.5 py-px leading-none">
              {badge}
            </span>
          )}
        </>
      )}
    </button>
  )
}

function SectionHeader({ label, collapsed: sectionCollapsed, onToggle, sidebarCollapsed }) {
  if (sidebarCollapsed) return <div className="border-t border-line my-2" />
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-1.5 px-2.5 py-1 mb-0.5 mt-3 text-left cursor-pointer border-0 bg-transparent outline-none group"
    >
      <ChevronDown
        size={12}
        className={`text-muted transition-transform duration-150 ${sectionCollapsed ? '-rotate-90' : ''}`}
        strokeWidth={2}
      />
      <span className="font-sans text-[11px] font-semibold text-muted uppercase tracking-wider group-hover:text-secondary transition-colors">
        {label}
      </span>
    </button>
  )
}

export function Sidebar({ activeItem = 'home', onItemChange }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [collapsed, setCollapsed] = useState({ patients: false, crematoriums: false })

  function toggle(id) {
    setCollapsed(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <aside
      className="bg-surface border-r border-line flex flex-col flex-shrink-0 h-screen transition-[width] duration-200"
      style={{ width: sidebarCollapsed ? '52px' : '220px' }}
    >
      {/* Org header */}
      <div className={`py-4 border-b border-line ${sidebarCollapsed ? 'px-2' : 'px-3'}`}>
        {sidebarCollapsed ? (
          <div className="w-7 h-7 rounded bg-ink flex items-center justify-center mx-auto">
            <span className="font-sans text-[9px] font-bold text-surface leading-none">EG</span>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <div className="w-5 h-5 rounded bg-ink flex items-center justify-center flex-shrink-0">
              <span className="font-sans text-[9px] font-bold text-surface leading-none">EG</span>
            </div>
            <span className="font-sans text-[13px] font-semibold text-ink flex-1 truncate">Evergreen Medical</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className={`py-3 flex-1 overflow-y-auto overflow-x-hidden ${sidebarCollapsed ? 'px-1.5' : 'px-2.5'}`}>
        <NavItem id="search"          label="Search"   icon={Search}      isActive={activeItem === 'search'}          onClick={onItemChange} collapsed={sidebarCollapsed} />
        <NavItem id="home"            label="Home"     icon={Home}        isActive={activeItem === 'home'}            onClick={onItemChange} collapsed={sidebarCollapsed} />
        <NavItem id="inbox"           label="Inbox"    icon={Inbox}       isActive={activeItem === 'inbox'}           onClick={onItemChange} collapsed={sidebarCollapsed} />
        <NavItem id="pickup-calendar" label="Calendar" icon={CalendarDays} isActive={activeItem === 'pickup-calendar'} onClick={onItemChange} collapsed={sidebarCollapsed} />

        <SectionHeader label="Patients" collapsed={collapsed.patients} onToggle={() => toggle('patients')} sidebarCollapsed={sidebarCollapsed} />
        {!collapsed.patients && (
          <>
            <NavItem id="cases"         label="Cases"         icon={Archive}  isActive={activeItem === 'cases'}         onClick={onItemChange} collapsed={sidebarCollapsed} />
            <NavItem id="family-editor" label="Family Editor" icon={UserPen}  isActive={activeItem === 'family-editor'} onClick={onItemChange} collapsed={sidebarCollapsed} />
          </>
        )}

        <SectionHeader label="Crematoriums" collapsed={collapsed.crematoriums} onToggle={() => toggle('crematoriums')} sidebarCollapsed={sidebarCollapsed} />
        {!collapsed.crematoriums && (
          <>
            <NavItem id="partners"         label="Partners"        icon={Building2}    isActive={activeItem === 'partners'}         onClick={onItemChange} collapsed={sidebarCollapsed} />
            <NavItem id="book-cremation"   label="Book Cremation"  icon={CalendarPlus} isActive={activeItem === 'book-cremation'}   onClick={onItemChange} collapsed={sidebarCollapsed} />
          </>
        )}

        <div className="border-t border-line my-3" />

        <NavItem id="documents"  label="Documents"  icon={FileText}   isActive={activeItem === 'documents'}  onClick={onItemChange} collapsed={sidebarCollapsed} />
        <NavItem id="financials" label="Financials" icon={Landmark}   isActive={activeItem === 'financials'} onClick={onItemChange} collapsed={sidebarCollapsed} />
        <NavItem id="settings"   label="Settings"   icon={Settings}   isActive={activeItem === 'settings'}   onClick={onItemChange} collapsed={sidebarCollapsed} />

        <div className="border-t border-line my-3" />

        <button
          onClick={() => setSidebarCollapsed(p => !p)}
          className={`w-full flex items-center rounded-md text-[13px] font-sans mb-px text-left transition-colors cursor-pointer border-0 outline-none text-muted hover:bg-ink/[0.04] hover:text-ink ${sidebarCollapsed ? 'justify-center px-0 py-2' : 'gap-2.5 px-2.5 py-1.5'}`}
        >
          {sidebarCollapsed
            ? <ArrowRightToLine size={14} strokeWidth={1.8} />
            : <>
                <ArrowLeftToLine size={14} strokeWidth={1.8} className="flex-shrink-0" />
                <span>Close Sidebar</span>
              </>
          }
        </button>
      </nav>

    </aside>
  )
}
