import { useState } from 'react'
import { cases as initialCases } from '../data/mockData'
import { Sidebar } from '../components/layout/Sidebar'
import { PageHeader } from '../components/layout/PageHeader'
import { StatsRow } from '../components/dashboard/StatsRow'
import { CasesTable } from '../components/dashboard/CasesTable'
import { RevenueChart } from '../components/dashboard/RevenueChart'
import { CasesPage } from '../components/dashboard/CasesPage'
import { CaseDetailPage } from '../components/dashboard/CaseDetailPage'
import { NewCasePage } from '../components/dashboard/NewCasePage'
import { CrematoriumsPage } from '../components/dashboard/CrematoriumsPage'
import { RevenuePage } from '../components/dashboard/RevenuePage'
import { SettingsPage } from '../components/dashboard/SettingsPage'
import { Button } from '../components/ui/Button'

// Map sidebar ids to views
const SIDEBAR_VIEWS = ['dashboard', 'cases', 'crematoriums', 'revenue', 'documents', 'settings']

// Determine which sidebar item is active given a view
function activeSidebarItem(view) {
  if (view === 'case-detail' || view === 'new-case') return 'cases'
  if (SIDEBAR_VIEWS.includes(view)) return view
  return 'dashboard'
}

export function FuneralDashboardPage() {
  const [view, setView] = useState('dashboard')
  const [selectedCaseId, setSelectedCaseId] = useState(null)
  const [cases, setCases] = useState(initialCases)

  function navigate(v) {
    setView(v)
    setSelectedCaseId(null)
  }

  function viewCase(id) {
    setSelectedCaseId(id)
    setView('case-detail')
  }

  function handleCaseStatusChange(id, newStatus) {
    setCases(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c))
  }

  function handleNewCase(newCase) {
    setCases(prev => [...prev, newCase])
  }

  const selectedCase = cases.find(c => c.id === selectedCaseId)

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
              date="March 10, 2024"
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
        {view === 'crematoriums' && <CrematoriumsPage />}

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
