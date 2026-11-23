'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { str } from '@/lib/actions'
import { isKenyanMobile, normalizePhone } from '@/lib/format'
import { touchSession } from '@/lib/session'
import type { ActionResult } from '@/types'

/**
 * The address the person is actually using (localhost while you test, your real domain in production). Links in sign-up,
 * Google and password-reset emails must go back to THIS address: the login cookie lives on it, so returning to a
 * different address (like the one in NEXT_PUBLIC_SITE_URL) cannot finish signing in. Supabase's own redirect list
 * still decides which addresses are allowed.
 */
async function siteOrigin() {
  const h = await headers()
  const fromOrigin = h.get('origin')
  if (fromOrigin) {
    try {
      const u = new URL(fromOrigin)
      if (u.protocol === 'http:' || u.protocol === 'https:') return u.origin
    } catch {
      /* fall through */
    }
  }
  const host = h.get('x-forwarded-host') ?? h.get('host')
  if (host) return `${h.get('x-forwarded-proto') ?? (/^localhost|^127\./.test(host) ? 'http' : 'https')}://${host}`
  return process.env.NEXT_PUBLIC_SITE_URL || ''
}

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
  await touchSession()
  redirect(safeNext(str(formData, 'next')))
}

const COMMON_PASSWORDS = ['password', 'qwertyui', 'qwerty123', '12345678', '123456789', '1234567890', 'iloveyou', 'abc12345', 'kujanastock', 'bigpremiumcuts']

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
  const phone = str(formData, 'phone')
  const fullName = str(formData, 'full_name')
  const password = str(formData, 'password')

  if (!fullName) return { ok: false, error: 'Enter your name' }
  if (!isKenyanMobile(phone)) {
    return { ok: false, error: 'Enter a Kenyan mobile number, e.g. 0712 345 678. We send order updates by SMS.' }
  }
  const weak = weakPassword(password, str(formData, 'email'))
  if (weak) return { ok: false, error: weak }

  // Public address the confirmation link should open. Falls back to the
  // address the form was submitted from (localhost in dev).
  const origin = await siteOrigin()
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email: str(formData, 'email'),
    password,
    options: {
      emailRedirectTo: `${origin}/auth/confirm`,
      data: {
        role: 'customer', // the only public account type; staff accounts are made by the owner
        full_name: fullName,
        phone: normalizePhone(phone),
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
  await touchSession()
  redirect('/dashboard/settings?welcome=1')
}

/** Starts Google sign-in. Google must be enabled in Supabase (Authentication, Providers). New Google users become customers. */
export async function signInWithGoogle(): Promise<ActionResult> {
  const origin = await siteOrigin()
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${origin}/auth/confirm?next=/dashboard` },
  })
  if (error || !data.url) {
    return { ok: false, error: 'Google sign-in is not available yet. Use your email and password for now.' }
  }
  // Supabase answers 400 when the Google provider is switched off. Check first so the user sees a message, not a raw error page.
  const probe = await fetch(data.url, { redirect: 'manual' }).catch(() => null)
  if (!probe || probe.status >= 400) {
    return { ok: false, error: 'Google sign-in is not switched on yet. Use your email and password for now.' }
  }
  redirect(data.url)
}

/** Emails a reset link. Always answers the same way, so nobody can use it to find out who has an account. */
export async function requestPasswordReset(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const email = str(formData, 'email')
  if (!email.includes('@')) return { ok: false, error: 'Enter the email you signed up with' }
  const origin = await siteOrigin()
  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/auth/confirm?next=/reset-password` })
  if (error && /rate|seconds|too many/i.test(error.message)) {
    return { ok: false, error: 'Too many requests. Wait a minute and try again.' }
  }
  return { ok: true, message: 'If that email has an account, a reset link is on its way. It can take a minute to arrive.' }
}

/** Sets the new password for the signed-in recovery session, then opens the dashboard. */
export async function updatePassword(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const password = str(formData, 'password')
  if (password !== str(formData, 'confirm')) return { ok: false, error: 'The two passwords do not match' }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'This reset link has expired. Ask for a new one.' }
  const weak = weakPassword(password, user.email ?? '')
  if (weak) return { ok: false, error: weak }
  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { ok: false, error: error.message }
  await touchSession()
  redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
