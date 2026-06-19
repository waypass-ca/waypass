import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { DarkModeProvider } from './context/DarkModeContext.jsx'
import { LoginScreen } from './components/auth/LoginScreen.jsx'
import { FuneralDashboardPage } from './pages/FuneralDashboardPage'
import { CrematoriumResponsePage } from './pages/CrematoriumResponsePage.jsx'
import { ShippingResponsePage } from './pages/ShippingResponsePage.jsx'

function AppInner() {
  const { session } = useAuth()

  if (window.location.pathname.startsWith('/respond-shipping/')) {
    const token = window.location.pathname.split('/respond-shipping/')[1]
    return <ShippingResponsePage token={token} />
  }

  if (window.location.pathname.startsWith('/respond/')) {
    const token = window.location.pathname.split('/respond/')[1]
    return <CrematoriumResponsePage token={token} />
  }

  if (session === undefined) return null
  if (!session) return <LoginScreen />
  return <FuneralDashboardPage />
}

export default function App() {
  return (
    <DarkModeProvider>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </DarkModeProvider>
  )
}
