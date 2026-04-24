import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { LoginScreen } from './components/auth/LoginScreen.jsx'
import { FuneralDashboardPage } from './pages/FuneralDashboardPage'

function AppInner() {
  const { session } = useAuth()
  if (session === undefined) return null
  if (!session) return <LoginScreen />
  return <FuneralDashboardPage />
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
