import { requireProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { formatDate, isBeforeCutoff, nextDeliveryDate } from '@/lib/format'
import { DELIVERY_WINDOW } from '@/lib/constants'
import { Empty } from '@/components/ui'
import type { RetailerInventory, SupplierQuote } from '@/types'
import { OrderBuilder } from './OrderBuilder'

export default async function OrderPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; qty?: string }>
}) {
  const profile = await requireProfile('retailer')
  const { product, qty } = await searchParams
  const supabase = await createClient()

  const [{ data: quotes, error }, { data: inventory }] = await Promise.all([
    supabase.rpc('quote_suppliers'),
    supabase.from('retailer_inventory').select('*, product:products(*)').eq('retailer_id', profile.id),
  ])

  const nextDate = nextDeliveryDate()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-black uppercase tracking-tight">Order stock</h1>
        <p className="text-sm text-slate-600">
          Delivery {formatDate(nextDate)}, {DELIVERY_WINDOW}
          {!isBeforeCutoff() && ' (9 PM cutoff passed)'}. Prices below include the delivery fee to your shop.
        </p>
      </div>

      {profile.lat === null ? (
        <Empty>Set your shop location in Settings to see suppliers and delivery prices.</Empty>
      ) : error ? (
        <Empty>Could not load suppliers: {error.message}</Empty>
      ) : (
        <OrderBuilder
          quotes={(quotes ?? []) as SupplierQuote[]}
          inventory={(inventory ?? []) as RetailerInventory[]}
          initialProductId={product}
          initialQty={qty ? Number(qty) : undefined}
        />
      )}
    </div>
  )
}
