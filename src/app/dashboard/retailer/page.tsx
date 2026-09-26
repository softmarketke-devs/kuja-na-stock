import Link from 'next/link'
import { KeyRound, Moon, RotateCcw } from 'lucide-react'
import { requireProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { ACTIVE_ORDER_STATUSES, ORDER_WITH_DETAILS } from '@/lib/queries'
import { formatDate, isBeforeCutoff, nextDeliveryDate } from '@/lib/format'
import { DELIVERY_WINDOW } from '@/lib/constants'
import { cancelOrder, reorderLast } from '@/app/actions/retailer'
import { ActionForm, SubmitButton } from '@/components/ActionForm'
import { OrderCard } from '@/components/OrderCard'
import { Card, Empty, SectionTitle, dangerButton, primaryButton, secondaryButton } from '@/components/ui'
import type { Order, Product, RetailerInventory } from '@/types'
import { StockTable } from './StockTable'

export default async function RetailerHome() {
  const profile = await requireProfile('retailer')
  const supabase = await createClient()

  const [{ data: orders }, { data: inventory }, { data: products }] = await Promise.all([
    supabase
      .from('orders')
      .select(ORDER_WITH_DETAILS)
      .eq('retailer_id', profile.id)
      .in('status', ACTIVE_ORDER_STATUSES)
      .order('delivery_date')
      .order('created_at'),
    supabase.from('retailer_inventory').select('*, product:products(*)').eq('retailer_id', profile.id),
    supabase.from('products').select('*').order('name'),
  ])

  const activeOrders = (orders ?? []) as Order[]
  const stock = ((inventory ?? []) as RetailerInventory[]).sort((a, b) =>
    (a.product?.name ?? '').localeCompare(b.product?.name ?? ''),
  )
  const lowCount = stock.filter((s) => s.current_stock <= s.low_stock_threshold).length
  const nextDate = nextDeliveryDate()

  return (
    <div className="space-y-6">
      <Card className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-l-4 border-l-orange-500">
        <div className="flex items-start gap-3">
          <Moon className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-black">
              Order now → delivered {formatDate(nextDate)}, {DELIVERY_WINDOW}
            </p>
            <p className="text-sm text-slate-600">
              {isBeforeCutoff()
                ? 'Orders placed before 9 PM arrive tomorrow morning, before you open.'
                : 'Tonight’s 9 PM cutoff has passed. New orders arrive the morning after tomorrow.'}
            </p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link href="/dashboard/retailer/order" className={primaryButton}>
            Order stock
          </Link>
          <ActionForm action={reorderLast} confirmMessage="Repeat your last order at today's prices?">
            <SubmitButton className={secondaryButton} pendingText="Ordering…">
              <RotateCcw className="w-4 h-4" /> Repeat last
            </SubmitButton>
          </ActionForm>
        </div>
      </Card>

      <section>
        <SectionTitle>Coming deliveries</SectionTitle>
        {activeOrders.length === 0 ? (
          <Empty>No deliveries booked. Order before 9 PM to be stocked by 7 AM.</Empty>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {activeOrders.map((order) => (
              <OrderCard key={order.id} order={order} counterparty="supplier">
                {order.secret && order.status !== 'pending' && (
                  <div className="bg-slate-900 text-white p-3 flex items-center gap-3">
                    <KeyRound className="w-5 h-5 text-orange-400 shrink-0" />
                    <div className="text-sm">
                      Delivery code <span className="text-2xl font-black tracking-[0.3em] ml-1">{order.secret.delivery_code}</span>
                      <p className="text-xs text-slate-300">Check the goods first, then give this code to the rider.</p>
                    </div>
                  </div>
                )}
                {order.status === 'pending' && (
                  <ActionForm action={cancelOrder} confirmMessage={`Cancel order #${order.order_no}?`}>
                    <input type="hidden" name="order_id" value={order.id} />
                    <SubmitButton className={dangerButton} pendingText="Cancelling…">
                      Cancel order
                    </SubmitButton>
                  </ActionForm>
                )}
              </OrderCard>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionTitle aside={lowCount > 0 && <span className="text-xs font-bold text-red-700">{lowCount} running low</span>}>
          My stock
        </SectionTitle>
        <StockTable stock={stock} products={(products ?? []) as Product[]} />
      </section>
    </div>
  )
}
