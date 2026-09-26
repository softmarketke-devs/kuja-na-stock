'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * Re-renders the current page when rows the user can see change in any of
 * the given tables. Supabase Realtime applies RLS, so each user only hears
 * about their own orders/runs/notifications.
 */
export function LiveRefresh({ tables, userId }: { tables: string[]; userId: string }) {
  const router = useRouter()
  const key = tables.join(',')

  useEffect(() => {
    const supabase = createClient()
    let timer: ReturnType<typeof setTimeout> | undefined
    const refresh = () => {
      clearTimeout(timer)
      timer = setTimeout(() => router.refresh(), 400)
    }

    const channel = supabase.channel(`live:${userId}:${key}`)
    for (const table of key.split(',')) {
      channel.on(
        'postgres_changes',
        table === 'notifications'
          ? { event: '*', schema: 'public', table, filter: `user_id=eq.${userId}` }
          : { event: '*', schema: 'public', table },
        refresh,
      )
    }
    channel.subscribe()

    // Catch up after the phone wakes or regains signal.
    const onVisible = () => document.visibilityState === 'visible' && refresh()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', refresh)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', refresh)
      supabase.removeChannel(channel)
    }
  }, [key, userId, router])

  return null
}
