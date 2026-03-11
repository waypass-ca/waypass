import { useState } from 'react'
import { cases } from '../data/mockData'
import { Sidebar } from '../components/layout/Sidebar'
import { PageHeader } from '../components/layout/PageHeader'
import { StatsRow } from '../components/dashboard/StatsRow'
import { CasesTable } from '../components/dashboard/CasesTable'
import { RevenueChart } from '../components/dashboard/RevenueChart'
import { Button } from '../components/ui/Button'

export function FuneralDashboardPage() {
  const [activeItem, setActiveItem] = useState('dashboard')

  return (
    <div className="flex min-h-screen">
      <Sidebar activeItem={activeItem} onItemChange={setActiveItem} />

      <main className="flex-1 px-8 py-7 bg-cream overflow-auto">
        <PageHeader
          title="Dashboard"
          subtitle="Evergreen Memorial · San Francisco, CA"
          date="March 10, 2024"
          rightSlot={<Button variant="primary">+ New Case</Button>}
        />

        <StatsRow />

        <CasesTable cases={cases} />

        <RevenueChart />
      </main>
    </div>
  )
}
