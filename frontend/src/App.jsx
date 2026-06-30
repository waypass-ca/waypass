import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { UserProvider, useUser } from './context/UserContext.jsx'
import { DarkModeProvider } from './context/DarkModeContext.jsx'
import { LoginScreen } from './components/auth/LoginScreen.jsx'
import { FuneralDashboardPage } from './pages/FuneralDashboardPage'
import { CrematoriumResponsePage } from './pages/CrematoriumResponsePage.jsx'
import { ShippingResponsePage } from './pages/ShippingResponsePage.jsx'
import { AcceptInvitePage } from './pages/AcceptInvitePage.jsx'

function AppInner() {
  const { session } = useAuth()
  const { profile, loading: profileLoading } = useUser()

  if (window.location.pathname.startsWith('/respond-shipping/')) {
    const token = window.location.pathname.split('/respond-shipping/')[1]
    return <ShippingResponsePage token={token} />
  }

  if (window.location.pathname.startsWith('/respond/')) {
    const token = window.location.pathname.split('/respond/')[1]
    return <CrematoriumResponsePage token={token} />
  }

  if (window.location.pathname.startsWith('/accept-invite')) {
    return <AcceptInvitePage />
  }

  if (session === undefined || (session && profileLoading)) return null
  if (!profile) return <LoginScreen />

  // Logged in but no profile/funeral home yet (shouldn't normally happen)
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

  return <FuneralDashboardPage />
}

export default function App() {
  return (
    <DarkModeProvider>
      <AuthProvider>
        <UserProvider>
          <AppInner />
        </UserProvider>
      </AuthProvider>
    </DarkModeProvider>
  )
}
