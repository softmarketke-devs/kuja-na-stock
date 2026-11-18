import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { callbackTokenOk } from '@/lib/mpesa'

type Item = { Name: string; Value?: string | number }

// Safaricom posts the result of a payment prompt here. Only a request carrying our secret token is trusted,
// the order is found by the id we stored when we sent the prompt, and the database refuses a payment that is
// smaller than the order total. Safaricom expects a 200 with ResultCode 0 whatever we decide.
export async function POST(request: NextRequest) {
  const ok = NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
  if (!callbackTokenOk(request.nextUrl.searchParams.get('token'))) {
    return NextResponse.json({ ResultCode: 1, ResultDesc: 'Unauthorized' }, { status: 401 })
  }
  const body = await request.json().catch(() => null)
  const cb = body?.Body?.stkCallback
  if (!cb?.CheckoutRequestID) return ok
  if (cb.ResultCode !== 0) return ok // cancelled, wrong PIN or timed out: the order stays unpaid and the customer can try again

  const items: Item[] = cb.CallbackMetadata?.Item ?? []
  const get = (n: string) => items.find((i) => i.Name === n)?.Value
  const amount = Number(get('Amount'))
  const receipt = String(get('MpesaReceiptNumber') ?? '')
  if (!receipt || !Number.isFinite(amount)) return ok

  const admin = createAdminClient()
  const { data: order } = await admin.from('customer_orders').select('id').eq('mpesa_checkout_id', cb.CheckoutRequestID).maybeSingle()
  if (!order) return ok
  const { error } = await admin.rpc('mark_customer_order_paid', { p_order_id: order.id, p_receipt: receipt, p_amount: amount })
  if (error) console.error('[mpesa] could not record payment for order', order.id, error.message)
  return ok
}
