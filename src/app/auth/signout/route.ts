import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SESSION_COOKIE } from '@/lib/session-config'

// Used by the idle timer in the browser. POST only, so a link or image on another site cannot sign you out.
export async function POST() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  const res = new NextResponse(null, { status: 204 })
  res.cookies.delete(SESSION_COOKIE)
  return res
}
