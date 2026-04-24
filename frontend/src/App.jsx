import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { Navbar } from './components/layout/Navbar'
import { LoginScreen } from './components/auth/LoginScreen.jsx'
import { FamilyWidgetPage } from './pages/FamilyWidgetPage'
import { FuneralDashboardPage } from './pages/FuneralDashboardPage'
import { CrematoriumPortalPage } from './pages/CrematoriumPortalPage'

// Tabs 1 and 2 require authentication
const PROTECTED_TABS = [1, 2]

function AppInner() {
  const [activeTab, setActiveTab] = useState(0)
  const { session, user, signOut } = useAuth()

  // Still loading auth state
  if (session === undefined) return null

  const isProtected = PROTECTED_TABS.includes(activeTab)
  const needsLogin = isProtected && !session

  const pages = [
    <FamilyWidgetPage key="family" />,
    <FuneralDashboardPage key="funeral" />,
    <CrematoriumPortalPage key="crematorium" />,
  ]

  return (
    <div className="min-h-screen bg-canvas">
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        user={user}
        onSignOut={signOut}
      />
      <main>
        {needsLogin ? <LoginScreen /> : pages[activeTab]}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
