import { formatDate, ksh, qty } from '@/lib/format'
import { DELIVERY_WINDOW } from '@/lib/constants'
import type { Order } from '@/types'
import { Card, OrderStatusBadge, PhoneLink } from './ui'

/** Order summary shared by the retailer and supplier views. */
export function OrderCard({
  order,
  counterparty,
  children,
}: {
  order: Order
  counterparty: 'supplier' | 'retailer'
  children?: React.ReactNode
}) {
  const party = counterparty === 'supplier' ? order.supplier : order.retailer
  const rider = order.run?.rider

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] text-slate-500 font-bold">
            #{order.order_no} · {formatDate(order.delivery_date)}, {DELIVERY_WINDOW}
          </div>
          <div className="font-black truncate">{party?.business_name || party?.full_name || '—'}</div>
          <div className="text-sm text-slate-600">
            <PhoneLink phone={party?.phone} />
            {counterparty === 'retailer' && <> · {order.delivery_address} · {order.distance_km} km</>}
          </div>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <ul className="text-sm divide-y divide-slate-100 border-y border-slate-100">
        {order.items?.map((item) => (
          <li key={item.id} className="flex justify-between py-1.5 gap-3">
            <span>
              {qty(item.quantity)} {item.product?.unit} {item.product?.name}
              <span className="text-slate-500"> @ {ksh(item.unit_price)}</span>
            </span>
            <span className="font-bold">{ksh(item.line_total)}</span>
          </li>
        ))}
        <li className="flex justify-between py-1.5 text-slate-600">
          <span>Delivery ({order.distance_km} km, paid to rider)</span>
          <span>{ksh(order.delivery_fee)}</span>
        </li>
        <li className="flex justify-between py-1.5 font-black">
          <span>Total</span>
          <span>{ksh(order.total)}</span>
        </li>
      </ul>

      {rider && (
        <p className="text-sm">
          Rider: <span className="font-bold">{rider.full_name}</span> · <PhoneLink phone={rider.phone} />
        </p>
      )}
      {order.status_reason && ['rejected', 'failed', 'cancelled'].includes(order.status) && (
        <p className="text-sm text-red-700">Reason: {order.status_reason}</p>
      )}
      {order.notes && <p className="text-sm text-slate-600">Note: {order.notes}</p>}
      {children}
    </Card>
  )
}
