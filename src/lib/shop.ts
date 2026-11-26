import 'server-only'
import { createClient } from './supabase/server'
import { DEFAULT_ITEMS } from './default-items'
import type { ShopItem } from '@/types'

/** The standard delivery fee in KSh, or null until the owner has set it on the Stock page. */
export async function getDeliveryFee(): Promise<number | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('shop_settings').select('delivery_fee_kes').eq('id', 1).maybeSingle()
  return data?.delivery_fee_kes == null ? null : Number(data.delivery_fee_kes)
}

/**
 * The cuts on sale, in display order. These come from the shop's own stock list (set on the admin Stock page).
 * If that list is empty, or the stock migration has not been run yet, the homepage shows the standard list
 * instead of going blank.
 */
export async function getShopItems(): Promise<ShopItem[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('shop_items')
    .select('id, name, blurb, image, category, price_per_kg, stock_kg, is_active')
    .eq('is_active', true)
    .order('sort_order')
    .order('name')
  if (error || !data || data.length === 0) return DEFAULT_ITEMS
  return (data as ShopItem[]).map((i) => ({
    ...i,
    price_per_kg: i.price_per_kg === null ? null : Number(i.price_per_kg),
    stock_kg: Number(i.stock_kg),
  }))
}
