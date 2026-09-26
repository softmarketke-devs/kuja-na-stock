'use server'

import { num, perform, rpc, str } from '@/lib/actions'
import { formatDate } from '@/lib/format'
import type { ActionResult } from '@/types'

type BasketLine = { listing_id: string; quantity: number }

export async function placeOrder(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return perform(async (supabase) => {
    const supplierId = str(formData, 'supplier_id')
    let items: BasketLine[]
    try {
      items = JSON.parse(str(formData, 'items'))
    } catch {
      throw new Error('Your basket could not be read. Refresh and try again')
    }
    if (!supplierId || !Array.isArray(items) || items.length === 0) throw new Error('Your basket is empty')

    await rpc(supabase, 'place_order', {
      p_supplier_id: supplierId,
      p_items: items.map((i) => ({ listing_id: String(i.listing_id), quantity: Number(i.quantity) })),
      p_notes: str(formData, 'notes') || null,
    })
    return 'Order sent. We will SMS you when the supplier confirms.'
  })
}

export async function reorderLast(): Promise<ActionResult> {
  return perform(async (supabase) => {
    const res = await rpc<{ placed: number; skipped: number; delivery_date: string }>(
      supabase,
      'reorder_last_delivery',
    )
    if (res.placed === 0) {
      throw new Error(
        'Nothing could be reordered. The items are out of stock, or you already have orders for that morning',
      )
    }
    return `${res.placed} order(s) placed for ${formatDate(res.delivery_date)}${
      res.skipped ? `. ${res.skipped} skipped (out of stock or already ordered)` : ''
    }.`
  })
}

export async function cancelOrder(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return perform(async (supabase) => {
    await rpc(supabase, 'cancel_order', { p_order_id: str(formData, 'order_id') })
    return 'Order cancelled'
  })
}

export async function reportIssue(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return perform(async (supabase) => {
    const short = str(formData, 'quantity_short')
    await rpc(supabase, 'report_issue', {
      p_order_id: str(formData, 'order_id'),
      p_type: str(formData, 'issue_type'),
      p_description: str(formData, 'description'),
      p_quantity_short: short ? Number(short) : null,
    })
    return 'Reported. The supplier has been notified by SMS.'
  })
}

export async function saveInventoryItem(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return perform(async (supabase, userId) => {
    const row = {
      retailer_id: userId,
      product_id: str(formData, 'product_id'),
      current_stock: num(formData, 'current_stock'),
      low_stock_threshold: num(formData, 'low_stock_threshold'),
      reorder_qty: num(formData, 'reorder_qty', { min: 0.1 }),
      updated_at: new Date().toISOString(),
    }
    if (!row.product_id) throw new Error('Choose a product')
    const { error } = await supabase
      .from('retailer_inventory')
      .upsert(row, { onConflict: 'retailer_id,product_id' })
    if (error) throw new Error(error.message)
    return 'Stock updated'
  })
}

export async function removeInventoryItem(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return perform(async (supabase) => {
    const { error } = await supabase.from('retailer_inventory').delete().eq('id', str(formData, 'id'))
    if (error) throw new Error(error.message)
  })
}
