import { OrderCard } from './OrderCard'

export function OrderQueue({ orders, onAdvance }) {
  return (
    <div>
      {orders.map(order => (
        <OrderCard key={order.id} order={order} onAdvance={onAdvance} />
      ))}
    </div>
  )
}
