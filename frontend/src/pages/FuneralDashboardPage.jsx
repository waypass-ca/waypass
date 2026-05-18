import { useState, useEffect } from 'react'
import { fetchCases, updateCaseStatus, assignCaseFolder } from '../lib/api.js'
import { Sidebar } from '../components/layout/Sidebar'
import { PageHeader } from '../components/layout/PageHeader'
import { HomeDashboard } from '../components/dashboard/HomeDashboard'
import { CasesPage } from '../components/dashboard/CasesPage'
import { CaseDetailPage } from '../components/dashboard/CaseDetailPage'
import { NewCasePage } from '../components/dashboard/NewCasePage'
import { CrematoriumsPage } from '../components/dashboard/CrematoriumsPage'
import { NewCrematoriumPage } from '../components/dashboard/NewCrematoriumPage'
import { RevenuePage } from '../components/dashboard/RevenuePage'
import { InboxPage } from '../components/dashboard/InboxPage'
import { DocumentsPage } from '../components/dashboard/DocumentsPage'
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
      <div className="w-12 h-12 rounded-xl bg-canvas border border-line flex items-center justify-center mb-4">
        {icon}
      </div>
      <p className="font-display text-2xl text-ink mb-2">{title}</p>
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
      <p className="font-sans text-sm text-danger">Failed to load: {message}</p>
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

  if (loading) return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar activeItem="dashboard" onItemChange={() => {}} />
      <main className="flex-1 px-8 py-7 bg-canvas overflow-auto"><LoadingState /></main>
    </div>
  )

  if (error) return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar activeItem="dashboard" onItemChange={() => {}} />
      <main className="flex-1 px-8 py-7 bg-canvas overflow-auto"><ErrorState message={error} /></main>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        activeItem={activeSidebarItem(view)}
        onItemChange={id => {
          const target = SIDEBAR_TO_VIEW[id]
          if (target) navigate(target)
        }}
      />

      {view === 'inbox' ? (
        <InboxPage />
      ) : view === 'cases' ? (
        <CasesPage cases={cases} onViewCase={viewCase} onNewCase={() => setView('new-case')} onCaseFolderAssign={handleCaseFolderAssign} onCasesChange={setCases} />
      ) : view === 'documents' ? (
        <DocumentsPage cases={cases} onCasesChange={setCases} />
      ) : view === 'case-detail' && selectedCase ? (
        <CaseDetailPage
          caseData={selectedCase}
          onBack={() => navigate('cases')}
          onStatusChange={handleCaseStatusChange}
        />
      ) : (
      <main className="flex-1 px-8 py-7 bg-canvas overflow-auto">

        {/* ── Dashboard ── */}
        {view === 'dashboard' && (
          <HomeDashboard
            cases={cases}
            onViewCase={viewCase}
            onNewCase={() => setView('new-case')}
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
      )}
    </div>
  )
}
