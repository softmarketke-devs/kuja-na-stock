import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { requireProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { LiveRefresh } from '@/components/LiveRefresh'
import { DashboardHeader } from '@/components/DashboardHeader'
import { ChatWidget } from '@/components/ChatWidget'
import type { UserRole } from '@/types'

const LIVE_TABLES: Record<UserRole, string[]> = {
  retailer: ['orders', 'delivery_runs', 'notifications'],
  supplier: ['orders', 'delivery_runs', 'notifications'],
  rider: ['delivery_runs', 'orders', 'notifications'],
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

  const missingLocation = profile.role !== 'customer' && (profile.lat === null || profile.lng === null)

  return (
    <div className="min-h-screen flex flex-col">
      <DashboardHeader profile={profile} unread={unread ?? 0} />

      {missingLocation && (
        <div className="bg-orange-50 border-b border-orange-200/80">
          <div className="max-w-5xl mx-auto px-4 py-2.5 text-sm flex items-center gap-2">
            <MapPin className="w-4 h-4 text-orange-700 shrink-0" />
            <span>
              {profile.role === 'retailer' && 'Set your butchery location so we can price delivery. '}
              {profile.role === 'supplier' && 'Set your pickup location so retailers can find you. '}
              {profile.role === 'rider' && 'Set your base location so we can offer you nearby runs. '}
              <Link href="/dashboard/settings" className="font-bold text-orange-700 underline">
                Go to your account
              </Link>
            </span>
          </div>
        </div>
      )}

      <main className="rise-in flex-1 max-w-5xl w-full mx-auto px-4 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:pb-8">{children}</main>
      {profile.role === 'retailer' && <ChatWidget />}
      <LiveRefresh tables={LIVE_TABLES[profile.role]} userId={profile.id} />
    </div>
  )
}
