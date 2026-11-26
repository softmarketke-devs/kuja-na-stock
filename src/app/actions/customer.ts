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
    const { data: order } = await supabase.from('customer_orders').select('status').eq('id', id).maybeSingle()
    return order?.status === 'quoted'
      ? `Order #${id} placed. The price is ready: open My orders to pay.`
      : `Order #${id} sent. We confirm the price next, and you pay once it is confirmed.`
  })
}

/** Sends the M-Pesa prompt for a priced order. The customer enters their PIN on their phone; the callback marks it paid. */
export async function payWithMpesa(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return perform(async (_supabase, userId) => {
    if (!mpesaConfigured()) throw new Error('M-Pesa payment is not switched on yet. Choose pay on delivery, or message us on WhatsApp.')
    const id = Number(str(formData, 'order_id'))
    const admin = createAdminClient()
    // The database checks this is the customer's own priced order and that no prompt is already open, then reserves
    // an attempt. Only after that do we ask Safaricom, so tapping twice can never send two prompts.
    const { data: begun, error } = await admin.rpc('begin_mpesa_attempt', { p_order_id: id, p_customer: userId })
    const attempt = (begun as { o_attempt_id: number; o_amount: number; o_phone: string }[] | null)?.[0]
    if (error || !attempt) throw new Error(error?.message || 'This order is not ready to pay')
    const attemptId = attempt.o_attempt_id
    let checkoutId: string
    try {
      checkoutId = await stkPush({ phone: attempt.o_phone, amount: Number(attempt.o_amount), orderId: id })
    } catch (e) {
      // Whatever went wrong, close the attempt so the customer can retry. If the prompt did in fact go out (a slow
      // request we gave up on), the database still accepts a payment that arrives for it later.
      const { error: failErr } = await admin.rpc('fail_mpesa_attempt', { p_attempt_id: attemptId, p_reason: e instanceof Error ? e.message : 'Could not send the prompt' })
      if (failErr) console.error('[mpesa] could not mark attempt', attemptId, 'failed:', failErr.message)
      throw e
    }
    // Store Safaricom's id so the callback can find this attempt. The database also applies any answer that beat us
    // here. The prompt is already on the customer's phone, so a storage hiccup is retried, never shown as a failure.
    let stored = await admin.rpc('set_mpesa_attempt_checkout', { p_attempt_id: attemptId, p_checkout_id: checkoutId })
    if (stored.error) stored = await admin.rpc('set_mpesa_attempt_checkout', { p_attempt_id: attemptId, p_checkout_id: checkoutId })
    if (stored.error || stored.data === 'not_set') {
      console.error('[mpesa] could not store checkout id', checkoutId, 'for attempt', attemptId, stored.error?.message ?? '(already set elsewhere)')
    }
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
