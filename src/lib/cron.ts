import 'server-only'
import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from './supabase/admin'
import { flushSmsOutbox } from './sms'

/**
 * Runs a sweep function as the service role, then drains the SMS outbox.
 * Vercel Cron authenticates with `Authorization: Bearer $CRON_SECRET`.
 */
export async function runSweep(request: NextRequest, fn: 'evening_sweep' | 'morning_sweep' | null) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let result: unknown = null
  if (fn) {
    const { data, error } = await createAdminClient().rpc(fn)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    result = data
  }
  const sms = await flushSmsOutbox(200)
  return NextResponse.json({ result, sms })
}
