'use server'

import { perform, rpc, str } from '@/lib/actions'
import type { ActionResult } from '@/types'

export async function setAvailability(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return perform(async (supabase) => {
    await rpc(supabase, 'set_rider_availability', {
      p_date: str(formData, 'date'),
      p_available: str(formData, 'available') === 'true',
    })
  })
}

export async function acceptRun(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return perform(async (supabase) => {
    await rpc(supabase, 'accept_run', { p_run_id: str(formData, 'run_id') })
    return 'Run booked. Be at the pickup by 05:00.'
  })
}

export async function releaseRun(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return perform(async (supabase) => {
    await rpc(supabase, 'release_run', { p_run_id: str(formData, 'run_id') })
    return 'Run released'
  })
}

export async function pickUpRun(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return perform(async (supabase) => {
    await rpc(supabase, 'mark_run_picked_up', { p_run_id: str(formData, 'run_id') })
    return 'Picked up. Retailers have been sent their delivery codes.'
  })
}

export async function confirmDelivery(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return perform(async (supabase) => {
    const method = str(formData, 'method') === 'mpesa' ? 'mpesa' : 'cash'
    const amount = str(formData, 'amount')
    const res = await rpc<{ ok: boolean; error?: string }>(supabase, 'confirm_delivery', {
      p_order_id: str(formData, 'order_id'),
      p_code: str(formData, 'code'),
      p_method: method,
      p_amount: amount ? Number(amount) : null,
      p_mpesa_ref: str(formData, 'mpesa_ref') || null,
    })
    if (!res.ok) throw new Error(res.error ?? 'Could not confirm delivery')
    return 'Delivered'
  })
}

export async function failDelivery(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return perform(async (supabase) => {
    await rpc(supabase, 'fail_delivery', {
      p_order_id: str(formData, 'order_id'),
      p_reason: str(formData, 'reason'),
    })
    return 'Marked as not delivered'
  })
}
