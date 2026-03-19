import { useState, useEffect } from 'react'
import { fetchCases, updateCaseStatus, createCase } from '../lib/api.js'
import { Sidebar } from '../components/layout/Sidebar'
import { PageHeader } from '../components/layout/PageHeader'
import { StatsRow } from '../components/dashboard/StatsRow'
import { CasesTable } from '../components/dashboard/CasesTable'
import { RevenueChart } from '../components/dashboard/RevenueChart'
import { CasesPage } from '../components/dashboard/CasesPage'
import { CaseDetailPage } from '../components/dashboard/CaseDetailPage'
import { NewCasePage } from '../components/dashboard/NewCasePage'
import { CrematoriumsPage } from '../components/dashboard/CrematoriumsPage'
import { NewCrematoriumPage } from '../components/dashboard/NewCrematoriumPage'
import { RevenuePage } from '../components/dashboard/RevenuePage'
import { SettingsPage } from '../components/dashboard/SettingsPage'
import { Button } from '../components/ui/Button'

// Map sidebar ids to views
const SIDEBAR_VIEWS = ['dashboard', 'cases', 'crematoriums', 'revenue', 'documents', 'settings']

function activeSidebarItem(view) {
  if (view === 'case-detail' || view === 'new-case') return 'cases'
  if (view === 'new-crematorium') return 'crematoriums'
  if (SIDEBAR_VIEWS.includes(view)) return view
  return 'dashboard'
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
          if (SIDEBAR_VIEWS.includes(id)) navigate(id)
        }}
      />

      <main className="flex-1 px-8 py-7 bg-cream overflow-auto">

        {/* ── Dashboard ── */}
        {view === 'dashboard' && (
          <>
            <PageHeader
              title="Dashboard"
              subtitle="Evergreen Memorial · San Francisco, CA"
              // date="March 10, 2024"
              rightSlot={<Button variant="primary" onClick={() => setView('new-case')}>+ New Case</Button>}
            />
            <StatsRow />
            <CasesTable
              cases={cases.slice(0, 5)}
              onViewCase={viewCase}
              onViewAll={() => navigate('cases')}
            />
            <RevenueChart />
          </>
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

        {/* ── Settings ── */}
        {view === 'settings' && <SettingsPage />}

      </main>
    </div>
  )
}
