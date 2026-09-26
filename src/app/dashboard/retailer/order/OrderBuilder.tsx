'use client'

import { useMemo, useState } from 'react'
import { clsx } from 'clsx'
import { ShieldCheck, Trash2 } from 'lucide-react'
import { ksh, qty as fmtQty } from '@/lib/format'
import { placeOrder } from '@/app/actions/retailer'
import { ActionForm, SubmitButton } from '@/components/ActionForm'
import { Badge, Card, Empty, SectionTitle, inputClass, labelClass, primaryButton, secondaryButton } from '@/components/ui'
import type { RetailerInventory, SupplierQuote } from '@/types'

type BasketLine = { quote: SupplierQuote; quantity: number }
type Basket = Record<string, BasketLine[]> // supplier_id → lines

export function OrderBuilder({
  quotes,
  inventory,
  initialProductId,
  initialQty,
}: {
  quotes: SupplierQuote[]
  inventory: RetailerInventory[]
  initialProductId?: string
  initialQty?: number
}) {
  const products = useMemo(() => {
    const byId = new Map<string, { id: string; name: string; unit: string; category: string; from: number }>()
    for (const q of quotes) {
      if (!q.in_range) continue
      const cur = byId.get(q.product_id)
      if (!cur || q.price_per_unit < cur.from) {
        byId.set(q.product_id, { id: q.product_id, name: q.product_name, unit: q.unit, category: q.category, from: q.price_per_unit })
      }
    }
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name))
  }, [quotes])

  const lowStock = inventory.filter((i) => i.current_stock <= i.low_stock_threshold)
  const reorderQty = (productId: string) => inventory.find((i) => i.product_id === productId)?.reorder_qty

  const [productId, setProductId] = useState(
    initialProductId && products.some((p) => p.id === initialProductId) ? initialProductId : (products[0]?.id ?? ''),
  )
  const [quantity, setQuantity] = useState(String(initialQty ?? reorderQty(productId) ?? ''))
  const [basket, setBasket] = useState<Basket>({})
  const [addError, setAddError] = useState('')
  const [placed, setPlaced] = useState('')

  const selectProduct = (id: string) => {
    setProductId(id)
    setQuantity(String(reorderQty(id) ?? ''))
    setAddError('')
  }

  const q = Number(quantity)
  const product = products.find((p) => p.id === productId)

  const options = useMemo(() => {
    const rows = quotes
      .filter((o) => o.product_id === productId)
      .map((o) => {
        const feeCovered = Boolean(basket[o.supplier_id]?.length)
        const goods = (q > 0 ? q : o.min_order_qty) * o.price_per_unit
        return { ...o, feeCovered, landed: goods + (feeCovered ? 0 : o.delivery_fee) }
      })
    rows.sort((a, b) => Number(b.in_range) - Number(a.in_range) || a.landed - b.landed)
    return rows
  }, [quotes, productId, q, basket])

  const inRange = options.filter((o) => o.in_range)
  const bestTotal = inRange[0]?.listing_id
  const cheapestUnit = [...inRange].sort((a, b) => a.price_per_unit - b.price_per_unit)[0]?.listing_id
  const nearest = [...inRange].sort((a, b) => a.distance_km - b.distance_km)[0]?.listing_id

  const addToBasket = (quote: SupplierQuote) => {
    setAddError('')
    if (!(q > 0)) return setAddError('Enter how much you need')
    if (q < quote.min_order_qty) return setAddError(`${quote.supplier_name} sells at least ${fmtQty(quote.min_order_qty)} ${quote.unit}`)
    if (q > quote.available_qty) return setAddError(`${quote.supplier_name} only has ${fmtQty(quote.available_qty)} ${quote.unit}`)
    setBasket((prev) => {
      const next: Basket = {}
      // One supplier per product: drop this product from any other supplier's basket.
      for (const [sid, lines] of Object.entries(prev)) {
        const kept = lines.filter((l) => l.quote.product_id !== quote.product_id)
        if (kept.length) next[sid] = kept
      }
      next[quote.supplier_id] = [...(next[quote.supplier_id] ?? []), { quote, quantity: q }]
      return next
    })
  }

  const removeLine = (supplierId: string, listingId: string) =>
    setBasket((prev) => {
      const lines = (prev[supplierId] ?? []).filter((l) => l.quote.listing_id !== listingId)
      const next = { ...prev }
      if (lines.length) next[supplierId] = lines
      else delete next[supplierId]
      return next
    })

  const clearSupplier = (supplierId: string) =>
    setBasket((prev) => {
      const next = { ...prev }
      delete next[supplierId]
      return next
    })

  if (products.length === 0) {
    return <Empty>No suppliers deliver to your area yet. We’ll notify you when one lists stock near you.</Empty>
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_380px] items-start">
      <div className="space-y-4">
        {lowStock.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-bold text-red-700 uppercase">Running low:</span>
            {lowStock.map((i) => (
              <button
                key={i.id}
                type="button"
                onClick={() => selectProduct(i.product_id)}
                className="border border-red-300 bg-red-50 text-red-800 text-xs font-bold px-2.5 py-1"
              >
                {i.product?.name} ({fmtQty(i.current_stock)} left)
              </button>
            ))}
          </div>
        )}

        <Card className="p-4 space-y-3">
          <div className="grid grid-cols-[1fr_120px] gap-2">
            <div>
              <label className={labelClass} htmlFor="product">Product</label>
              <select id="product" value={productId} onChange={(e) => selectProduct(e.target.value)} className={inputClass}>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (from {ksh(p.from)}/{p.unit})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="qty">Qty ({product?.unit})</label>
              <input
                id="qty"
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          {addError && <p className="text-sm text-red-700">{addError}</p>}
        </Card>

        <div className="space-y-2">
          <SectionTitle>Compare suppliers</SectionTitle>
          {options.map((o) => (
            <Card key={o.listing_id} className={clsx('p-3', !o.in_range && 'opacity-60', o.listing_id === bestTotal && 'border-orange-400')}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-black">{o.supplier_name}</span>
                    {o.supplier_verified && <ShieldCheck className="w-4 h-4 text-emerald-600" aria-label="Verified" />}
                    <Badge color={o.supplier_type === 'farm' ? 'green' : 'slate'}>{o.supplier_type === 'farm' ? 'Farm' : 'Depot'}</Badge>
                    {o.listing_id === bestTotal && <Badge color="orange">Best total</Badge>}
                    {o.listing_id === cheapestUnit && o.listing_id !== bestTotal && <Badge color="blue">Lowest price</Badge>}
                    {o.listing_id === nearest && <Badge>Nearest</Badge>}
                  </div>
                  <div className="text-sm text-slate-600 mt-1">
                    {ksh(o.price_per_unit)}/{o.unit} · {o.distance_km} km ·{' '}
                    {o.feeCovered ? 'delivery already in basket' : `delivery ${ksh(o.delivery_fee)}`}
                  </div>
                  <div className="text-xs text-slate-500">
                    {fmtQty(o.available_qty)} {o.unit} available · min {fmtQty(o.min_order_qty)}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {o.in_range ? (
                    <>
                      <div className="text-lg font-black">{ksh(o.landed)}</div>
                      <button type="button" onClick={() => addToBasket(o)} className={primaryButton + ' !py-1.5 !px-3 !text-xs mt-1'}>
                        Add
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-slate-500">Doesn’t deliver this far</span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-3 lg:sticky lg:top-28">
        <SectionTitle>Basket</SectionTitle>
        {placed && (
          <p role="status" className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-2">
            {placed}
          </p>
        )}
        {Object.keys(basket).length === 0 ? (
          <Empty>Add items to order. Buying several items from one supplier means one delivery fee.</Empty>
        ) : (
          Object.entries(basket).map(([supplierId, lines]) => {
            const first = lines[0].quote
            const subtotal = lines.reduce((s, l) => s + l.quantity * l.quote.price_per_unit, 0)
            return (
              <Card key={supplierId} className="p-3 space-y-2">
                <div className="font-black">{first.supplier_name}</div>
                <ul className="text-sm divide-y divide-slate-100">
                  {lines.map((l) => (
                    <li key={l.quote.listing_id} className="flex items-center justify-between gap-2 py-1.5">
                      <span>
                        {fmtQty(l.quantity)} {l.quote.unit} {l.quote.product_name}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="font-bold">{ksh(l.quantity * l.quote.price_per_unit)}</span>
                        <button
                          type="button"
                          onClick={() => removeLine(supplierId, l.quote.listing_id)}
                          aria-label={`Remove ${l.quote.product_name}`}
                          className="text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </span>
                    </li>
                  ))}
                  <li className="flex justify-between py-1.5 text-slate-600">
                    <span>Delivery ({first.distance_km} km)</span>
                    <span>{ksh(first.delivery_fee)}</span>
                  </li>
                  <li className="flex justify-between py-1.5 font-black">
                    <span>Pay on delivery</span>
                    <span>{ksh(subtotal + first.delivery_fee)}</span>
                  </li>
                </ul>
                <ActionForm action={placeOrder} onSuccess={() => {
                    clearSupplier(supplierId)
                    setPlaced(`Order sent to ${first.supplier_name}. We will SMS you when they confirm.`)
                  }} className="space-y-2">
                  <input type="hidden" name="supplier_id" value={supplierId} />
                  <input
                    type="hidden"
                    name="items"
                    value={JSON.stringify(lines.map((l) => ({ listing_id: l.quote.listing_id, quantity: l.quantity })))}
                  />
                  <textarea name="notes" rows={2} placeholder="Note for the supplier (optional)" className={inputClass} />
                  <SubmitButton className={primaryButton + ' w-full'} pendingText="Placing order…">
                    Place order
                  </SubmitButton>
                </ActionForm>
                <button type="button" onClick={() => clearSupplier(supplierId)} className={secondaryButton + ' w-full !py-1.5 !text-xs'}>
                  Remove supplier
                </button>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
