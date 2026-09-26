import Link from 'next/link'
import { Bell, LogOut, MapPin, Settings } from 'lucide-react'
import { requireProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/actions/auth'
import { LiveRefresh } from '@/components/LiveRefresh'
import type { UserRole } from '@/types'

const NAV: Record<UserRole, { href: string; label: string }[]> = {
  retailer: [
    { href: '/dashboard/retailer', label: 'My shop' },
    { href: '/dashboard/retailer/order', label: 'Order stock' },
    { href: '/dashboard/retailer/history', label: 'History' },
  ],
  supplier: [
    { href: '/dashboard/supplier', label: 'Orders & runs' },
    { href: '/dashboard/supplier/listings', label: 'My listings' },
  ],
  rider: [{ href: '/dashboard/rider', label: 'My runs' }],
  admin: [],
}

const LIVE_TABLES: Record<UserRole, string[]> = {
  retailer: ['orders', 'delivery_runs', 'notifications'],
  supplier: ['orders', 'delivery_runs', 'notifications'],
  rider: ['delivery_runs', 'orders', 'notifications'],
  admin: ['notifications'],
}

const ROLE_LABEL: Record<UserRole, string> = {
  retailer: 'Retailer',
  supplier: 'Supplier',
  rider: 'Boda rider',
  admin: 'Admin',
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile()
  const supabase = await createClient()
  const { count: unread } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', profile.id)
    .eq('is_read', false)

  const missingLocation = profile.lat === null || profile.lng === null

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/logo-square.png" alt="" className="w-8 h-8 border border-orange-200 shrink-0" />
            <div className="min-w-0">
              <div className="text-sm font-black uppercase tracking-tight truncate">
                {profile.business_name || profile.full_name || 'Kuja Na Stock'}
              </div>
              <div className="text-[11px] text-orange-700 font-bold uppercase">{ROLE_LABEL[profile.role]}</div>
            </div>
          </Link>
          <div className="flex items-center gap-1 shrink-0">
            <Link
              href="/dashboard/notifications"
              className="relative p-2 hover:bg-slate-100"
              aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
            >
              <Bell className="w-5 h-5" />
              {!!unread && (
                <span className="absolute -top-0.5 -right-0.5 bg-orange-600 text-white text-[10px] font-bold min-w-4 h-4 px-1 flex items-center justify-center">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </Link>
            <Link href="/dashboard/settings" className="p-2 hover:bg-slate-100" aria-label="Settings">
              <Settings className="w-5 h-5" />
            </Link>
            <form action={signOut}>
              <button type="submit" className="p-2 hover:bg-slate-100" aria-label="Sign out">
                <LogOut className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
        {NAV[profile.role].length > 0 && (
          <nav className="max-w-5xl mx-auto px-4 flex gap-1 overflow-x-auto">
            {NAV[profile.role].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-orange-700 border-b-2 border-transparent hover:border-orange-500 whitespace-nowrap"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      {missingLocation && (
        <div className="bg-orange-50 border-b border-orange-200">
          <div className="max-w-5xl mx-auto px-4 py-2.5 text-sm flex items-center gap-2">
            <MapPin className="w-4 h-4 text-orange-700 shrink-0" />
            <span>
              {profile.role === 'retailer' && 'Set your shop location so we can price delivery. '}
              {profile.role === 'supplier' && 'Set your pickup location so retailers can find you. '}
              {profile.role === 'rider' && 'Set your stage location so we can offer you nearby runs. '}
              <Link href="/dashboard/settings" className="font-bold text-orange-700 underline">
                Go to settings
              </Link>
            </span>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-5">{children}</main>
      <LiveRefresh tables={LIVE_TABLES[profile.role]} userId={profile.id} />
    </div>
  )
}
