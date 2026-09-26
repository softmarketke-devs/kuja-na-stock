'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { str } from '@/lib/actions'
import { isKenyanMobile, normalizePhone } from '@/lib/format'
import type { ActionResult } from '@/types'

function safeNext(next: string) {
  return next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'
}

export async function signIn(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: str(formData, 'email'),
    password: str(formData, 'password'),
  })
  if (error) return { ok: false, error: error.message }
  redirect(safeNext(str(formData, 'next')))
}

export async function signUp(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const role = str(formData, 'role')
  const phone = str(formData, 'phone')
  const fullName = str(formData, 'full_name')
  const password = str(formData, 'password')

  if (!['retailer', 'supplier', 'rider'].includes(role)) return { ok: false, error: 'Choose an account type' }
  if (!fullName) return { ok: false, error: 'Enter your name' }
  if (!isKenyanMobile(phone)) {
    return { ok: false, error: 'Enter a Kenyan mobile number, e.g. 0712 345 678. We send order updates by SMS.' }
  }
  if (password.length < 8) return { ok: false, error: 'Password must be at least 8 characters' }

  // Public address the confirmation link should open. Falls back to the
  // address the form was submitted from (localhost in dev).
  const origin = process.env.NEXT_PUBLIC_SITE_URL || (await headers()).get('origin') || ''
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email: str(formData, 'email'),
    password,
    options: {
      emailRedirectTo: `${origin}/auth/confirm`,
      data: {
        role,
        full_name: fullName,
        phone: normalizePhone(phone),
        business_name: str(formData, 'business_name') || null,
        supplier_type: role === 'supplier' ? str(formData, 'supplier_type') || 'depot' : null,
      },
    },
  })
  if (error) return { ok: false, error: error.message }
  if (!data.session) {
    return { ok: true, message: 'Check your email and tap the confirmation link to finish signing up.' }
  }
  redirect('/dashboard/settings?welcome=1')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
