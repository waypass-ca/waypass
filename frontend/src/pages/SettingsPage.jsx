import { useState } from 'react'
import { PageTitle } from '../components/layout/PageTitle'
import { GeneralSection } from '../components/settings/GeneralSection'
import { AccountSection } from '../components/settings/AccountSection'
import { NotificationsSection } from '../components/settings/NotificationsSection'
import { BrandingSection } from '../components/settings/BrandingSection'
import { BillingSection } from '../components/settings/BillingSection'

const NAV_ITEMS = [
  { id: 'general',       label: 'General' },
  { id: 'account',       label: 'Account' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'branding',      label: 'Branding' },
  { id: 'billing',       label: 'Billing' },
]

const SECTIONS = {
  general:       GeneralSection,
  account:       AccountSection,
  notifications: NotificationsSection,
  branding:      BrandingSection,
  billing:       BillingSection,
}

export function SettingsPage() {
  const [activeId, setActiveId] = useState('general')
  const Content = SECTIONS[activeId]

  return (
    <div className="flex gap-12 min-h-0">
      <aside className="w-44 flex-shrink-0">
        <PageTitle className="mb-6">Settings</PageTitle>
        <nav className="space-y-0.5">
          {NAV_ITEMS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveId(id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-sans transition-colors cursor-pointer border-0 outline-none
                ${activeId === id
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
  )
}
