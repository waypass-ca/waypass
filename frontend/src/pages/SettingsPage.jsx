import { useState } from 'react'
import { PageTitle } from '../components/layout/PageTitle'
import { GeneralSection } from '../components/settings/GeneralSection'
import { AccountSection } from '../components/settings/AccountSection'
import { NotificationsSection } from '../components/settings/NotificationsSection'
import { BrandingSection } from '../components/settings/BrandingSection'
import { BillingSection } from '../components/settings/BillingSection'
import { StaffSection } from '../components/settings/StaffSection'
import { useUser } from '../context/UserContext.jsx'

const ALL_NAV_ITEMS = [
  { id: 'general',       label: 'General',       adminOnly: false },
  { id: 'account',       label: 'Account',       adminOnly: false },
  { id: 'staff',         label: 'Team',          adminOnly: false },
  { id: 'notifications', label: 'Notifications', adminOnly: false },
  { id: 'branding',      label: 'Branding',      adminOnly: false },
  { id: 'billing',       label: 'Billing',       adminOnly: true  },
]

const SECTIONS = {
  general:       GeneralSection,
  account:       AccountSection,
  staff:         StaffSection,
  notifications: NotificationsSection,
  branding:      BrandingSection,
  billing:       BillingSection,
}

export function SettingsPage() {
  const { isAdmin } = useUser()
  const [activeId, setActiveId] = useState('general')

  const navItems = ALL_NAV_ITEMS.filter(item => !item.adminOnly || isAdmin)
  const visibleId = navItems.find(n => n.id === activeId) ? activeId : 'general'
  const Content = SECTIONS[visibleId]

  return (
    <div className="flex-1 px-8 py-7 bg-canvas overflow-auto">
    <div className="flex gap-12 min-h-0">
      <aside className="w-44 flex-shrink-0">
        <PageTitle className="mb-6">Settings</PageTitle>
        <nav className="space-y-0.5">
          {navItems.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveId(id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-sans transition-colors cursor-pointer border-0 outline-none
                ${visibleId === id
                  ? 'bg-line/60 text-ink font-medium'
                  : 'text-secondary hover:text-ink hover:bg-canvas'
                }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 min-w-0 pt-15 pb-16 max-w-3xl">
        <Content />
      </main>
    </div>
    </div>
  )
}
