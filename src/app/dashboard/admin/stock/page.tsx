import { requireProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { saveShopItem } from '@/app/actions/shop'
import { ActionForm, SubmitButton } from '@/components/ActionForm'
import { Badge, Card, SectionTitle, inputClass, labelClass } from '@/components/ui'
import type { ShopItem } from '@/types'

export default async function StockPage() {
  await requireProfile('admin')
  const supabase = await createClient()
  // Admins can read every cut, including the ones switched off.
  const { data } = await supabase.from('shop_items').select('id, name, blurb, image, price_per_kg, stock_kg, is_active').order('sort_order').order('name')
  const items = (data ?? []) as ShopItem[]

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Stock</h1>
      <p className="text-sm text-slate-600 max-w-2xl">
        This is what customers can buy. A cut shows on the website only when it is switched on and has a price. When the
        kilos reach 0 it shows as sold out, and orders take kilos off automatically (a cancelled order puts them back).
      </p>

      <SectionTitle>Add a cut</SectionTitle>
      <Card className="p-4">
        <ItemForm />
      </Card>

      <SectionTitle>Your cuts ({items.length})</SectionTitle>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((i) => (
          <Card key={i.id} className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold">{i.name}</span>
              {!i.is_active ? <Badge color="slate">Hidden</Badge> : i.stock_kg < 0.5 ? <Badge color="red">Sold out</Badge> : <Badge color="green">{i.stock_kg} kg left</Badge>}
            </div>
            <ItemForm item={i} />
          </Card>
        ))}
      </div>
    </div>
  )
}

function ItemForm({ item }: { item?: ShopItem }) {
  const k = item?.id ?? 'new'
  return (
    <ActionForm action={saveShopItem} resetOnSuccess={!item} className="grid grid-cols-2 gap-2 items-end">
      {item && <input type="hidden" name="id" value={item.id} />}
      {!item && (
        <div className="col-span-2">
          <label className={labelClass} htmlFor={`n-${k}`}>Name of the cut</label>
          <input id={`n-${k}`} name="name" required maxLength={60} className={inputClass} />
        </div>
      )}
      {item && <input type="hidden" name="name" value={item.name} />}
      <div>
        <label className={labelClass} htmlFor={`p-${k}`}>Price per kg (KSh)</label>
        <input id={`p-${k}`} name="price" type="number" min={1} step="1" defaultValue={item?.price_per_kg ?? ''} className={inputClass} />
      </div>
      <div>
        <label className={labelClass} htmlFor={`s-${k}`}>Kilos in stock</label>
        <input id={`s-${k}`} name="stock" type="number" min={0} step="0.5" required defaultValue={item?.stock_kg ?? 0} className={inputClass} />
      </div>
      <div className="col-span-2">
        <label className={labelClass} htmlFor={`b-${k}`}>Short description (optional)</label>
        <input id={`b-${k}`} name="blurb" maxLength={120} defaultValue={item?.blurb ?? ''} className={inputClass} />
      </div>
      <label className="col-span-2 flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked={item?.is_active ?? true} className="w-4 h-4 accent-[#8a6420]" />
        Show on the website
      </label>
      <div className="col-span-2">
        <SubmitButton pendingText="Saving…">{item ? 'Save' : 'Add cut'}</SubmitButton>
      </div>
    </ActionForm>
  )
}
