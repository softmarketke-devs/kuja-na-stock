'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { str } from '@/lib/actions'
import { isKenyanMobile, nairobiDate, normalizePhone } from '@/lib/format'
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

const COMMON_PASSWORDS = ['password', 'qwertyui', 'qwerty123', '12345678', '123456789', '1234567890', 'iloveyou', 'abc12345', 'kujanastock']

/** Returns why a password is too weak, or null. Supabase's own rules (dashboard) apply on top. */
function weakPassword(password: string, email: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters'
  if (/^(.)\1+$/.test(password) || /^\d+$/.test(password)) return 'Choose a password that is not just repeated or numbers only'
  const lower = password.toLowerCase()
  if (COMMON_PASSWORDS.some((c) => lower.includes(c))) return 'That password is too common. Choose a harder one'
  const local = email.split('@')[0]?.toLowerCase()
  if (local && local.length >= 4 && lower.includes(local)) return 'Your password should not contain your email name'
  return null
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
  const weak = weakPassword(password, str(formData, 'email'))
  if (weak) return { ok: false, error: weak }

  let carrier: Record<string, unknown> = {}
  if (role === 'rider') {
    const permitNo = str(formData, 'meat_permit_no')
    const expiry = str(formData, 'meat_permit_expiry')
    const vehicleReg = str(formData, 'vehicle_reg').toUpperCase()
    const capacity = Number(str(formData, 'load_capacity_kg'))
    if (!permitNo) return { ok: false, error: 'Enter your meat transport permit number' }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expiry)) return { ok: false, error: 'Enter the permit expiry date' }
    if (expiry < nairobiDate()) return { ok: false, error: 'That permit has expired. Renew it before registering' }
    if (!vehicleReg) return { ok: false, error: 'Enter your vehicle registration' }
    if (!(capacity > 0 && capacity <= 5000)) return { ok: false, error: 'Load capacity must be between 1 and 5000 kg' }
    carrier = { meat_permit_no: permitNo, meat_permit_expiry: expiry, vehicle_reg: vehicleReg, load_capacity_kg: capacity }
  }

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
        supplier_type: role === 'supplier' ? str(formData, 'supplier_type') || 'wholesaler' : null,
        ...carrier,
      },
    },
  })
  if (error) return { ok: false, error: error.message }
  // For an email that is already registered, Supabase reports success but creates no user
  // (empty identities) and sends no email. Say so instead of promising an email that will not come.
  if (data.user && data.user.identities?.length === 0) {
    return { ok: false, error: 'That email is already registered. Sign in instead, or use a different email.' }
  }
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
