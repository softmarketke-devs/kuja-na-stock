import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Navigation } from 'lucide-react'
import { requireProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { RUN_WITH_ORDERS } from '@/lib/queries'
import { formatDate, ksh, mapsLink, qty } from '@/lib/format'
import { DELIVERY_WINDOW } from '@/lib/constants'
import { pickUpRun, releaseRun } from '@/app/actions/rider'
import { ActionForm, SubmitButton } from '@/components/ActionForm'
import { Card, OrderStatusBadge, PhoneLink, RunStatusBadge, SectionTitle, dangerButton, primaryButton } from '@/components/ui'
import type { DeliveryRun } from '@/types'
import { DropActions } from './DropActions'

export default async function RunPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireProfile('rider')
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('delivery_runs')
    .select(RUN_WITH_ORDERS)
    .eq('id', id)
    .eq('rider_id', profile.id)
    .maybeSingle()
  if (!data) notFound()

  const run = data as DeliveryRun
  const supplier = run.supplier
  // Nearest-first from the pickup; good enough for a handful of drops.
  const drops = (run.orders ?? []).sort((a, b) => a.distance_km - b.distance_km)
  const live = drops.filter((o) => !['cancelled', 'rejected'].includes(o.status))

  const packing = new Map<string, string>()
  const totals = new Map<string, number>()
  for (const o of live) {
    for (const item of o.items ?? []) {
      totals.set(item.product_id, (totals.get(item.product_id) ?? 0) + Number(item.quantity))
      packing.set(item.product_id, `${item.product?.name} (${item.product?.unit})`)
    }
  }

  const collected = drops.reduce((s, o) => s + Number(o.payment?.amount ?? 0), 0)
  const cash = drops.reduce((s, o) => s + (o.payment?.method === 'cash' ? Number(o.payment.amount) : 0), 0)
  const deliveredFees = drops.filter((o) => o.status === 'delivered').reduce((s, o) => s + Number(o.delivery_fee), 0)

  return (
    <div className="space-y-5">
      <Link href="/dashboard/rider" className="inline-flex items-center gap-1 text-sm font-bold text-slate-600">
        <ArrowLeft className="w-4 h-4" /> My runs
      </Link>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-black uppercase tracking-tight">{formatDate(run.run_date)} run</h1>
          <p className="text-sm text-slate-600">
            Pickup 05:00 · deliver {DELIVERY_WINDOW} · earn {ksh(run.rider_fee)}
          </p>
        </div>
        <RunStatusBadge status={run.status} />
      </div>

      <section>
        <SectionTitle>1. Pick up</SectionTitle>
        <Card className="p-4 space-y-3">
          <div>
            <div className="font-black">{supplier?.business_name || supplier?.full_name}</div>
            <div className="text-sm text-slate-600">
              {supplier?.address} · <PhoneLink phone={supplier?.phone} />
            </div>
            {supplier?.lat != null && supplier?.lng != null && (
              <a href={mapsLink(supplier.lat, supplier.lng)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-bold text-orange-700 mt-1">
                <Navigation className="w-4 h-4" /> Directions
              </a>
            )}
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase text-slate-500 mb-1">Check you have everything</div>
            <ul className="text-sm border border-slate-200 divide-y divide-slate-100">
              {[...packing.entries()].map(([pid, name]) => (
                <li key={pid} className="flex justify-between px-2 py-1">
                  <span>{name}</span>
                  <span className="font-bold">{qty(totals.get(pid) ?? 0)}</span>
                </li>
              ))}
            </ul>
          </div>
          {run.status === 'assigned' && (
            <div className="grid gap-2 sm:grid-cols-2">
              <ActionForm action={pickUpRun} confirmMessage="Have you loaded every item on the list?">
                <input type="hidden" name="run_id" value={run.id} />
                <SubmitButton className={primaryButton + ' w-full'} pendingText="Saving…">
                  Goods collected, start deliveries
                </SubmitButton>
              </ActionForm>
              <ActionForm action={releaseRun} confirmMessage="Give this run back? The supplier will be told to find another rider.">
                <input type="hidden" name="run_id" value={run.id} />
                <SubmitButton className={dangerButton + ' w-full'} pendingText="Releasing…">
                  I can’t do this run
                </SubmitButton>
              </ActionForm>
            </div>
          )}
        </Card>
      </section>

      <section>
        <SectionTitle>2. Deliver ({drops.length})</SectionTitle>
        <div className="space-y-3">
          {drops.map((order, i) => (
            <Card key={order.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[11px] text-slate-500 font-bold">
                    Stop {i + 1} · #{order.order_no} · {order.distance_km} km from pickup
                  </div>
                  <div className="font-black">{order.retailer?.business_name || order.retailer?.full_name}</div>
                  <div className="text-sm text-slate-600">
                    {order.delivery_address} · <PhoneLink phone={order.retailer?.phone} />
                  </div>
                  <a
                    href={mapsLink(order.delivery_lat, order.delivery_lng)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-bold text-orange-700"
                  >
                    <Navigation className="w-4 h-4" /> Directions
                  </a>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>
              <ul className="text-sm text-slate-700">
                {order.items?.map((item) => (
                  <li key={item.id}>
                    {qty(item.quantity)} {item.product?.unit} {item.product?.name}
                  </li>
                ))}
              </ul>
              <div className="flex justify-between text-sm font-black border-t border-slate-100 pt-2">
                <span>Collect</span>
                <span>{ksh(order.total)}</span>
              </div>
              {order.payment && (
                <p className="text-sm text-emerald-800">
                  Collected {ksh(order.payment.amount)} by {order.payment.method === 'mpesa' ? `M-Pesa ${order.payment.mpesa_ref}` : 'cash'}
                </p>
              )}
              {order.status === 'failed' && order.status_reason && (
                <p className="text-sm text-red-700">Not delivered: {order.status_reason}</p>
              )}
              {order.status === 'picked_up' && <DropActions orderId={order.id} total={Number(order.total)} />}
            </Card>
          ))}
        </div>
      </section>

      {collected > 0 && (
        <section>
          <SectionTitle>3. Settle with the supplier</SectionTitle>
          <Card className="p-4 text-sm space-y-1">
            <div className="flex justify-between">
              <span>Collected (all methods)</span>
              <span className="font-bold">{ksh(collected)}</span>
            </div>
            <div className="flex justify-between">
              <span>Cash in hand</span>
              <span className="font-bold">{ksh(cash)}</span>
            </div>
            <div className="flex justify-between">
              <span>Your delivery fees</span>
              <span className="font-bold">{ksh(deliveredFees)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-1 font-black">
              <span>Owed to supplier (goods)</span>
              <span>{ksh(collected - deliveredFees)}</span>
            </div>
            <p className="text-xs text-slate-500 pt-1">
              Hand the supplier their share in cash or by M-Pesa, and keep your fees.
            </p>
          </Card>
        </section>
      )}
    </div>
  )
}
