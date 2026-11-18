'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ADMIN_IDLE_MINUTES, IDLE_MINUTES } from '@/lib/session-config'

const WARN_MS = 60_000
const PING_EVERY_MS = 4 * 60_000

/** Signs the person out after a stretch with no clicks, typing or scrolling, and warns a minute before. */
export function IdleGuard({ isAdmin = false }: { isAdmin?: boolean }) {
  const limit = (isAdmin ? ADMIN_IDLE_MINUTES : IDLE_MINUTES) * 60_000
  const last = useRef(0)
  const lastPing = useRef(0)
  const [warn, setWarn] = useState(false)
  const router = useRouter()

  useEffect(() => {
    last.current = lastPing.current = Date.now()
    const bump = () => {
      const now = Date.now()
      last.current = now
      setWarn(false)
      if (now - lastPing.current > PING_EVERY_MS) {
        lastPing.current = now
        void fetch('/session/ping', { method: 'POST' }).catch(() => {})
      }
    }
    const events = ['pointerdown', 'keydown', 'scroll', 'touchstart'] as const
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }))
    const tick = setInterval(async () => {
      const idle = Date.now() - last.current
      if (idle >= limit) {
        clearInterval(tick)
        await fetch('/auth/signout', { method: 'POST' }).catch(() => {})
        router.replace('/login?error=timeout')
      } else if (idle >= limit - WARN_MS) {
        setWarn(true)
      }
    }, 5000)
    return () => {
      events.forEach((e) => window.removeEventListener(e, bump))
      clearInterval(tick)
    }
  }, [limit, router])

  if (!warn) return null
  return (
    <div role="alert" className="fixed z-50 left-1/2 -translate-x-1/2 bottom-24 sm:bottom-6 bg-[#1b1613] text-[#efe6d3] border border-[#c8a25a] rounded-sm px-4 py-3 text-sm shadow-xl">
      You will be signed out in a minute because you have been away. Tap anywhere to stay signed in.
    </div>
  )
}
