import 'server-only'
import { createClient } from './supabase/server'
import type { ShopItem } from '@/types'

/** The cuts that are switched on, in display order. Visible to everyone; the database hides the rest. */
export async function getShopItems(): Promise<ShopItem[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('shop_items')
    .select('id, name, blurb, image, price_per_kg, stock_kg, is_active')
    .eq('is_active', true)
    .order('sort_order')
    .order('name')
  return ((data ?? []) as ShopItem[]).map((i) => ({
    ...i,
    price_per_kg: i.price_per_kg === null ? null : Number(i.price_per_kg),
    stock_kg: Number(i.stock_kg),
  }))
}
