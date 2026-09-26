'use server'

import { perform } from '@/lib/actions'
import type { ActionResult } from '@/types'

export async function markAllRead(): Promise<ActionResult> {
  return perform(async (supabase, userId) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)
    if (error) throw new Error(error.message)
  })
}
