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

  const offers = ((quotes ?? []) as SupplierQuote[]).filter((q) => q.in_range)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: offers.map((q, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Product',
        name: q.product_name,
        category: q.category,
        offers: {
          '@type': 'Offer',
          price: q.price_per_unit,
          priceCurrency: 'KES',
          availability: q.available_qty > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          unitText: q.unit,
          seller: { '@type': 'Organization', name: q.supplier_name },
        },
      },
    })),
  }

  return (
    <div className="space-y-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <div>
        <h1 className="text-xl font-black uppercase tracking-tight">Order stock</h1>
        <p className="text-sm text-slate-600">
          Delivery {formatDate(nextDate)}, {DELIVERY_WINDOW}
          {!isBeforeCutoff() && ' (9 PM cutoff passed)'}. Prices below include the delivery fee to your butchery.
        </p>
      </div>

      {profile.lat === null ? (
        <Empty>Set your butchery location in Settings to see suppliers and delivery prices.</Empty>
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
