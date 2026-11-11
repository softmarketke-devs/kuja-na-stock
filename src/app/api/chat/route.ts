import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { answer } from '@/lib/chatbot'
import { fishConfigured } from '@/lib/fishaudio'

/** GET tells the widget whether to show the microphone and speaker buttons. */
export function GET() {
  return NextResponse.json({ voice: fishConfigured() })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please sign in again' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'retailer') return NextResponse.json({ error: 'The assistant is for butcheries' }, { status: 403 })

  const body = (await request.json().catch(() => null)) as { message?: unknown } | null
  const message = typeof body?.message === 'string' ? body.message.slice(0, 300) : ''
  return NextResponse.json(await answer(supabase, user.id, message))
}
