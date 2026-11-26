'use server'

import { perform, rpc, str } from '@/lib/actions'
import type { ActionResult } from '@/types'

/** Admin adds or edits a cut: price per kg, kilos in stock, and whether customers can see it. */
export async function saveShopItem(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return perform(async (supabase) => {
    const priceRaw = str(formData, 'price')
    const stockRaw = str(formData, 'stock')
    await rpc(supabase, 'admin_save_shop_item', {
      p_id: str(formData, 'id') || null,
      p_name: str(formData, 'name'),
      p_blurb: str(formData, 'blurb') || null,
      p_price: priceRaw === '' ? null : Number(priceRaw),
      p_stock: stockRaw === '' ? null : Number(stockRaw),
      p_active: formData.get('active') === 'on',
      p_category: str(formData, 'category') || null,
    })
    return 'Saved.'
  })
}

/** The standard delivery fee every order uses. Orders whose cuts all have prices are priced automatically once it is set. */
export async function saveDeliveryFee(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return perform(async (supabase) => {
    const raw = str(formData, 'fee')
    await rpc(supabase, 'admin_set_delivery_fee', { p_fee: raw === '' ? null : Number(raw) })
    return 'Delivery fee saved. New orders with priced cuts are now priced automatically.'
  })
}
