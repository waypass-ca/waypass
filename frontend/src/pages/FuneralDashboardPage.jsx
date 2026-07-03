import { useState, useEffect } from 'react'
import {
  fetchCases, updateCaseStatus, assignCaseFolder,
  fetchCrematoriums, fetchShippingPartners,
  fetchInbox, fetchEmailTemplate, fetchPortalSettings,
} from '../lib/api.js'
import { Sidebar } from '../components/layout/Sidebar'
import { HomeDashboardPage } from './HomeDashboardPage'
import { CasesPage } from './CasesPage'
import { CaseDetailPage } from './CaseDetailPage'
import { NewCasePage } from './NewCasePage'
import { CrematoriumPartnersPage } from './CrematoriumPartnersPage'
import { ShippingPartnersPage } from './ShippingPartnersPage'
import { NewCrematoriumPage } from './NewCrematoriumPage'
import { RevenuePage } from './RevenuePage'
import { InboxPage } from './InboxPage'
import { DocumentsPage } from './DocumentsPage'
import { SettingsPage } from './SettingsPage'
import { EmailEditorPage } from '../components/dashboard/EmailEditorPage'
import { BookCremationPage } from './BookCremationPage'
import { CalendarPage } from './CalendarPage'
import { NotificationToast } from '../components/notifications/NotificationToast'
import { AppToastContainer } from '../components/ui/AppToastContainer'
import { useUser } from '../context/UserContext.jsx'
import { DashboardSkeleton } from '../components/skeletons/DashboardSkeleton'
import { useDelayedLoading } from '../hooks/useDelayedLoading'

const SIDEBAR_TO_VIEW = {
  home:                'dashboard',
  search:              'dashboard',
  inbox:               'inbox',
  cases:               'cases',
  'family-editor':     'family-portal',
  partners:            'crematoriums',
  'shipping-partners': 'shipping-partners',
  'book-cremation':    'book-cremation',
  'pickup-calendar':   'pickup-calendar',
  documents:           'documents',
  financials:          'revenue',
  settings:            'settings',
}

function activeSidebarItem(view) {
  if (view === 'case-detail' || view === 'new-case') return 'cases'
  if (view === 'new-crematorium') return 'partners'
  if (view === 'dashboard') return 'home'
  if (view === 'family-portal') return 'family-editor'
  if (view === 'crematoriums') return 'partners'
  if (view === 'shipping-partners') return 'shipping-partners'
  if (view === 'revenue') return 'financials'
  const found = Object.entries(SIDEBAR_TO_VIEW).find(([, v]) => v === view)
  return found ? found[0] : 'home'
}

function BlankPage({ title, description, icon }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      <div className="w-12 h-12 rounded-xl bg-canvas border border-line flex items-center justify-center mb-4">
        {icon}
      </div>
      <p className="font-display text-2xl text-ink mb-2">{title}</p>
      <p className="font-sans text-sm text-muted max-w-xs">{description}</p>
    </div>
  )
}

function ErrorState({ message }) {
  return (
    <div className="p-8 text-center">
      <p className="font-sans text-sm text-danger">Failed to load: {message}</p>
    </div>
  )
}

export function FuneralDashboardPage() {
  const { canWrite } = useUser()
  const [view, setView] = useState('dashboard')
  const [selectedCaseId, setSelectedCaseId] = useState(null)
  const [bookingPreselect, setBookingPreselect] = useState(null)
  const [initialInboxId, setInitialInboxId] = useState(null)

  // All data prefetched on startup so every page is instant
  const [cases, setCases] = useState([])
  const [crematoriums, setCrematoriums] = useState([])
  const [shippingPartners, setShippingPartners] = useState([])
  const [inboxItems, setInboxItems] = useState([])
  const [emailTemplate, setEmailTemplate] = useState(null)
  const [portalSettings, setPortalSettings] = useState(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.allSettled([
      fetchCases().then(setCases).catch(err => setError(err.message)),
      fetchCrematoriums().then(setCrematoriums).catch(() => {}),
      fetchShippingPartners().then(setShippingPartners).catch(() => {}),
      fetchInbox({ limit: 50 }).then(setInboxItems).catch(() => {}),
      fetchEmailTemplate().then(setEmailTemplate).catch(() => {}),
      fetchPortalSettings().then(setPortalSettings).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  function navigate(target, inboxId = null) {
    setView(target)
    setSelectedCaseId(null)
    setBookingPreselect(null)
    setInitialInboxId(inboxId)
  }

  function viewCase(id) {
    setSelectedCaseId(id)
    setView('case-detail')
    setBookingPreselect(null)
    setInitialInboxId(null)
  }

  function scheduleCase(c) {
    setBookingPreselect(c)
    setView('book-cremation')
    setSelectedCaseId(null)
    setInitialInboxId(null)
  }

  async function handleCaseStatusChange(id, newStatus) {
    try {
      const updated = await updateCaseStatus(id, newStatus)
      setCases(prev => prev.map(c => c.id === id ? { ...c, status: updated.status } : c))
    } catch (err) {
      console.error('Failed to update status:', err.message)
    }
  }

  async function handleCaseFolderAssign(caseId, folderId) {
    try {
      await assignCaseFolder(caseId, folderId)
      setCases(prev => prev.map(c => c.id === caseId ? { ...c, folderId } : c))
    } catch (err) {
      console.error('Failed to assign folder:', err.message)
    }
  }

  function handleNewCase(newCase) {
    setCases(prev => [newCase, ...prev])
  }

  const selectedCase = cases.find(c => c.id === selectedCaseId)
  const showSkeleton = useDelayedLoading(loading)

  return (
    <div className="flex h-screen overflow-hidden">
      <NotificationToast onViewInbox={(itemId) => navigate('inbox', itemId)} />
      <AppToastContainer />
      <Sidebar
        activeItem={loading ? 'home' : activeSidebarItem(view)}
        onItemChange={loading ? () => {} : id => {
          const target = SIDEBAR_TO_VIEW[id]
          if (target) navigate(target)
        }}
      />

      {loading ? (
        <main className="flex-1 px-8 py-7 bg-canvas overflow-auto">
          {showSkeleton && <DashboardSkeleton />}
        </main>
      ) : error ? (
        <main className="flex-1 px-8 py-7 bg-canvas overflow-auto"><ErrorState message={error} /></main>
      ) : view === 'pickup-calendar' ? (
        <CalendarPage cases={cases} />
      ) : view === 'book-cremation' && canWrite ? (
        <BookCremationPage
          cases={cases}
          preselectedCase={bookingPreselect}
        />
      ) : view === 'inbox' ? (
        <InboxPage initialActiveId={initialInboxId} onViewCase={viewCase} initialItems={inboxItems} />
      ) : view === 'cases' ? (
        <CasesPage cases={cases} onViewCase={viewCase} onNewCase={() => navigate('new-case')} onCaseFolderAssign={handleCaseFolderAssign} onCasesChange={setCases} />
      ) : view === 'documents' ? (
        <DocumentsPage cases={cases} onCasesChange={setCases} />
      ) : view === 'case-detail' && selectedCase ? (
        <CaseDetailPage
          caseData={selectedCase}
          onBack={() => navigate('cases')}
          onStatusChange={handleCaseStatusChange}
          onSchedule={() => scheduleCase(selectedCase)}
        />
      ) : view === 'crematoriums' ? (
        <CrematoriumPartnersPage onAddPartner={() => navigate('new-crematorium')} cases={cases} onViewCase={viewCase} initialCrematoriums={crematoriums} />
      ) : view === 'shipping-partners' ? (
        <ShippingPartnersPage cases={cases} onViewCase={viewCase} initialPartners={shippingPartners} />
      ) : view === 'family-portal' ? (
        <EmailEditorPage cases={cases} initialEmailTemplate={emailTemplate} initialPortalSettings={portalSettings} />
      ) : view === 'new-case' ? (
        <div className="flex-1 overflow-auto bg-white px-8 py-7">
          <NewCasePage
            onBack={() => navigate('cases')}
            onComplete={newCase => { handleNewCase(newCase); navigate('cases') }}
          />
        </div>
      ) : (
        <main className="flex-1 px-8 py-7 bg-canvas overflow-auto">
          {view === 'dashboard' && (
            <HomeDashboardPage
              cases={cases}
              onViewCase={viewCase}
              onNewCase={() => navigate('new-case')}
              onViewInbox={(itemId) => navigate('inbox', itemId)}
            />
          )}
          {view === 'new-crematorium' && (
            <NewCrematoriumPage
              onBack={() => navigate('crematoriums')}
              onComplete={() => navigate('crematoriums')}
            />
          )}
          {view === 'revenue' && <RevenuePage />}
          {view === 'settings' && <SettingsPage />}
        </main>
      )}
    </div>
  )
}
