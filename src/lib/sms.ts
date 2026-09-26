import 'server-only'
import { createAdminClient } from './supabase/admin'

// Drains public.sms_outbox (filled by notify() in the database) through
// Africa's Talking. Safe to call concurrently: claim_sms_batch() locks rows.
//
// Env: AT_USERNAME, AT_API_KEY, optional AT_SENDER_ID. AT_USERNAME=sandbox
// uses the sandbox API. Without credentials, messages are logged and marked
// 'skipped' so they don't pile up and fire later.

type OutboxRow = { id: number; to_phone: string; message: string; attempts: number }

const AT_SUCCESS_CODES = new Set([100, 101, 102])

async function sendViaAfricasTalking(row: OutboxRow) {
  const username = process.env.AT_USERNAME!
  const host = username === 'sandbox' ? 'api.sandbox.africastalking.com' : 'api.africastalking.com'
  const body = new URLSearchParams({ username, to: row.to_phone, message: row.message })
  if (process.env.AT_SENDER_ID) body.set('from', process.env.AT_SENDER_ID)

  const res = await fetch(`https://${host}/version1/messaging`, {
    method: 'POST',
    headers: {
      apiKey: process.env.AT_API_KEY!,
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`)

  const json = await res.json()
  const recipient = json?.SMSMessageData?.Recipients?.[0]
  if (!recipient || !AT_SUCCESS_CODES.has(Number(recipient.statusCode))) {
    throw new Error(recipient?.status ?? json?.SMSMessageData?.Message ?? 'Unknown response')
  }
}

export async function flushSmsOutbox(limit = 50) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('[sms] SUPABASE_SERVICE_ROLE_KEY missing; outbox not drained')
    return { sent: 0, failed: 0, skipped: 0 }
  }
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('claim_sms_batch', { p_limit: limit })
  if (error) {
    console.error('[sms] claim failed', error.message)
    return { sent: 0, failed: 0, skipped: 0 }
  }

  const rows = (data ?? []) as OutboxRow[]
  const configured = Boolean(process.env.AT_USERNAME && process.env.AT_API_KEY)
  let sent = 0
  let failed = 0
  let skipped = 0

  await Promise.all(
    rows.map(async (row) => {
      if (!configured) {
        console.info(`[sms:skipped] to ${row.to_phone}: ${row.message}`)
        skipped++
        await admin.from('sms_outbox').update({ status: 'skipped' }).eq('id', row.id)
        return
      }
      try {
        await sendViaAfricasTalking(row)
        sent++
        await admin
          .from('sms_outbox')
          .update({ status: 'sent', sent_at: new Date().toISOString(), last_error: null })
          .eq('id', row.id)
      } catch (err) {
        failed++
        await admin
          .from('sms_outbox')
          .update({ status: 'failed', last_error: err instanceof Error ? err.message : String(err) })
          .eq('id', row.id)
      }
    }),
  )

  return { sent, failed, skipped }
}
