import { useState, useEffect } from 'react'
import { fetchCases, updateCaseStatus } from '../lib/api.js'
import { Sidebar } from '../components/layout/Sidebar'
import { PageHeader } from '../components/layout/PageHeader'
import { HomeDashboard } from '../components/dashboard/HomeDashboard'
import { CasesPage } from '../components/dashboard/CasesPage'
import { CaseDetailPage } from '../components/dashboard/CaseDetailPage'
import { NewCasePage } from '../components/dashboard/NewCasePage'
import { CrematoriumsPage } from '../components/dashboard/CrematoriumsPage'
import { NewCrematoriumPage } from '../components/dashboard/NewCrematoriumPage'
import { RevenuePage } from '../components/dashboard/RevenuePage'
import { SettingsPage } from '../components/dashboard/SettingsPage'
import { FamilyPageEditorPage } from '../components/dashboard/FamilyPageEditorPage'
import { Button } from '../components/ui/Button'

// Map sidebar ids to internal views
const SIDEBAR_TO_VIEW = {
  home:               'dashboard',
  search:             'dashboard',
  inbox:              'inbox',
  cases:              'cases',
  'family-editor':    'family-portal',
  partners:           'crematoriums',
  'book-cremation':   'book-cremation',
  'crematory-editor': 'crematory-editor',
  documents:          'documents',
  financials:         'revenue',
  settings:           'settings',
}

function activeSidebarItem(view) {
  if (view === 'case-detail' || view === 'new-case') return 'cases'
  if (view === 'new-crematorium') return 'partners'
  if (view === 'dashboard') return 'home'
  if (view === 'family-portal') return 'family-editor'
  if (view === 'crematoriums') return 'partners'
  if (view === 'revenue') return 'financials'
  const found = Object.entries(SIDEBAR_TO_VIEW).find(([, v]) => v === view)
  return found ? found[0] : 'home'
}

function BlankPage({ title, description, icon }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      <div className="w-12 h-12 rounded-xl bg-cream border border-border flex items-center justify-center mb-4">
        {icon}
      </div>
      <p className="font-display text-2xl text-charcoal mb-2">{title}</p>
      <p className="font-sans text-sm text-muted max-w-xs">{description}</p>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <p className="font-sans text-sm text-muted">Loading…</p>
    </div>
  )
}

function ErrorState({ message }) {
  return (
    <div className="p-8 text-center">
      <p className="font-sans text-sm text-red-soft">Failed to load: {message}</p>
    </div>
  )
}

export function FuneralDashboardPage() {
  const [view, setView] = useState('dashboard')
  const [selectedCaseId, setSelectedCaseId] = useState(null)
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchCases()
      .then(setCases)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  function navigate(v) {
    setView(v)
    setSelectedCaseId(null)
  }

  function viewCase(id) {
    setSelectedCaseId(id)
    setView('case-detail')
  }

  async function handleCaseStatusChange(id, newStatus) {
    try {
      const updated = await updateCaseStatus(id, newStatus)
      setCases(prev => prev.map(c => c.id === id ? { ...c, status: updated.status } : c))
    } catch (err) {
      console.error('Failed to update status:', err.message)
    }
  }

  function handleNewCase(newCase) {
    setCases(prev => [newCase, ...prev])
  }

  const selectedCase = cases.find(c => c.id === selectedCaseId)

  if (loading) return (
    <div className="flex min-h-screen">
      <Sidebar activeItem="dashboard" onItemChange={() => {}} />
      <main className="flex-1 px-8 py-7 bg-cream overflow-auto"><LoadingState /></main>
    </div>
  )

  if (error) return (
    <div className="flex min-h-screen">
      <Sidebar activeItem="dashboard" onItemChange={() => {}} />
      <main className="flex-1 px-8 py-7 bg-cream overflow-auto"><ErrorState message={error} /></main>
    </div>
  )

  return (
    <div className="flex min-h-screen">
      <Sidebar
        activeItem={activeSidebarItem(view)}
        onItemChange={id => {
          const target = SIDEBAR_TO_VIEW[id]
          if (target) navigate(target)
        }}
      />

      <main className="flex-1 px-8 py-7 bg-cream overflow-auto">

        {/* ── Dashboard ── */}
        {view === 'dashboard' && (
          <HomeDashboard
            cases={cases}
            onViewCase={viewCase}
            onNewCase={() => setView('new-case')}
          />
        )}

        {/* ── Cases list ── */}
        {view === 'cases' && (
          <CasesPage
            cases={cases}
            onViewCase={viewCase}
            onNewCase={() => setView('new-case')}
          />
        )}

        {/* ── Case detail ── */}
        {view === 'case-detail' && selectedCase && (
          <CaseDetailPage
            caseData={selectedCase}
            onBack={() => navigate('cases')}
            onStatusChange={handleCaseStatusChange}
          />
        )}

        {/* ── New case ── */}
        {view === 'new-case' && (
          <NewCasePage
            onBack={() => navigate('cases')}
            onComplete={newCase => {
              handleNewCase(newCase)
              navigate('cases')
            }}
          />
        )}

        {/* ── Crematoriums ── */}
        {view === 'crematoriums' && (
          <CrematoriumsPage onAddPartner={() => setView('new-crematorium')} />
        )}

        {/* ── New crematorium ── */}
        {view === 'new-crematorium' && (
          <NewCrematoriumPage
            onBack={() => navigate('crematoriums')}
            onComplete={() => navigate('crematoriums')}
          />
        )}

        {/* ── Revenue ── */}
        {view === 'revenue' && <RevenuePage />}

        {/* ── Documents (placeholder) ── */}
        {view === 'documents' && (
          <>
            <PageHeader title="Documents" subtitle="All case documents in one place" date="March 10, 2024" />
            <div className="bg-warm-white rounded-xl border border-border p-16 text-center">
              <div className="w-12 h-12 rounded-xl bg-cream flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6M9 16h6M7 3H5a2 2 0 00-2 2v16a2 2 0 002 2h14a2 2 0 002-2V8l-5-5H7z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 3v5h5" />
                </svg>
              </div>
              <p className="font-display text-xl text-charcoal">Document Library</p>
              <p className="font-sans text-sm text-muted mt-2 max-w-xs mx-auto">
                All documents across active cases will appear here. Upload documents from within individual case files.
              </p>
              <div className="mt-5">
                <Button variant="secondary" onClick={() => navigate('cases')}>View Cases</Button>
              </div>
            </div>
          </>
        )}

        {/* ── Inbox ── */}
        {view === 'inbox' && (
          <BlankPage
            title="Inbox"
            description="Notifications and messages from families and crematory partners will appear here."
            icon={<svg className="w-6 h-6 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4m13 0l-3 3m0 0l-3-3" /></svg>}
          />
        )}

        {/* ── Book cremation ── */}
        {view === 'book-cremation' && (
          <BlankPage
            title="Book Cremation"
            description="Schedule and manage cremation bookings with partner crematories."
            icon={<svg className="w-6 h-6 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3M16 7V3M3 11h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
          />
        )}

        {/* ── Crematory editor ── */}
        {view === 'crematory-editor' && (
          <BlankPage
            title="Crematory Editor"
            description="Configure and manage crematory partner profiles and service details."
            icon={<svg className="w-6 h-6 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>}
          />
        )}

        {/* ── Family portal editor ── */}
        {view === 'family-portal' && <FamilyPageEditorPage />}

        {/* ── Settings ── */}
        {view === 'settings' && <SettingsPage />}

      </main>
    </div>
  )
}
