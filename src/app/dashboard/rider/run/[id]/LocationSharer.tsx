'use client'

import { useEffect, useRef, useState } from 'react'
import { Navigation } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const SEND_EVERY_MS = 5000

/**
 * While the run is in progress, sends the carrier's phone location to the
 * retailers on the run. Browsers pause GPS when the page is hidden, so the
 * carrier should keep this screen open (we also ask the phone not to sleep).
 */
export function LocationSharer({ runId }: { runId: string }) {
  const [state, setState] = useState<'starting' | 'sharing' | 'denied' | 'error'>('starting')
  const last = useRef(0)

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      const t = setTimeout(() => setState('error'), 0)
      return () => clearTimeout(t)
    }
    const supabase = createClient()
    let wake: WakeLockSentinel | null = null
    const keepAwake = async () => {
      try {
        wake = (await navigator.wakeLock?.request('screen')) ?? null
      } catch {
        /* not supported or refused: fine */
      }
    }
    keepAwake()
    const onVisible = () => document.visibilityState === 'visible' && keepAwake()
    document.addEventListener('visibilitychange', onVisible)

    const id = navigator.geolocation.watchPosition(
      async (p) => {
        const nowMs = Date.now()
        if (nowMs - last.current < SEND_EVERY_MS) return
        last.current = nowMs
        const { error } = await supabase.rpc('report_run_location', {
          p_run_id: runId,
          p_lat: p.coords.latitude,
          p_lng: p.coords.longitude,
          p_heading: p.coords.heading,
          p_speed_kmh: p.coords.speed != null ? p.coords.speed * 3.6 : null,
        })
        setState(error ? 'error' : 'sharing')
      },
      (err) => setState(err.code === err.PERMISSION_DENIED ? 'denied' : 'error'),
      { enableHighAccuracy: true, maximumAge: 4000, timeout: 20000 },
    )

    return () => {
      navigator.geolocation.clearWatch(id)
      document.removeEventListener('visibilitychange', onVisible)
      wake?.release().catch(() => {})
    }
  }, [runId])

  const text = {
    starting: 'Starting location sharing…',
    sharing: 'Sharing your live location with the butcheries on this run. Keep this screen open.',
    denied: 'Location is blocked. Allow location for this site in your browser settings so butcheries can track you.',
    error: 'Could not send your location. Check your signal and keep this page open.',
  }[state]

  return (
    <p
      role="status"
      className={`flex items-start gap-2 text-sm border px-3 py-2 ${
        state === 'sharing' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-900'
      }`}
    >
      <Navigation className="w-4 h-4 mt-0.5 shrink-0" /> {text}
    </p>
  )
}
