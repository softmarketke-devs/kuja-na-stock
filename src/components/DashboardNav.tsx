'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { ClipboardList, History, Package, ShoppingCart, Store, Truck, UserRound, type LucideIcon } from 'lucide-react'
import type { UserRole } from '@/types'

type NavItem = { href: string; label: string; icon: LucideIcon }

const SETTINGS: NavItem = { href: '/dashboard/settings', label: 'Account', icon: UserRound }

const NAV: Record<UserRole, NavItem[]> = {
  retailer: [
    { href: '/dashboard/retailer', label: 'My butchery', icon: Store },
    { href: '/dashboard/retailer/order', label: 'Order', icon: ShoppingCart },
    { href: '/dashboard/retailer/history', label: 'History', icon: History },
    SETTINGS,
  ],
  supplier: [
    { href: '/dashboard/supplier', label: 'Orders', icon: ClipboardList },
    { href: '/dashboard/supplier/listings', label: 'Listings', icon: Package },
    SETTINGS,
  ],
  rider: [{ href: '/dashboard/rider', label: 'My runs', icon: Truck }, SETTINGS],
  admin: [SETTINGS],
}

// Longest matching prefix wins, so /dashboard/retailer/order doesn't also light up /dashboard/retailer.
function activeHref(items: NavItem[], pathname: string) {
  return items
    .filter((i) => pathname === i.href || pathname.startsWith(i.href + '/'))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href
}

export function DashboardNav({ role }: { role: UserRole }) {
  const pathname = usePathname()
  const items = NAV[role]
  const active = activeHref(items, pathname)

  return (
    <>
      <nav className="hidden sm:flex max-w-5xl mx-auto px-4 gap-1" aria-label="Main">
        {items.map((item) => {
          const isActive = item.href === active
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={clsx(
                'flex items-center gap-2 px-3 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap',
                isActive
                  ? 'text-orange-700 border-orange-600'
                  : 'text-slate-600 border-transparent hover:text-orange-700 hover:border-orange-300',
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <nav
        className="sm:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 pb-[env(safe-area-inset-bottom)]"
        aria-label="Main"
      >
        <div className="flex">
          {items.map((item) => {
            const isActive = item.href === active
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={clsx(
                  'flex-1 flex flex-col items-center justify-center gap-1 min-h-16 text-xs font-semibold border-t-2 -mt-px',
                  isActive ? 'text-orange-700 border-orange-600 bg-orange-50' : 'text-slate-500 border-transparent',
                )}
              >
                <item.icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
