import { useState, useEffect } from 'react'
import { advanceOrder as apiAdvanceOrder } from '../lib/api.js'

export function useOrders(initialOrders) {
  const [orders, setOrders] = useState(initialOrders)

  // Sync when parent provides fetched data
  useEffect(() => {
    if (initialOrders.length > 0) setOrders(initialOrders)
  }, [initialOrders])

  async function advanceOrder(id) {
    // Optimistic update
    setOrders(prev =>
      prev.map(order =>
        order.id === id && order.status < 3
          ? { ...order, status: order.status + 1 }
          : order
      )
    )
    try {
      const updated = await apiAdvanceOrder(id)
      // Reconcile with server response
      setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updated } : o))
    } catch (err) {
      console.error('Failed to advance order:', err.message)
      // Rollback
      setOrders(prev =>
        prev.map(order =>
          order.id === id && order.status > 0
            ? { ...order, status: order.status - 1 }
            : order
        )
      )
    }
  }

  return { orders, advanceOrder }
}
