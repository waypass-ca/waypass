import { useState } from 'react'

export function useOrders(initialOrders) {
  const [orders, setOrders] = useState(initialOrders)

  function advanceOrder(id) {
    setOrders(prev =>
      prev.map(order =>
        order.id === id && order.status < 3
          ? { ...order, status: order.status + 1 }
          : order
      )
    )
  }

  return { orders, advanceOrder }
}
