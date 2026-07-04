/* eslint-disable react-refresh/only-export-components */
import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { UserProvider, useUser } from './context/UserContext.jsx'
import { DarkModeProvider } from './context/DarkModeContext.jsx'
import { LoginScreen } from './components/auth/LoginScreen.jsx'
import { DashboardLayout } from './components/layout/DashboardLayout.jsx'
import { CrematoriumResponsePage } from './pages/CrematoriumResponsePage.jsx'
import { ShippingResponsePage } from './pages/ShippingResponsePage.jsx'
import { AcceptInvitePage } from './pages/AcceptInvitePage.jsx'
import { AppSkeleton } from './components/skeletons/AppSkeleton'
import { useDelayedLoading } from './hooks/useDelayedLoading'
import { HomeDashboardPage } from './pages/HomeDashboardPage.jsx'
import { InboxPage } from './pages/InboxPage.jsx'
import { CasesPage } from './pages/CasesPage.jsx'
import { NewCasePage } from './pages/NewCasePage.jsx'
import { CaseDetailPage } from './pages/CaseDetailPage.jsx'
import { CrematoriumPartnersPage } from './pages/CrematoriumPartnersPage.jsx'
import { NewCrematoriumPage } from './pages/NewCrematoriumPage.jsx'
import { ShippingPartnersPage } from './pages/ShippingPartnersPage.jsx'
import { CalendarPage } from './pages/CalendarPage.jsx'
import { BookCremationPage } from './pages/BookCremationPage.jsx'
import { DocumentsPage } from './pages/DocumentsPage.jsx'
import { EmailEditorPage } from './components/dashboard/EmailEditorPage.jsx'
import { RevenuePage } from './pages/RevenuePage.jsx'
import { SettingsPage } from './pages/SettingsPage.jsx'
import { CommandPaletteProvider } from './components/search/CommandPaletteProvider.jsx'

function CrematoriumResponsePageWithToken() {
  const { token } = useParams()
  return <CrematoriumResponsePage token={token} />
}

function ShippingResponsePageWithToken() {
  const { token } = useParams()
  return <ShippingResponsePage token={token} />
}

function AuthenticatedRoutes() {
  return (
    <CommandPaletteProvider>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
        <Route index element={<HomeDashboardPage />} />
        <Route path="inbox" element={<InboxPage />} />
        <Route path="cases" element={<CasesPage />} />
        <Route path="cases/new" element={<NewCasePage />} />
        <Route path="cases/:id" element={<CaseDetailPage />} />
        <Route path="crematoriums" element={<CrematoriumPartnersPage />} />
        <Route path="crematoriums/new" element={<NewCrematoriumPage />} />
        <Route path="crematoriums/:id" element={<CrematoriumPartnersPage />} />
        <Route path="shipping" element={<ShippingPartnersPage />} />
        <Route path="shipping/:id" element={<ShippingPartnersPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="book" element={<BookCremationPage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="email-editor" element={<EmailEditorPage />} />
        <Route path="financials" element={<RevenuePage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
      </Routes>
    </CommandPaletteProvider>
  )
}

function AppInner() {
  const { session } = useAuth()
  const { profile, loading: profileLoading, profileError } = useUser()

  const authLoading = session === undefined || (!!session && (profileLoading || (!profile && !profileError)))
  const showSkeleton = useDelayedLoading(authLoading)

  if (authLoading) return showSkeleton ? <AppSkeleton /> : null

  if (!session) return <LoginScreen />

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-canvas">
        <div className="text-center max-w-sm">
          <p className="font-sans text-sm text-muted">
            Your account isn't fully set up. Please contact your administrator.
          </p>
        </div>
      </div>
    )
  }

  return <AuthenticatedRoutes />
}

export default function App() {
  return (
    <DarkModeProvider>
      <AuthProvider>
        <UserProvider>
          <Routes>
            <Route path="/respond/:token" element={<CrematoriumResponsePageWithToken />} />
            <Route path="/respond-shipping/:token" element={<ShippingResponsePageWithToken />} />
            <Route path="/accept-invite" element={<AcceptInvitePage />} />
            <Route path="*" element={<AppInner />} />
          </Routes>
        </UserProvider>
      </AuthProvider>
    </DarkModeProvider>
  )
}
