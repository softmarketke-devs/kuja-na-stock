import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { requireProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { ORDER_WITH_DETAILS } from '@/lib/queries'
import { formatDate } from '@/lib/format'
import { DELIVERY_WINDOW } from '@/lib/constants'
import { Card, OrderStatusBadge, PhoneLink } from '@/components/ui'
import type { Order } from '@/types'
import { TrackingMapLoader } from './TrackingMapLoader'

export default async function TrackOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireProfile('retailer')
  const { id } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from('orders')
    .select(ORDER_WITH_DETAILS)
    .eq('id', id)
    .eq('retailer_id', profile.id)
    .maybeSingle()
  if (!data) notFound()
  const order = data as Order

  const { data: loc } = order.run_id
    ? await supabase.from('run_locations').select('lat,lng,speed_kmh,updated_at').eq('run_id', order.run_id).maybeSingle()
    : { data: null }

  const supplier = order.supplier
  const rider = order.run?.rider
  const pickup = supplier?.lat != null && supplier?.lng != null ? { lat: supplier.lat, lng: supplier.lng } : null

  return (
    <div className="space-y-4">
      <Link href="/dashboard/retailer" className="inline-flex items-center gap-1 text-sm font-bold text-slate-600">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-black uppercase tracking-tight">Track order #{order.order_no}</h1>
          <p className="text-sm text-slate-600">
            {formatDate(order.delivery_date)}, {DELIVERY_WINDOW} · from {supplier?.business_name || supplier?.full_name}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {order.run_id ? (
        <TrackingMapLoader
          runId={order.run_id}
          pickup={pickup}
          dropoff={{ lat: order.delivery_lat, lng: order.delivery_lng }}
          initial={loc ?? null}
        />
      ) : (
        <Card className="p-4 text-sm text-slate-700">
          The map starts once your supplier confirms and a carrier takes the run. Status: {order.status}.
        </Card>
      )}

      <Card className="p-3 text-sm space-y-1">
        {rider ? (
          <p>
            Carrier: <span className="font-bold">{rider.full_name}</span> · <PhoneLink phone={rider.phone} />
            {rider.vehicle_reg && <> · {rider.vehicle_reg}</>}
          </p>
        ) : (
          <p className="text-slate-600">No carrier yet.</p>
        )}
        <p className="text-slate-600">
          <span className="font-bold text-slate-800">P</span> = supplier pickup, <span className="font-bold text-orange-700">B</span> = your butchery, 🚚 = the carrier.
        </p>
      </Card>
    </div>
  )
}
