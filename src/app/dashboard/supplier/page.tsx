import { requireProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { ORDER_WITH_DETAILS, RUN_WITH_ORDERS } from '@/lib/queries'
import { ISSUE_LABEL, formatDate, ksh, nairobiDate, qty } from '@/lib/format'
import { DELIVERY_WINDOW } from '@/lib/constants'
import { assignRider, resolveIssue, respondToOrder } from '@/app/actions/supplier'
import { ActionForm, SubmitButton } from '@/components/ActionForm'
import { OrderCard } from '@/components/OrderCard'
import {
  Card,
  Empty,
  OrderStatusBadge,
  PhoneLink,
  RunStatusBadge,
  SectionTitle,
  dangerButton,
  inputClass,
  primaryButton,
  secondaryButton,
} from '@/components/ui'
import type { DeliveryIssue, DeliveryRun, Order } from '@/types'

export default async function SupplierHome() {
  const profile = await requireProfile('supplier')
  const supabase = await createClient()
  const today = nairobiDate()

  const [{ data: pending }, { data: runs }, { data: issues }] = await Promise.all([
    supabase
      .from('orders')
      .select(ORDER_WITH_DETAILS)
      .eq('supplier_id', profile.id)
      .eq('status', 'pending')
      .order('delivery_date')
      .order('created_at'),
    supabase
      .from('delivery_runs')
      .select(RUN_WITH_ORDERS)
      .eq('supplier_id', profile.id)
      .gte('run_date', today)
      .neq('status', 'cancelled')
      .order('run_date')
      .order('created_at'),
    supabase
      .from('delivery_issues')
      .select('*, order:orders(order_no, delivery_date, retailer:profiles!orders_retailer_id_fkey(full_name, business_name, phone))')
      .eq('status', 'open')
      .order('created_at'),
  ])

  const pendingOrders = (pending ?? []) as Order[]
  const upcomingRuns = (runs ?? []) as DeliveryRun[]
  const openIssues = (issues ?? []) as (DeliveryIssue & {
    order: Pick<Order, 'order_no' | 'delivery_date'> & { retailer: Order['retailer'] }
  })[]

  return (
    <div className="space-y-6">
      <section>
        <SectionTitle aside={<span className="text-xs text-slate-500">Confirm before 4 AM or they’re cancelled</span>}>
          New orders ({pendingOrders.length})
        </SectionTitle>
        {pendingOrders.length === 0 ? (
          <Empty>No orders waiting. Keep your listings’ prices and stock up to date so retailers pick you.</Empty>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {pendingOrders.map((order) => (
              <OrderCard key={order.id} order={order} counterparty="retailer">
                <ActionForm action={respondToOrder} className="space-y-2">
                  <input type="hidden" name="order_id" value={order.id} />
                  <SubmitButton name="decision" value="accept" className={primaryButton + ' w-full'} pendingText="Saving…">
                    Confirm & reserve stock
                  </SubmitButton>
                  <details>
                    <summary className="text-sm text-red-700 font-bold cursor-pointer">Decline</summary>
                    <div className="mt-2 space-y-2">
                      <input name="reason" placeholder="Reason (e.g. tomatoes finished)" className={inputClass} />
                      <SubmitButton name="decision" value="reject" className={dangerButton + ' w-full'} pendingText="Saving…">
                        Decline order
                      </SubmitButton>
                    </div>
                  </details>
                </ActionForm>
              </OrderCard>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionTitle>Morning delivery runs</SectionTitle>
        {upcomingRuns.length === 0 ? (
          <Empty>Confirmed orders are grouped into one run per morning, and a rider collects them at 05:00.</Empty>
        ) : (
          <div className="space-y-3">
            {upcomingRuns.map((run) => (
              <RunCard key={run.id} run={run} />
            ))}
          </div>
        )}
      </section>

      {openIssues.length > 0 && (
        <section>
          <SectionTitle>Problems reported ({openIssues.length})</SectionTitle>
          <div className="grid gap-3 md:grid-cols-2">
            {openIssues.map((issue) => (
              <Card key={issue.id} className="p-4 space-y-2 border-red-300">
                <div className="text-[11px] text-slate-500 font-bold">
                  Order #{issue.order.order_no} · {formatDate(issue.order.delivery_date)}
                </div>
                <div className="font-black">
                  {ISSUE_LABEL[issue.issue_type]}
                  {issue.quantity_short ? `: ${qty(issue.quantity_short)} short` : ''}
                </div>
                <p className="text-sm">{issue.description}</p>
                <p className="text-sm">
                  {issue.order.retailer?.business_name || issue.order.retailer?.full_name} ·{' '}
                  <PhoneLink phone={issue.order.retailer?.phone} />
                </p>
                <ActionForm action={resolveIssue} className="space-y-2">
                  <input type="hidden" name="issue_id" value={issue.id} />
                  <input name="resolution" required placeholder="e.g. Refunded KSh 300 / replacing tomorrow" className={inputClass} />
                  <SubmitButton className={secondaryButton + ' w-full'} pendingText="Saving…">
                    Mark resolved
                  </SubmitButton>
                </ActionForm>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function RunCard({ run }: { run: DeliveryRun }) {
  const orders = (run.orders ?? []).sort((a, b) => a.distance_km - b.distance_km)
  const packing = new Map<string, { name: string; unit: string; quantity: number }>()
  for (const o of orders) {
    if (['cancelled', 'rejected'].includes(o.status)) continue
    for (const item of o.items ?? []) {
      const cur = packing.get(item.product_id)
      packing.set(item.product_id, {
        name: item.product?.name ?? '',
        unit: item.product?.unit ?? '',
        quantity: (cur?.quantity ?? 0) + Number(item.quantity),
      })
    }
  }

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-black">
            {formatDate(run.run_date)}, pickup 05:00 · {orders.length} drop{orders.length === 1 ? '' : 's'}
          </div>
          <div className="text-sm text-slate-600">
            Deliveries {DELIVERY_WINDOW} · rider earns {ksh(run.rider_fee)}
          </div>
        </div>
        <RunStatusBadge status={run.status} />
      </div>

      {run.rider ? (
        <p className="text-sm">
          Rider: <span className="font-bold">{run.rider.full_name}</span> · <PhoneLink phone={run.rider.phone} />
        </p>
      ) : (
        run.status === 'open' && (
          <div className="bg-orange-50 border border-orange-200 p-3 space-y-2">
            <p className="text-sm">
              Offered to nearby riders. Know a rider? Book them directly (they must be registered as a rider).
            </p>
            <ActionForm action={assignRider} className="flex gap-2">
              <input type="hidden" name="run_id" value={run.id} />
              <input name="rider_phone" type="tel" required placeholder="Rider phone 07…" className={inputClass} />
              <SubmitButton className={secondaryButton + ' shrink-0'} pendingText="Booking…">
                Book
              </SubmitButton>
            </ActionForm>
          </div>
        )
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <div className="text-[11px] font-bold uppercase text-slate-500 mb-1">Packing list</div>
          <ul className="text-sm border border-slate-200 divide-y divide-slate-100">
            {[...packing.values()].map((p) => (
              <li key={p.name} className="flex justify-between px-2 py-1">
                <span>{p.name}</span>
                <span className="font-bold">
                  {qty(p.quantity)} {p.unit}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-[11px] font-bold uppercase text-slate-500 mb-1">Drops</div>
          <ul className="text-sm border border-slate-200 divide-y divide-slate-100">
            {orders.map((o) => (
              <li key={o.id} className="px-2 py-1 flex justify-between gap-2">
                <span className="truncate">
                  #{o.order_no} {o.retailer?.business_name || o.retailer?.full_name} ({o.distance_km} km)
                </span>
                <OrderStatusBadge status={o.status} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  )
}
