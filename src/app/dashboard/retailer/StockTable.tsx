import Link from 'next/link'
import { clsx } from 'clsx'
import { qty } from '@/lib/format'
import { removeInventoryItem, saveInventoryItem } from '@/app/actions/retailer'
import { ActionForm, SubmitButton } from '@/components/ActionForm'
import { Card, Empty, inputClass, labelClass, primaryButton, secondaryButton } from '@/components/ui'
import type { Product, RetailerInventory } from '@/types'

export function StockTable({ stock, products }: { stock: RetailerInventory[]; products: Product[] }) {
  const tracked = new Set(stock.map((s) => s.product_id))
  const untracked = products.filter((p) => !tracked.has(p.id))

  return (
    <div className="space-y-3">
      {stock.length === 0 ? (
        <Empty>
          Track what you sell so we can warn you before you run out. Delivered orders are added to your stock
          automatically.
        </Empty>
      ) : (
        <div className="grid gap-2 md:grid-cols-2">
          {stock.map((item) => {
            const low = item.current_stock <= item.low_stock_threshold
            const pct = item.low_stock_threshold > 0 ? Math.min(100, (item.current_stock / (item.low_stock_threshold * 2)) * 100) : 100
            return (
              <Card key={item.id} className={clsx('p-3', low && 'border-red-300 bg-red-50/40')}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-black">{item.product?.name}</div>
                    <div className={clsx('text-sm', low ? 'text-red-700 font-bold' : 'text-slate-600')}>
                      {qty(item.current_stock)} {item.product?.unit} left
                      {low && ' · running low'}
                    </div>
                  </div>
                  {low && (
                    <Link
                      href={`/dashboard/retailer/order?product=${item.product_id}&qty=${item.reorder_qty}`}
                      className={primaryButton + ' !py-1.5 !px-3 !text-xs'}
                    >
                      Reorder {qty(item.reorder_qty)}
                    </Link>
                  )}
                </div>
                <div className="h-1.5 bg-slate-100 mt-2">
                  <div className={clsx('h-full', low ? 'bg-red-500' : 'bg-emerald-500')} style={{ width: `${pct}%` }} />
                </div>
                <details className="mt-2">
                  <summary className="text-xs font-bold text-slate-600 cursor-pointer">Update count</summary>
                  <ActionForm action={saveInventoryItem} className="mt-2 space-y-2">
                    <input type="hidden" name="product_id" value={item.product_id} />
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className={labelClass}>In stock</label>
                        <input name="current_stock" type="number" min={0} step="any" defaultValue={item.current_stock} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Warn at</label>
                        <input name="low_stock_threshold" type="number" min={0} step="any" defaultValue={item.low_stock_threshold} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Reorder</label>
                        <input name="reorder_qty" type="number" min={0.1} step="any" defaultValue={item.reorder_qty} className={inputClass} />
                      </div>
                    </div>
                    <SubmitButton className={secondaryButton + ' w-full'} pendingText="Saving…">
                      Save
                    </SubmitButton>
                  </ActionForm>
                  <ActionForm action={removeInventoryItem} className="mt-1" confirmMessage={`Stop tracking ${item.product?.name}?`}>
                    <input type="hidden" name="id" value={item.id} />
                    <SubmitButton className="text-xs text-red-700 underline" pendingText="Removing…">
                      Stop tracking
                    </SubmitButton>
                  </ActionForm>
                </details>
              </Card>
            )
          })}
        </div>
      )}

      {untracked.length > 0 && (
        <Card className="p-3">
          <ActionForm action={saveInventoryItem} resetOnSuccess className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-end">
            <div className="col-span-2">
              <label className={labelClass} htmlFor="track_product">Track another product</label>
              <select id="track_product" name="product_id" required className={inputClass} defaultValue="">
                <option value="" disabled>
                  Choose…
                </option>
                {untracked.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.unit})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>In stock</label>
              <input name="current_stock" type="number" min={0} step="any" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Warn at</label>
              <input name="low_stock_threshold" type="number" min={0} step="any" defaultValue={10} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Reorder</label>
              <input name="reorder_qty" type="number" min={0.1} step="any" defaultValue={20} className={inputClass} />
            </div>
            <div className="col-span-2 sm:col-span-5">
              <SubmitButton className={secondaryButton} pendingText="Adding…">
                Add
              </SubmitButton>
            </div>
          </ActionForm>
        </Card>
      )}
    </div>
  )
}
