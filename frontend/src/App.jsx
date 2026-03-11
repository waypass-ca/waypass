import { useState } from 'react'
import { Navbar } from './components/layout/Navbar'
import { FamilyWidgetPage } from './pages/FamilyWidgetPage'
import { FuneralDashboardPage } from './pages/FuneralDashboardPage'
import { CrematoriumPortalPage } from './pages/CrematoriumPortalPage'

export default function App() {
  const [activeTab, setActiveTab] = useState(0)

  const pages = [
    <FamilyWidgetPage key="family" />,
    <FuneralDashboardPage key="funeral" />,
    <CrematoriumPortalPage key="crematorium" />,
  ]

  return (
    <div className="min-h-screen bg-cream">
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
      <main>{pages[activeTab]}</main>
    </div>
  )
}
