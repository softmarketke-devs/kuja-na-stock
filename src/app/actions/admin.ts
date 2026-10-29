'use server'

import { perform, rpc, str } from '@/lib/actions'
import type { ActionResult } from '@/types'

export async function setCarrierVerified(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return perform(async (supabase) => {
    const verified = str(formData, 'verified') === 'true'
    await rpc(supabase, 'admin_set_carrier_verified', {
      p_carrier_id: str(formData, 'carrier_id'),
      p_verified: verified,
    })
    return verified ? 'Marked as checked. The carrier has been told.' : 'Marked as not checked. The carrier has been told.'
  })
}
