import { useState, useEffect } from 'react'
import { fetchOrders } from '../lib/api.js'
import { useOrders } from '../hooks/useOrders'
import { PageHeader } from '../components/layout/PageHeader'
import { EarningsCard } from '../components/crematorium/EarningsCard'
import { OrderQueue } from '../components/crematorium/OrderQueue'

export function CrematoriumPortalPage() {
  const [initialOrders, setInitialOrders] = useState(null)
  const [error, setError] = useState(null)
  const { orders, advanceOrder } = useOrders(initialOrders ?? [])

  useEffect(() => {
    fetchOrders()
      .then(setInitialOrders)
      .catch(err => setError(err.message))
  }, [])

  if (initialOrders === null && !error) {
    return (
      <div className="px-8 py-7 bg-cream min-h-screen flex items-center justify-center">
        <p className="font-sans text-sm text-muted">Loading…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-8 py-7 bg-cream min-h-screen">
        <p className="font-sans text-sm text-red-soft">Failed to load orders: {error}</p>
      </div>
    )
  }

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
        <p className="font-sans text-sm text-muted mt-0.5">{orders.length} active orders · click action buttons to advance status</p>
      </div>

      <OrderQueue orders={orders} onAdvance={advanceOrder} />
    </div>
  )
}
