import { clsx } from 'clsx'
import { requireProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { formatDateTime } from '@/lib/format'
import { markAllRead } from '@/app/actions/notifications'
import { ActionForm, SubmitButton } from '@/components/ActionForm'
import { Card, Empty, secondaryButton } from '@/components/ui'
import type { Notification } from '@/types'

export default async function NotificationsPage() {
  const profile = await requireProfile()
  const supabase = await createClient()
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(100)
  const notifications = (data ?? []) as Notification[]
  const unread = notifications.filter((n) => !n.is_read).length

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-black uppercase tracking-tight">Notifications</h1>
        {unread > 0 && (
          <ActionForm action={markAllRead}>
            <SubmitButton className={secondaryButton}>Mark all read</SubmitButton>
          </ActionForm>
        )}
      </div>
      {notifications.length === 0 ? (
        <Empty>No notifications yet.</Empty>
      ) : (
        <Card className="divide-y divide-slate-100">
          {notifications.map((n) => (
            <div key={n.id} className={clsx('p-3', !n.is_read && 'bg-orange-50/60 border-l-4 border-orange-500')}>
              <div className="flex items-start justify-between gap-3">
                <p className="font-bold text-sm">{n.title}</p>
                <span className="text-[11px] text-slate-500 whitespace-nowrap">{formatDateTime(n.created_at)}</span>
              </div>
              <p className="text-sm text-slate-700 mt-0.5">{n.message}</p>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}
