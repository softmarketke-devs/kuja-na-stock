import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { callbackTokenOk } from '@/lib/mpesa'

type Item = { Name: string; Value?: string | number }

// Safaricom posts the answer to a payment prompt here (paid, cancelled, wrong PIN, timed out). Only a request carrying
// our secret token is trusted. The database does the rest: it finds the prompt by Safaricom's id, marks the order paid
// when the amount covers it, and otherwise flags the payment for the owner to review instead of dropping it.
// Safaricom expects a 200 with ResultCode 0 whatever we decide.
export async function POST(request: NextRequest) {
  const ok = NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
  if (!callbackTokenOk(request.nextUrl.searchParams.get('token'))) {
    return NextResponse.json({ ResultCode: 1, ResultDesc: 'Unauthorized' }, { status: 401 })
  }
  const body = await request.json().catch(() => null)
  const cb = body?.Body?.stkCallback
  if (!cb?.CheckoutRequestID) return ok

  const items: Item[] = cb.CallbackMetadata?.Item ?? []
  const get = (n: string) => items.find((i) => i.Name === n)?.Value
  const amount = Number(get('Amount'))
  const receipt = get('MpesaReceiptNumber')

  const { data, error } = await createAdminClient().rpc('apply_mpesa_result', {
    p_checkout_id: String(cb.CheckoutRequestID),
    p_result_code: Number(cb.ResultCode ?? 1),
    p_desc: typeof cb.ResultDesc === 'string' ? cb.ResultDesc : null,
    p_amount: Number.isFinite(amount) ? amount : null,
    p_receipt: receipt === undefined ? null : String(receipt),
  })
  if (error) console.error('[mpesa] could not record the answer for', cb.CheckoutRequestID, error.message)
  else if (data === 'stored') console.warn('[mpesa] answer arrived before its prompt was stored; kept to apply when it is:', cb.CheckoutRequestID)
  else if (data === 'needs_review') console.warn('[mpesa] a payment needs the owner to review it:', cb.CheckoutRequestID)
  return ok
}
