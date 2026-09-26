import { requireProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { formatDateTime } from '@/lib/format'
import { saveListing } from '@/app/actions/supplier'
import { ActionForm, SubmitButton } from '@/components/ActionForm'
import { Badge, Card, Empty, SectionTitle, inputClass, labelClass, primaryButton, secondaryButton } from '@/components/ui'
import type { Product, SupplierListing } from '@/types'

export default async function ListingsPage() {
  const profile = await requireProfile('supplier')
  const supabase = await createClient()
  const [{ data: listings }, { data: products }] = await Promise.all([
    supabase.from('supplier_listings').select('*, product:products(*)').eq('supplier_id', profile.id),
    supabase.from('products').select('*').order('name'),
  ])

  const mine = ((listings ?? []) as SupplierListing[]).sort((a, b) =>
    (a.product?.name ?? '').localeCompare(b.product?.name ?? ''),
  )
  const listed = new Set(mine.map((l) => l.product_id))
  const available = ((products ?? []) as Product[]).filter((p) => !listed.has(p.id))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black uppercase tracking-tight">My listings</h1>
        <p className="text-sm text-slate-600">
          Retailers within {profile.service_radius_km} km see these prices next to other suppliers. Stock is reserved
          when you confirm an order.
        </p>
      </div>

      <section>
        <SectionTitle>Listed products</SectionTitle>
        {mine.length === 0 ? (
          <Empty>List what you sell below. Keep prices honest: retailers compare you side by side.</Empty>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {mine.map((l) => (
              <Card key={l.id} className="p-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-black">{l.product?.name}</span>
                  {l.is_active ? <Badge color="green">Visible</Badge> : <Badge>Hidden</Badge>}
                </div>
                <ActionForm action={saveListing} className="space-y-2">
                  <input type="hidden" name="product_id" value={l.product_id} />
                  <ListingFields listing={l} unit={l.product?.unit ?? ''} />
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500">Updated {formatDateTime(l.updated_at)}</span>
                    <SubmitButton className={secondaryButton} pendingText="Saving…">
                      Save
                    </SubmitButton>
                  </div>
                </ActionForm>
              </Card>
            ))}
          </div>
        )}
      </section>

      {available.length > 0 && (
        <section>
          <SectionTitle>Add a product</SectionTitle>
          <Card className="p-3">
            <ActionForm action={saveListing} resetOnSuccess className="space-y-2">
              <div>
                <label className={labelClass} htmlFor="new_product">Product</label>
                <select id="new_product" name="product_id" required defaultValue="" className={inputClass}>
                  <option value="" disabled>
                    Choose…
                  </option>
                  {available.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (per {p.unit})
                    </option>
                  ))}
                </select>
              </div>
              <ListingFields />
              <SubmitButton className={primaryButton} pendingText="Adding…">
                Add listing
              </SubmitButton>
            </ActionForm>
          </Card>
        </section>
      )}
    </div>
  )
}

function ListingFields({ listing, unit }: { listing?: SupplierListing; unit?: string }) {
  const u = unit ? ` (${unit})` : ''
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      <div>
        <label className={labelClass}>Price / unit</label>
        <input name="price_per_unit" type="number" min={0.01} step="any" required defaultValue={listing?.price_per_unit} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>In stock{u}</label>
        <input name="available_qty" type="number" min={0} step="any" required defaultValue={listing?.available_qty} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Min order{u}</label>
        <input name="min_order_qty" type="number" min={0.1} step="any" required defaultValue={listing?.min_order_qty ?? 1} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Show</label>
        <select name="is_active" defaultValue={listing?.is_active === false ? 'false' : 'true'} className={inputClass}>
          <option value="true">Visible</option>
          <option value="false">Hidden</option>
        </select>
      </div>
    </div>
  )
}
