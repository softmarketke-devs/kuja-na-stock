import 'server-only'
import { createClient } from './supabase/server'

export const FISH_API = 'https://api.fish.audio/v1'

/** Fish Audio key and optional voice, set per deployment. Voice features hide themselves while the key is empty. */
export const fishConfigured = () => Boolean(process.env.FISH_AUDIO_API_KEY)
export const fishHeaders = (extra?: Record<string, string>) => ({
  Authorization: `Bearer ${process.env.FISH_AUDIO_API_KEY}`,
  ...extra,
})

/** The signed-in retailer's id, or null. Voice calls cost money, so they are never anonymous. */
export async function voiceUserId() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'retailer' ? user.id : null
}
