import Link from 'next/link'
import { requireProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { cancelCustomerOrder, payWithMpesa } from '@/app/actions/customer'
import { ActionForm, SubmitButton } from '@/components/ActionForm'
import { CustomerOrderCard } from '@/components/CustomerOrderCard'
import { Empty, SectionTitle, dangerButton, primaryButton } from '@/components/ui'
import { SUPPORT_WHATSAPP } from '@/lib/brand'
import type { CustomerOrder } from '@/types'

export default async function CustomerHome() {
  const profile = await requireProfile('customer')
  const supabase = await createClient()
  const { data } = await supabase.from('customer_orders').select('*').order('created_at', { ascending: false }).limit(50)
  const orders = (data ?? []) as CustomerOrder[]
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
              {o.status === 'quoted' && o.payment_method === 'mpesa' && (
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
