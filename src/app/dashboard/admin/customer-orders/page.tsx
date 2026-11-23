import { requireProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { quoteCustomerOrder, setCustomerOrderStatus } from '@/app/actions/customer'
import { ActionForm, SubmitButton } from '@/components/ActionForm'
import { CustomerOrderCard } from '@/components/CustomerOrderCard'
import { Empty, PhoneLink, SectionTitle, dangerButton, inputClass, labelClass, secondaryButton } from '@/components/ui'
import { formatDateTime, ksh } from '@/lib/format'
import type { CustomerOrder, MpesaAttempt } from '@/types'

type Row = CustomerOrder & { customer: { full_name: string; phone: string | null } | null }

export default async function CustomerOrdersAdmin() {
  await requireProfile('admin')
  const supabase = await createClient()
  const { data } = await supabase
    .from('customer_orders')
    .select('*, customer:profiles!customer_id(full_name, phone)')
    .order('created_at', { ascending: false })
    .limit(100)
  const orders = (data ?? []) as unknown as Row[]
  const { data: review } = await supabase
    .from('mpesa_attempts')
    .select('id, order_id, status, amount, receipt, result_desc, created_at')
    .eq('status', 'paid_needs_review')
    .order('created_at', { ascending: false })
    .limit(50)
  const needsReview = (review ?? []) as MpesaAttempt[]
  const closedStatus = (o: Row) => o.status === 'delivered' || o.status === 'cancelled'
  const open = orders.filter((o) => !closedStatus(o))
  const closed = orders.filter(closedStatus)

  const card = (o: Row) => (
    <CustomerOrderCard
      key={o.id}
      order={o}
      heading={
        <div className="text-sm text-slate-600">
          {o.customer?.full_name} · <PhoneLink phone={o.phone ?? o.customer?.phone} />
        </div>
      }
    >
      {(o.status === 'pending' || o.status === 'quoted') && (
        <ActionForm action={quoteCustomerOrder} className="grid grid-cols-2 gap-2 items-end">
          <input type="hidden" name="order_id" value={o.id} />
          <div>
            <label className={labelClass} htmlFor={`t${o.id}`}>Cuts total (KSh)</label>
            <input id={`t${o.id}`} name="items_total" type="number" min={1} step="1" required defaultValue={o.items_total_kes ?? o.estimated_total_kes ?? ''} className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor={`f${o.id}`}>Delivery (KSh)</label>
            <input id={`f${o.id}`} name="delivery_fee" type="number" min={0} step="1" required defaultValue={o.delivery_fee_kes ?? ''} className={inputClass} />
          </div>
          <div className="col-span-2">
            <SubmitButton pendingText="Sending…">{o.status === 'quoted' ? 'Update price' : 'Send price to customer'}</SubmitButton>
          </div>
        </ActionForm>
      )}
      {!closedStatus(o) && (
        <div className="flex flex-wrap gap-2">
          {o.status === 'quoted' && (
            <ActionForm action={setCustomerOrderStatus} confirmMessage="Mark as paid (cash or M-Pesa received)?">
              <input type="hidden" name="order_id" value={o.id} />
              <input type="hidden" name="status" value="paid" />
              <button type="submit" className={secondaryButton}>Mark paid</button>
            </ActionForm>
          )}
          {(o.status === 'quoted' || o.status === 'paid') && (
            <ActionForm action={setCustomerOrderStatus} confirmMessage="Mark as delivered?">
              <input type="hidden" name="order_id" value={o.id} />
              <input type="hidden" name="status" value="delivered" />
              <button type="submit" className={secondaryButton}>Mark delivered</button>
            </ActionForm>
          )}
          <ActionForm action={setCustomerOrderStatus} confirmMessage="Cancel this order?">
            <input type="hidden" name="order_id" value={o.id} />
            <input type="hidden" name="status" value="cancelled" />
            <button type="submit" className={dangerButton}>Cancel order</button>
          </ActionForm>
        </div>
      )}
    </CustomerOrderCard>
  )

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Customer orders</h1>
      <p className="text-sm text-slate-600 max-w-2xl">
        Orders are priced automatically from your stock prices and standard delivery fee, so customers can pay straight away. You only need to act on orders marked &quot;Waiting for price&quot; (a cut had no price, or no delivery fee is set). You can also change any open order&apos;s price here; the customer is told by SMS.
      </p>
      {needsReview.length > 0 && (
        <section className="border border-red-300 bg-red-50 p-4 space-y-2">
          <h2 className="font-bold text-red-800">M-Pesa payments that need you ({needsReview.length})</h2>
          <p className="text-sm text-red-900">
            Money arrived but could not be matched to an open order (it was cancelled, already paid, or the amount was too low).
            Refund the customer or fix the order in your M-Pesa portal, using the code below.
          </p>
          <ul className="text-sm divide-y divide-red-200">
            {needsReview.map((a) => (
              <li key={a.id} className="py-1.5">
                <strong>Order #{a.order_id}</strong> · code <strong>{a.receipt}</strong> · {formatDateTime(a.created_at)}
                <span className="block text-red-800">{a.result_desc}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <SectionTitle>Open ({open.length})</SectionTitle>
      {open.length === 0 ? <Empty>No open customer orders.</Empty> : <div className="grid gap-4 md:grid-cols-2">{open.map(card)}</div>}
      {closed.length > 0 && (
        <>
          <SectionTitle>Closed</SectionTitle>
          <div className="grid gap-4 md:grid-cols-2">{closed.map(card)}</div>
        </>
      )}
    </div>
  )
}
