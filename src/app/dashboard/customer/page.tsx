import Link from 'next/link'
import { requireProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { cancelCustomerOrder, payWithMpesa } from '@/app/actions/customer'
import { ActionForm, SubmitButton } from '@/components/ActionForm'
import { CustomerOrderCard } from '@/components/CustomerOrderCard'
import { Empty, SectionTitle, dangerButton, primaryButton } from '@/components/ui'
import { SUPPORT_WHATSAPP } from '@/lib/brand'
import type { CustomerOrder, MpesaAttempt } from '@/types'

export default async function CustomerHome() {
  const profile = await requireProfile('customer')
  const supabase = await createClient()
  const { data } = await supabase.from('customer_orders').select('*').order('created_at', { ascending: false }).limit(50)
  const orders = (data ?? []) as CustomerOrder[]
  // The latest payment prompt for each order, so we can say what happened to it.
  const { data: attemptRows } = orders.length
    ? await supabase.from('mpesa_attempts').select('id, order_id, status, amount, receipt, result_desc, created_at').in('order_id', orders.map((o) => o.id)).order('created_at', { ascending: false })
    : { data: [] }
  const lastAttempt = new Map<number, MpesaAttempt>()
  for (const a of (attemptRows ?? []) as MpesaAttempt[]) if (!lastAttempt.has(a.order_id)) lastAttempt.set(a.order_id, a)
  const promptOpen = (a?: MpesaAttempt) => a?.status === 'pending' && Date.now() - new Date(a.created_at).getTime() < 3 * 60_000
  const first = profile.full_name.split(' ')[0]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">Hello{first ? `, ${first}` : ''}</h1>
        <Link href="/#order" className={primaryButton}>Order more cuts</Link>
      </div>
      <SectionTitle>My orders</SectionTitle>
      {orders.length === 0 ? (
        <Empty>No orders yet. Add cuts to your cart on the home page and place your first order.</Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {orders.map((o) => (
            <CustomerOrderCard key={o.id} order={o}>
              {lastAttempt.get(o.id)?.status === 'failed' && o.status === 'quoted' && (
                <p className="text-sm bg-orange-50 border border-orange-200 p-2">
                  Your last M-Pesa payment did not go through{lastAttempt.get(o.id)?.result_desc ? ` (${lastAttempt.get(o.id)?.result_desc})` : ''}. You were not charged. You can try again.
                </p>
              )}
              {lastAttempt.get(o.id)?.status === 'paid_needs_review' && (
                <p className="text-sm bg-sky-50 border border-sky-200 p-2">
                  We received an M-Pesa payment (code {lastAttempt.get(o.id)?.receipt}) that we are checking. We will contact you shortly, so there is no need to pay again.
                </p>
              )}
              {promptOpen(lastAttempt.get(o.id)) && o.status === 'quoted' && (
                <p className="text-sm bg-emerald-50 border border-emerald-200 p-2">A payment prompt was sent to {o.phone ?? 'your phone'}. Enter your M-Pesa PIN there. This page updates when it arrives.</p>
              )}
              {o.status === 'quoted' && o.payment_method === 'mpesa' && !promptOpen(lastAttempt.get(o.id)) && (
                <ActionForm action={payWithMpesa} className="space-y-2">
                  <input type="hidden" name="order_id" value={o.id} />
                  <SubmitButton pendingText="Sending prompt…">Pay with M-Pesa</SubmitButton>
                  <p className="text-xs text-slate-500">
                    You get a prompt on {o.phone ?? 'your phone'}. Prefer another way?{' '}
                    <a className="underline font-bold" href={`https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(`Hello, I would like to pay for order #${o.id}.`)}`} rel="noopener">
                      Message us on WhatsApp
                    </a>
                    .
                  </p>
                </ActionForm>
              )}
              {o.status === 'quoted' && o.payment_method === 'cash_on_delivery' && (
                <p className="text-sm bg-orange-50 border border-orange-200 p-2">Price confirmed. You pay when the meat arrives.</p>
              )}
              {(o.status === 'pending' || o.status === 'quoted') && (
                <ActionForm action={cancelCustomerOrder} confirmMessage="Cancel this order?">
                  <input type="hidden" name="order_id" value={o.id} />
                  <button type="submit" className={dangerButton}>Cancel order</button>
                </ActionForm>
              )}
            </CustomerOrderCard>
          ))}
        </div>
      )}
    </div>
  )
}
