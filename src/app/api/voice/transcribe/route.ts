import { NextResponse } from 'next/server'
import { FISH_API, fishConfigured, fishHeaders, voiceUserId } from '@/lib/fishaudio'

const MAX_BYTES = 5 * 1024 * 1024 // a spoken question is a few seconds long

/** Speech to text with Fish Audio. Accepts a short recording from the microphone. */
export async function POST(request: Request) {
  if (!fishConfigured()) return NextResponse.json({ error: 'Voice is not set up' }, { status: 503 })
  if (!(await voiceUserId())) return NextResponse.json({ error: 'Please sign in again' }, { status: 401 })

  const form = await request.formData().catch(() => null)
  const audio = form?.get('audio')
  if (!(audio instanceof File) || audio.size === 0) return NextResponse.json({ error: 'No audio received' }, { status: 400 })
  if (audio.size > MAX_BYTES) return NextResponse.json({ error: 'Recording is too long' }, { status: 413 })

  const out = new FormData()
  out.append('audio', audio, audio.name || 'speech.webm')
  const res = await fetch(`${FISH_API}/asr`, {
    method: 'POST',
    headers: fishHeaders({ model: 'transcribe-1-pro' }),
    body: out,
  })
  if (!res.ok) return NextResponse.json({ error: 'Could not understand the recording' }, { status: 502 })
  const data = (await res.json()) as { text?: string }
  // Strip audio-event cues such as [laughter].
  const text = (data.text ?? '').replace(/\[[^\]]*\]/g, '').trim()
  return NextResponse.json({ text })
}
