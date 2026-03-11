import { crematoriumOrders } from '../data/mockData'
import { useOrders } from '../hooks/useOrders'
import { PageHeader } from '../components/layout/PageHeader'
import { EarningsCard } from '../components/crematorium/EarningsCard'
import { OrderQueue } from '../components/crematorium/OrderQueue'

export function CrematoriumPortalPage() {
  const { orders, advanceOrder } = useOrders(crematoriumOrders)

  return (
    <div className="px-8 py-7 bg-cream min-h-screen">
      <PageHeader
        title="Crematorium Portal"
        subtitle="Evergreen Cremation Services · San Francisco, CA"
        date="March 10, 2024"
      />

      <EarningsCard />

      <div className="mb-4">
        <h2 className="font-display text-xl text-charcoal">Order Queue</h2>
        <p className="font-sans text-sm text-muted mt-0.5">3 active orders · click action buttons to advance status</p>
      </div>

      <OrderQueue orders={orders} onAdvance={advanceOrder} />
    </div>
  )
}
