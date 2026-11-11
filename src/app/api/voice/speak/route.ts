import { NextResponse } from 'next/server'
import { FISH_API, fishConfigured, fishHeaders, voiceUserId } from '@/lib/fishaudio'

/** Text to speech with Fish Audio. Streams the mp3 back to the browser. */
export async function POST(request: Request) {
  if (!fishConfigured()) return NextResponse.json({ error: 'Voice is not set up' }, { status: 503 })
  if (!(await voiceUserId())) return NextResponse.json({ error: 'Please sign in again' }, { status: 401 })

  const body = (await request.json().catch(() => null)) as { text?: unknown } | null
  const text = typeof body?.text === 'string' ? body.text.trim().slice(0, 500) : ''
  if (!text) return NextResponse.json({ error: 'Nothing to say' }, { status: 400 })

  const res = await fetch(`${FISH_API}/tts`, {
    method: 'POST',
    headers: fishHeaders({ 'Content-Type': 'application/json', model: process.env.FISH_AUDIO_MODEL || 's2.1-pro-free' }),
    body: JSON.stringify({
      text,
      format: 'mp3',
      latency: 'low',
      ...(process.env.FISH_AUDIO_VOICE_ID ? { reference_id: process.env.FISH_AUDIO_VOICE_ID } : {}),
    }),
  })
  if (!res.ok || !res.body) return NextResponse.json({ error: 'Voice is unavailable right now' }, { status: 502 })
  return new Response(res.body, { headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' } })
}
