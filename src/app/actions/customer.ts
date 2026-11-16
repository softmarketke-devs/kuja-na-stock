'use server'

import { perform, rpc, str } from '@/lib/actions'
import type { ActionResult } from '@/types'

/** A signed-in customer sends their cart. The database checks the role, the cut count and the kg limits. */
export async function placeCustomerOrder(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return perform(async (supabase) => {
    let items: unknown
    try {
      items = JSON.parse(str(formData, 'items'))
    } catch {
      throw new Error('Your cart could not be read. Reload and try again')
    }
    const id = await rpc<number>(supabase, 'place_customer_order', {
      p_items: items,
      p_address: str(formData, 'address'),
      p_notes: str(formData, 'notes') || null,
    })
    return `Order #${id} sent. We confirm the price and delivery next, and you pay once it is confirmed.`
  })
}

export async function cancelCustomerOrder(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return perform(async (supabase) => {
    await rpc(supabase, 'customer_cancel_order', { p_order_id: Number(str(formData, 'order_id')) })
    return 'Order cancelled.'
  })
}

export async function quoteCustomerOrder(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return perform(async (supabase) => {
    await rpc(supabase, 'admin_quote_customer_order', {
      p_order_id: Number(str(formData, 'order_id')),
      p_items_total: Number(str(formData, 'items_total')),
      p_delivery_fee: Number(str(formData, 'delivery_fee')),
    })
    return 'Price sent to the customer.'
  })
}

export async function setCustomerOrderStatus(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return perform(async (supabase) => {
    const status = str(formData, 'status')
    await rpc(supabase, 'admin_set_customer_order_status', { p_order_id: Number(str(formData, 'order_id')), p_status: status })
    return `Marked ${status}.`
  })
}
