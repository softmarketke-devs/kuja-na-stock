'use client'

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { ORDER_CUTOFF_HOUR } from '@/lib/constants'

const NAIROBI_OFFSET_MS = 3 * 3600_000 // UTC+3, no daylight saving

/** Seconds until the next 9 PM in Nairobi, and whether today's cutoff has already passed. */
function untilCutoff(now = Date.now()) {
  const local = new Date(now + NAIROBI_OFFSET_MS) // read with the UTC getters = Nairobi wall clock
  const next = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate(), ORDER_CUTOFF_HOUR)
  const passed = local.getTime() >= next
  const target = passed ? next + 24 * 3600_000 : next
  return { seconds: Math.max(0, Math.floor((target - local.getTime()) / 1000)), passed }
}

const two = (n: number) => String(n).padStart(2, '0')

/** Live "order closes in" clock, in Nairobi time. Renders after mount so server and browser never disagree. */
export function CutoffCountdown() {
  const [state, setState] = useState<ReturnType<typeof untilCutoff> | null>(null)

  useEffect(() => {
    const tick = () => setState(untilCutoff())
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const s = state?.seconds ?? 0
  const clock = state ? `${two(Math.floor(s / 3600))}:${two(Math.floor((s % 3600) / 60))}:${two(s % 60)}` : '--:--:--'

  return (
    <div className="inline-flex items-center gap-3 border border-white/25 bg-black/40 backdrop-blur-sm px-4 py-2.5">
      <Clock className="w-5 h-5 text-orange-400 shrink-0" aria-hidden />
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
          {state?.passed ? 'Tonight’s cutoff has passed. Next one closes in' : 'Order closes in'}
        </div>
        <div className="font-black text-2xl tabular-nums leading-tight" suppressHydrationWarning>
          {clock}
        </div>
      </div>
    </div>
  )
}
