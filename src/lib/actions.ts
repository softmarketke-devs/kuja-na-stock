import 'server-only'
import { after } from 'next/server'
import { refresh } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from './supabase/server'
import { flushSmsOutbox } from './sms'
import type { ActionResult } from '@/types'

/**
 * Wraps a Server Action body: requires a session, turns thrown errors into
 * { ok: false, error }, refreshes the client router, and drains the SMS
 * outbox after the response is sent. Authorization is enforced by RLS and
 * the database functions, which check the caller's role themselves.
 */
export async function perform(
  fn: (supabase: SupabaseClient, userId: string) => Promise<string | void>,
): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Please sign in again' }

  let message: string | void
  try {
    message = await fn(supabase, user.id)
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Something went wrong' }
  }

  after(() => flushSmsOutbox())
  refresh()
  return { ok: true, message: message || undefined }
}

/** Call a database function and throw its error message (they're user-facing). */
export async function rpc<T = unknown>(
  supabase: SupabaseClient,
  fn: string,
  args?: Record<string, unknown>,
): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args)
  if (error) throw new Error(error.message)
  return data as T
}

export function str(formData: FormData, key: string) {
  const v = formData.get(key)
  return typeof v === 'string' ? v.trim() : ''
}

export function num(formData: FormData, key: string, { min = 0 }: { min?: number } = {}) {
  const raw = str(formData, key)
  const n = Number(raw)
  if (raw === '' || !Number.isFinite(n) || n < min) {
    throw new Error(`Enter a valid number for ${key.replace(/_/g, ' ')}`)
  }
  return n
}
