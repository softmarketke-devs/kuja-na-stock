'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { Bot, Loader2, Mic, Send, Square, Volume2, VolumeX, X } from 'lucide-react'

type Msg = { from: 'bot' | 'me'; text: string; links?: { label: string; href: string }[] }

const QUICK = ['Do I need to restock?', 'Where is my order?', 'What are my orders?']

/** Floating assistant for butcheries. Answers come from /api/chat; voice uses Fish Audio when it is configured. */
export function ChatWidget() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([
    { from: 'bot', text: 'Hi! Ask me if you need to restock, or where your delivery is. You can type or use the mic.' },
  ])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [voiceAvailable, setVoiceAvailable] = useState(false)
  const [speakReplies, setSpeakReplies] = useState(false)
  const [recording, setRecording] = useState(false)
  const recorder = useRef<MediaRecorder | null>(null)
  const audio = useRef<HTMLAudioElement | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open || voiceAvailable) return
    fetch('/api/chat')
      .then((r) => r.json())
      .then((d: { voice?: boolean }) => setVoiceAvailable(Boolean(d.voice)))
      .catch(() => {})
  }, [open, voiceAvailable])

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [msgs, busy, open])

  const speak = async (text: string) => {
    try {
      const res = await fetch('/api/voice/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) return
      const url = URL.createObjectURL(await res.blob())
      audio.current?.pause()
      const a = new Audio(url)
      audio.current = a
      a.onended = () => URL.revokeObjectURL(url)
      await a.play()
    } catch {
      /* voice is a bonus: the text reply is already on screen */
    }
  }

  const send = async (text: string) => {
    const message = text.trim()
    if (!message || busy) return
    setInput('')
    setMsgs((m) => [...m, { from: 'me', text: message }])
    setBusy(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })
      const data = (await res.json()) as { reply?: string; links?: Msg['links']; error?: string }
      const reply = data.reply ?? data.error ?? 'Something went wrong. Try again.'
      setMsgs((m) => [...m, { from: 'bot', text: reply, links: data.links }])
      if (speakReplies && data.reply) void speak(data.reply)
    } catch {
      setMsgs((m) => [...m, { from: 'bot', text: 'I could not reach the server. Check your connection and try again.' }])
    } finally {
      setBusy(false)
    }
  }

  const toggleRecording = async () => {
    if (recording) {
      recorder.current?.stop()
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const rec = new MediaRecorder(stream)
      const chunks: Blob[] = []
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data)
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        setRecording(false)
        const blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' })
        if (blob.size < 1000) return
        setBusy(true)
        try {
          const form = new FormData()
          form.append('audio', blob, 'speech.webm')
          const res = await fetch('/api/voice/transcribe', { method: 'POST', body: form })
          const data = (await res.json()) as { text?: string }
          setBusy(false)
          if (data.text) await send(data.text)
          else setMsgs((m) => [...m, { from: 'bot', text: 'I did not catch that. Please try again.' }])
        } catch {
          setBusy(false)
          setMsgs((m) => [...m, { from: 'bot', text: 'Voice is unavailable right now. You can type instead.' }])
        }
      }
      recorder.current = rec
      rec.start()
      setRecording(true)
      setTimeout(() => rec.state === 'recording' && rec.stop(), 15000) // a question never needs longer
    } catch {
      setMsgs((m) => [...m, { from: 'bot', text: 'Microphone access was blocked. Allow it in your browser settings, or type instead.' }])
    }
  }

  // Keep clear of the mobile bottom bars (main nav, and the order page's quick actions).
  const onOrderPage = pathname.startsWith('/dashboard/retailer/order')
  const offset = onOrderPage
    ? 'bottom-[calc(8.25rem+env(safe-area-inset-bottom))] sm:bottom-20 lg:bottom-6'
    : 'bottom-[calc(5rem+env(safe-area-inset-bottom))] sm:bottom-6'

  return (
    <>
      {open && (
        <section
          aria-label="Assistant"
          className={clsx(
            'fixed z-40 inset-x-3 sm:inset-x-auto sm:right-6 sm:w-96 flex flex-col max-h-[65vh] bg-white border border-slate-300 shadow-xl',
            onOrderPage
              ? 'bottom-[calc(11.5rem+env(safe-area-inset-bottom))] sm:bottom-36 lg:bottom-24'
              : 'bottom-[calc(8.5rem+env(safe-area-inset-bottom))] sm:bottom-24',
          )}
        >
          <header className="flex items-center justify-between gap-2 bg-orange-600 text-white px-3 py-2">
            <span className="font-black text-sm flex items-center gap-2">
              <Bot className="w-4 h-4" /> Stock assistant
            </span>
            <span className="flex items-center gap-1">
              {voiceAvailable && (
                <button
                  type="button"
                  onClick={() => setSpeakReplies((v) => !v)}
                  aria-pressed={speakReplies}
                  aria-label={speakReplies ? 'Turn off spoken replies' : 'Turn on spoken replies'}
                  className="p-1.5 hover:bg-orange-700"
                >
                  {speakReplies ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
              )}
              <button type="button" onClick={() => setOpen(false)} aria-label="Close assistant" className="p-1.5 hover:bg-orange-700">
                <X className="w-4 h-4" />
              </button>
            </span>
          </header>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50" aria-live="polite">
            {msgs.map((m, i) => (
              <div key={i} className={clsx('flex', m.from === 'me' && 'justify-end')}>
                <div
                  className={clsx(
                    'max-w-[85%] px-3 py-2 text-sm',
                    m.from === 'me' ? 'bg-orange-600 text-white' : 'bg-white border border-slate-200 text-slate-800',
                  )}
                >
                  <p>{m.text}</p>
                  {m.links && m.links.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {m.links.map((l) => (
                        <Link
                          key={l.href}
                          href={l.href}
                          onClick={() => setOpen(false)}
                          className="text-xs font-bold text-orange-700 border border-orange-300 bg-orange-50 px-2 py-1"
                        >
                          {l.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {busy && (
              <div className="text-slate-500 text-xs flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking…
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="flex flex-wrap gap-1.5 px-3 pt-2 border-t border-slate-200">
            {QUICK.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => send(q)}
                disabled={busy}
                className="text-xs font-bold border border-slate-300 bg-white px-2 py-1 hover:border-orange-400 disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
          <form
            className="flex gap-1.5 p-3"
            onSubmit={(e) => {
              e.preventDefault()
              void send(input)
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={recording ? 'Listening…' : 'Ask about stock or delivery'}
              aria-label="Message"
              maxLength={300}
              className="flex-1 min-w-0 border border-slate-300 px-3 py-2 text-base focus:outline-none focus:border-orange-500"
            />
            {voiceAvailable && (
              <button
                type="button"
                onClick={toggleRecording}
                aria-label={recording ? 'Stop recording' : 'Speak your question'}
                className={clsx('min-h-11 w-11 flex items-center justify-center border', recording ? 'bg-red-600 border-red-600 text-white animate-pulse' : 'border-slate-300 bg-white text-slate-700')}
              >
                {recording ? <Square className="w-4 h-4" /> : <Mic className="w-5 h-5" />}
              </button>
            )}
            <button type="submit" disabled={busy || !input.trim()} aria-label="Send" className="min-h-11 w-11 flex items-center justify-center bg-orange-600 text-white disabled:opacity-50">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? 'Close assistant' : 'Open stock assistant'}
        className={clsx(
          'fixed z-40 right-4 sm:right-6 w-14 h-14 flex items-center justify-center bg-orange-600 hover:bg-orange-700 text-white border-2 border-white shadow-lg',
          offset,
        )}
      >
        {open ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
      </button>
    </>
  )
}
