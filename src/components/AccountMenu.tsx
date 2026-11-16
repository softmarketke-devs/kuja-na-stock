'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { LayoutDashboard, LogIn, LogOut, UserPlus, UserRound } from 'lucide-react'
import { signOut } from '@/app/actions/auth'
import { DASHBOARD_HOME } from '@/lib/constants'
import type { Profile } from '@/types'

const ROLE_LABEL: Record<string, string> = {
  retailer: 'Butchery',
  supplier: 'Supplier',
  rider: 'Meat carrier',
  admin: 'Admin',
  customer: 'Customer',
}

const item = 'flex items-center gap-2 px-4 py-2.5 text-[15px] hover:bg-[#c8a25a22]'

/**
 * Header profile button. Signed out: a dropdown with Log in and Sign up.
 * Signed in: name, role, Dashboard, Profile and Sign out.
 */
export function AccountMenu({ profile }: { profile: Pick<Profile, 'role' | 'full_name'> | null }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const name = profile?.full_name?.trim() || 'Account'
  const home = profile ? (DASHBOARD_HOME[profile.role] ?? '/dashboard') : '/dashboard'

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={profile ? 'Account menu' : 'Profile menu'}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((o) => !o)}
        className="w-10 h-10 flex items-center justify-center rounded-sm text-[#efe6d3] hover:bg-[#c8a25a22]"
      >
        {profile ? (
          <span className="w-8 h-8 rounded-full bg-[#c8a25a] text-[#14100c] font-semibold flex items-center justify-center text-sm" aria-hidden>
            {name.charAt(0).toUpperCase()}
          </span>
        ) : (
          <UserRound className="w-5 h-5" aria-hidden />
        )}
      </button>

      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-60 bg-[#1b1613] text-[#efe6d3] border border-[#2f2721] rounded-sm shadow-xl z-30">
          {profile ? (
            <>
              <div className="px-4 py-3 border-b border-[#2f2721]">
                <div className="font-semibold truncate">{name}</div>
                <div className="text-xs text-[#a79c8b]">{ROLE_LABEL[profile.role] ?? profile.role}</div>
              </div>
              <Link role="menuitem" href={home} className={item} onClick={() => setOpen(false)}>
                <LayoutDashboard className="w-4 h-4 text-[#c8a25a]" aria-hidden /> Dashboard
              </Link>
              <Link role="menuitem" href="/dashboard/settings" className={item} onClick={() => setOpen(false)}>
                <UserRound className="w-4 h-4 text-[#c8a25a]" aria-hidden /> Profile
              </Link>
              <form action={signOut} className="border-t border-[#2f2721]">
                <button type="submit" role="menuitem" className={`${item} w-full text-left`}>
                  <LogOut className="w-4 h-4 text-[#c8a25a]" aria-hidden /> Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link role="menuitem" href="/login" className={item} onClick={() => setOpen(false)}>
                <LogIn className="w-4 h-4 text-[#c8a25a]" aria-hidden /> Log in
              </Link>
              <Link role="menuitem" href="/signup" className={item} onClick={() => setOpen(false)}>
                <UserPlus className="w-4 h-4 text-[#c8a25a]" aria-hidden /> Sign up
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  )
}
