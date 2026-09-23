'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Radio,
  RotateCcw,
  Bell,
  Mic,
  ArrowUpRight,
  Terminal,
} from 'lucide-react'
import { useAppStore } from '@/store'
import { UserRole } from '@/types'
import { VoiceAssistantModal } from './VoiceAssistantModal'

export function DemoRoleSwitcher() {
  const pathname = usePathname()
  const router = useRouter()
  const {
    currentRole,
    currentUser,
    switchRole,
    notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    resetDemoData,
  } = useAppStore()

  const [isVoiceOpen, setIsVoiceOpen] = useState(false)
  const [isNotifsOpen, setIsNotifsOpen] = useState(false)

  const roles: { role: UserRole; code: string; label: string; path: string; name: string }[] = [
    { role: 'retailer', code: '01', label: 'RETAILER', path: '/dashboard/retailer', name: 'MAMA SARAH' },
    { role: 'wholesaler', code: '02', label: 'WHOLESALE', path: '/dashboard/wholesaler', name: 'KILIMO TRADERS' },
    { role: 'farmer', code: '03', label: 'FARM GATE', path: '/dashboard/farmer', name: 'GREEN VALLEY' },
    { role: 'boda_rider', code: '04', label: 'BODA DISPATCH', path: '/dashboard/boda_rider', name: 'JAMES BODA' },
  ]

  const handleSwitch = (r: UserRole, path: string) => {
    switchRole(r)
    router.push(path)
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 font-mono text-xs select-none shadow-xs">
        <div className="max-w-[1500px] mx-auto px-3 sm:px-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between py-2 gap-2">
            {/* Left: Terminal Branding */}
            <div className="flex items-center justify-between gap-3">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="relative w-8 h-8 rounded-md overflow-hidden border border-orange-200 shrink-0 bg-orange-50 shadow-2xs group-hover:border-orange-400 transition-colors">
                  <img
                    src="/icons/logo-square.png"
                    alt="Kuja Na Stock Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 font-bold tracking-tight leading-none">
                    <span className="text-slate-900 text-sm font-black">KUJA NA STOCK</span>
                    <span className="px-1 py-0.5 bg-orange-100 text-orange-700 text-[9px] font-black rounded-xs">KNS</span>
                  </div>
                  <span className="text-slate-400 text-[9px] hidden sm:inline leading-tight mt-0.5">NAIROBI LOGISTICS HUB</span>
                </div>
              </Link>

              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 border border-slate-200 bg-slate-50 text-slate-600 text-[10px]">
                  <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-ping" />
                  ONLINE: EAT_GMT+3
                </span>

                {/* Mobile Trigger Buttons */}
                <div className="flex items-center gap-1.5 lg:hidden">
                  <button
                    onClick={() => setIsVoiceOpen(true)}
                    className="p-1.5 bg-orange-600 text-white font-bold"
                  >
                    <Mic className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setIsNotifsOpen(!isNotifsOpen)}
                    className="p-1.5 bg-slate-100 text-slate-700 border border-slate-200 relative"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-orange-600 text-white text-[9px] font-black flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Center: Tactical Persona Toggle Grid */}
            <div className="flex items-center gap-1 overflow-x-auto bg-slate-100 p-1 border border-slate-200">
              {roles.map(({ role, code, label, path, name }) => {
                const isActive = pathname.includes(role) || currentRole === role
                return (
                  <button
                    key={role}
                    onClick={() => handleSwitch(role, path)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-mono tracking-wider uppercase whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-orange-600 text-white font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                    }`}
                  >
                    <span className={isActive ? 'text-orange-200 font-bold' : 'text-orange-600 font-bold'}>
                      [{code}]
                    </span>
                    <span>{label}</span>
                    <span className={`text-[9px] hidden xl:inline ${isActive ? 'text-orange-100' : 'text-slate-400'}`}>
                      ({name})
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Right: Actions */}
            <div className="hidden lg:flex items-center gap-2">
              {/* Voice HUD launcher */}
              <button
                onClick={() => setIsVoiceOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-400 text-slate-800 transition-colors shadow-xs"
              >
                <Mic className="w-3.5 h-3.5 text-orange-600" />
                <span className="text-[11px] font-bold">VOICE HUD</span>
              </button>

              {/* Realtime Event Stream Drawer */}
              <div className="relative">
                <button
                  onClick={() => setIsNotifsOpen(!isNotifsOpen)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 border transition-colors shadow-xs ${
                    unreadCount > 0
                      ? 'border-orange-400 bg-orange-50 text-orange-800 font-bold'
                      : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Bell className="w-3.5 h-3.5 text-orange-600" />
                  <span className="text-[11px] font-bold">{unreadCount} ALERTS</span>
                </button>

                {/* Dropdown */}
                {isNotifsOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 shadow-2xl p-3 z-50 animate-in fade-in">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <span className="text-[11px] font-black text-orange-600 uppercase tracking-wider">
                        // DISPATCH EVENT LOG
                      </span>
                      <button
                        onClick={markAllNotificationsRead}
                        className="text-[10px] text-slate-500 hover:text-slate-900 underline uppercase"
                      >
                        [CLEAR ALL]
                      </button>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 py-1">
                      {notifications.length === 0 ? (
                        <p className="text-[11px] text-slate-400 py-4 text-center">NO RECENT DISPATCH LOGS</p>
                      ) : (
                        notifications.slice(0, 10).map((n) => (
                          <div
                            key={n.id}
                            onClick={() => markNotificationRead(n.id)}
                            className={`py-2.5 px-2 text-left cursor-pointer transition-colors ${
                              !n.is_read ? 'bg-orange-50/70 border-l-2 border-orange-500' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-900 uppercase">{n.title}</span>
                              <span className="text-[9px] text-slate-400">
                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-1 leading-snug">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Reset State */}
              <button
                onClick={() => {
                  resetDemoData()
                  alert('[STATUS: SIMULATION_DATA_RESET_TO_DEFAULTS]')
                }}
                className="p-1.5 border border-slate-200 bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-900 shadow-xs"
                title="Reset simulation telemetry"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Voice Assistant Modal */}
      <VoiceAssistantModal isOpen={isVoiceOpen} onClose={() => setIsVoiceOpen(false)} />
    </>
  )
}
