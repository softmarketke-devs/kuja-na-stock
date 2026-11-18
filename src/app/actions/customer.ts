'use server'

import { perform, rpc, str } from '@/lib/actions'
import { mpesaConfigured, stkPush } from '@/lib/mpesa'
import { createAdminClient } from '@/lib/supabase/admin'
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
      p_payment_method: str(formData, 'payment_method') || 'mpesa',
    })
    return `Order #${id} sent. We confirm the price and delivery next, and you pay once it is confirmed.`
  })
}

/** Sends the M-Pesa prompt for a priced order. The customer enters their PIN on their phone; the callback marks it paid. */
export async function payWithMpesa(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return perform(async (supabase) => {
    if (!mpesaConfigured()) throw new Error('M-Pesa payment is not switched on yet. Choose pay on delivery, or message us on WhatsApp.')
    const id = Number(str(formData, 'order_id'))
    // RLS means this only finds the signed-in customer's own order.
    const { data: order } = await supabase.from('customer_orders').select('id, status, phone, items_total_kes, delivery_fee_kes').eq('id', id).maybeSingle()
    if (!order || order.status !== 'quoted') throw new Error('This order is not ready to pay')
    if (!order.phone) throw new Error('Add your mobile number on your account page first')
    const total = Number(order.items_total_kes) + Number(order.delivery_fee_kes ?? 0)
    const checkoutId = await stkPush({ phone: order.phone, amount: total, orderId: order.id })
    // Only the server may write this (customers have no update rights), so it uses the service key.
    await createAdminClient().from('customer_orders').update({ mpesa_checkout_id: checkoutId }).eq('id', order.id)
    return 'Check your phone and enter your M-Pesa PIN. This page updates when the payment arrives.'
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
