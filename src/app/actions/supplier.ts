'use server'

import { num, perform, rpc, str } from '@/lib/actions'
import type { ActionResult } from '@/types'

export async function respondToOrder(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return perform(async (supabase) => {
    const accept = str(formData, 'decision') === 'accept'
    await rpc(supabase, 'supplier_respond', {
      p_order_id: str(formData, 'order_id'),
      p_accept: accept,
      p_reason: str(formData, 'reason') || null,
    })
    return accept ? 'Confirmed. Stock reserved and added to the morning run.' : 'Order declined'
  })
}

export async function assignRider(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return perform(async (supabase) => {
    await rpc(supabase, 'supplier_assign_rider', {
      p_run_id: str(formData, 'run_id'),
      p_rider_phone: str(formData, 'rider_phone'),
    })
    return 'Rider booked. They have been notified.'
  })
}

export async function saveListing(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return perform(async (supabase, userId) => {
    const productId = str(formData, 'product_id')
    if (!productId) throw new Error('Choose a product')
    const row = {
      supplier_id: userId,
      product_id: productId,
      price_per_unit: num(formData, 'price_per_unit', { min: 0.01 }),
      available_qty: num(formData, 'available_qty'),
      min_order_qty: num(formData, 'min_order_qty', { min: 0.1 }),
      is_active: str(formData, 'is_active') !== 'false',
      updated_at: new Date().toISOString(),
    }
    const { error } = await supabase
      .from('supplier_listings')
      .upsert(row, { onConflict: 'supplier_id,product_id' })
    if (error) throw new Error(error.message)
    return 'Listing saved'
  })
}

export async function resolveIssue(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return perform(async (supabase) => {
    await rpc(supabase, 'resolve_issue', {
      p_issue_id: str(formData, 'issue_id'),
      p_resolution: str(formData, 'resolution'),
    })
    return 'Marked resolved. The retailer has been notified.'
  })
}
