import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from './supabase/server'
import { DASHBOARD_HOME } from './constants'
import type { Profile, UserRole } from '@/types'

/** The signed-in user's profile, or null. Deduplicated per request. */
export const getProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  return (data as Profile | null) ?? null
})

/** For pages: redirect to login, or to the user's own dashboard on a role mismatch. */
export async function requireProfile(role?: UserRole) {
  const profile = await getProfile()
  if (!profile) redirect('/login')
  if (role && profile.role !== role) redirect(DASHBOARD_HOME[profile.role] ?? '/dashboard')
  return profile
}
