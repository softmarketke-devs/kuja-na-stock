import { requireProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { LiveRefresh } from '@/components/LiveRefresh'
import { DashboardHeader } from '@/components/DashboardHeader'
import { IdleGuard } from '@/components/IdleGuard'
import type { UserRole } from '@/types'

const LIVE_TABLES: Record<UserRole, string[]> = {
  admin: ['notifications', 'customer_orders'],
  customer: ['customer_orders', 'notifications'],
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile()
  const supabase = await createClient()
  const { count: unread } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', profile.id)
    .eq('is_read', false)


  return (
    <div className="min-h-screen flex flex-col">
      <DashboardHeader profile={profile} unread={unread ?? 0} />


      <main className="rise-in flex-1 max-w-5xl w-full mx-auto px-4 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:pb-8">{children}</main>
      <IdleGuard isAdmin={profile.role === 'admin'} />
      <LiveRefresh tables={LIVE_TABLES[profile.role]} userId={profile.id} />
    </div>
  )
}
