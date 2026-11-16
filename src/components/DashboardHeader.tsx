import Link from 'next/link'
import Image from 'next/image'
import { Bell, LogOut } from 'lucide-react'
import { signOut } from '@/app/actions/auth'
import { DashboardNav } from '@/components/DashboardNav'
import { BRAND_NAME } from '@/lib/brand'
import type { Profile, UserRole } from '@/types'

const ROLE_LABEL: Record<UserRole, string> = {
  retailer: 'Retailer',
  supplier: 'Supplier',
  rider: 'Meat carrier',
  admin: 'Admin',
  customer: 'Customer',
}

/** The dark brand bar shown on every dashboard page: logo, who you are, notifications, sign out and the role's nav. */
export function DashboardHeader({
  profile,
  unread,
}: {
  profile: Pick<Profile, 'role' | 'business_name' | 'full_name'>
  unread: number
}) {
  return (
      <header className="bg-[#120e0c] text-[#efe6d3] border-b border-[#2f2721] sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
            <Image src="/brand/big-logo.png" alt={BRAND_NAME} width={44} height={44} className="h-11 w-auto shrink-0" />
            <div className="min-w-0">
              <div className="font-display text-base font-semibold leading-tight truncate">
                {profile.business_name || profile.full_name || BRAND_NAME}
              </div>
              <div className="text-xs text-[#c8a25a] font-semibold tracking-wide">{ROLE_LABEL[profile.role]}</div>
            </div>
          </Link>
          <div className="flex items-center gap-1 shrink-0">
            <Link
              href="/dashboard/notifications"
              className="relative p-3 rounded-sm hover:bg-[#c8a25a22]"
              aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
            >
              <Bell className="w-5 h-5" />
              {!!unread && (
                <span className="absolute top-1 right-1 bg-[#c8a25a] text-[#14100c] text-[11px] font-bold min-w-4 h-4 px-1 rounded-full ring-2 ring-[#120e0c] flex items-center justify-center">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </Link>
            <form action={signOut}>
              <button type="submit" className="p-3 rounded-sm hover:bg-[#c8a25a22]" aria-label="Sign out">
                <LogOut className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
        <DashboardNav role={profile.role} />
      </header>
  )
}
