import { Badge, Card } from '@/components/ui'
import { formatDateTime, ksh, qty } from '@/lib/format'
import type { CustomerOrder, CustomerOrderStatus } from '@/types'

export const CUSTOMER_STATUS: Record<CustomerOrderStatus, { label: string; color: 'orange' | 'blue' | 'green' | 'slate' }> = {
  pending: { label: 'Waiting for price', color: 'orange' },
  quoted: { label: 'Price confirmed', color: 'blue' },
  paid: { label: 'Paid', color: 'blue' },
  delivered: { label: 'Delivered', color: 'green' },
  cancelled: { label: 'Cancelled', color: 'slate' },
}

/** One customer order: items, address and (once an admin has confirmed it) the price. Actions go in children. */
export function CustomerOrderCard({ order, heading, children }: { order: CustomerOrder; heading?: React.ReactNode; children?: React.ReactNode }) {
  const s = CUSTOMER_STATUS[order.status]
  const total = order.items_total_kes === null ? null : Number(order.items_total_kes) + Number(order.delivery_fee_kes ?? 0)
  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-bold">#{order.id} · {formatDateTime(order.created_at)}</div>
          {heading}
        </div>
        <Badge color={s.color}>{s.label}</Badge>
      </div>
      <ul className="text-sm divide-y divide-slate-200 border-y border-slate-200">
        {order.items.map((i) => (
          <li key={i.name} className="flex justify-between py-1.5">
            <span>{i.name}</span>
            <span className="tabular-nums">{qty(i.kg)} kg</span>
          </li>
        ))}
      </ul>
      <p className="text-sm text-slate-600">Deliver to: {order.delivery_address}</p>
      {order.notes && <p className="text-sm text-slate-600">Note: {order.notes}</p>}
      {total !== null ? (
        <div className="text-sm">
          <div className="flex justify-between"><span>Cuts</span><span>{ksh(order.items_total_kes)}</span></div>
          <div className="flex justify-between"><span>Delivery</span><span>{ksh(order.delivery_fee_kes)}</span></div>
          <div className="flex justify-between font-bold border-t border-slate-200 mt-1 pt-1"><span>Total</span><span>{ksh(total)}</span></div>
        </div>
      ) : (
        <p className="text-sm text-slate-500">We are confirming the price and delivery for your order.</p>
      )}
      {children}
    </Card>
  )
}
