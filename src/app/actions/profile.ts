'use server'

import { perform, str } from '@/lib/actions'
import { isKenyanMobile, normalizePhone } from '@/lib/format'
import type { ActionResult } from '@/types'

export async function updateProfile(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return perform(async (supabase, userId) => {
    const phone = str(formData, 'phone')
    if (!isKenyanMobile(phone)) throw new Error('Enter a Kenyan mobile number, e.g. 0712 345 678')
    const fullName = str(formData, 'full_name')
    if (!fullName) throw new Error('Enter your name')

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, phone: normalizePhone(phone), address: str(formData, 'address').slice(0, 300) || null })
      .eq('id', userId)
    if (error) throw new Error(error.message)
    return 'Saved'
  })
}
