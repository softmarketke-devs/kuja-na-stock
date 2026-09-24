'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Terminal, Zap, Shield, Key } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useAppStore } from '@/store'
import { UserRole } from '@/types'

export default function LoginPage() {
  const router = useRouter()
  const { signIn } = useAuth()
  const { switchRole } = useAppStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data, error: err } = await signIn(email, password)
      if (err) throw err
      router.push('/dashboard/retailer')
    } catch (err: any) {
      setError(err.message || 'Authentication error. Use 1-click terminal macros below.')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickDemoLogin = (role: UserRole) => {
    switchRole(role)
    router.push(`/dashboard/${role}`)
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 tactical-grid font-mono flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-orange-600 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <div className="relative w-10 h-10 rounded-md overflow-hidden border border-orange-200 shrink-0 bg-orange-50 shadow-2xs">
            <img
              src="/icons/logo-square.png"
              alt="Kuja Na Stock Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-xl font-black text-slate-900 uppercase tracking-tight">KUJA NA STOCK // OPS</span>
        </Link>
        <p className="text-xs text-slate-500 uppercase tracking-wider">
          AUTHENTICATE TERMINAL SESSION // NAIROBI NETWORK
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
          {/* Quick Hardware Macro Access */}
          <div className="p-4 bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between text-[11px] font-black uppercase text-orange-600">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 fill-orange-600 text-orange-600" />
                HARDWARE BYPASS // 1-CLICK DEMO ACCESS
              </span>
              <span className="text-[9px] text-slate-400">NO_PASSWORD</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('retailer')}
                className="p-2.5 bg-white hover:bg-orange-50/60 border border-slate-200 hover:border-orange-400 text-left transition-colors shadow-2xs"
              >
                <span className="text-[10px] text-orange-600 font-bold block">[01] RETAILER</span>
                <span className="text-slate-900 font-bold text-xs truncate block">Mama Sarah Kiosk</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('wholesaler')}
                className="p-2.5 bg-white hover:bg-orange-50/60 border border-slate-200 hover:border-orange-400 text-left transition-colors shadow-2xs"
              >
                <span className="text-[10px] text-orange-600 font-bold block">[02] WHOLESALE</span>
                <span className="text-slate-900 font-bold text-xs truncate block">Kilimo Traders</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('farmer')}
                className="p-2.5 bg-white hover:bg-orange-50/60 border border-slate-200 hover:border-orange-400 text-left transition-colors shadow-2xs"
              >
                <span className="text-[10px] text-orange-600 font-bold block">[03] FARM GATE</span>
                <span className="text-slate-900 font-bold text-xs truncate block">Green Valley Co-op</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('boda_rider')}
                className="p-2.5 bg-white hover:bg-orange-50/60 border border-slate-200 hover:border-orange-400 text-left transition-colors shadow-2xs"
              >
                <span className="text-[10px] text-orange-600 font-bold block">[04] BODA RADAR</span>
                <span className="text-slate-900 font-bold text-xs truncate block">James Otieno</span>
              </button>
            </div>
          </div>

          <div className="flex items-center text-xs text-slate-400 uppercase">
            <div className="flex-grow border-t border-slate-200" />
            <span className="px-3">Or Credentials</span>
            <div className="flex-grow border-t border-slate-200" />
          </div>

          {/* Form */}
          <form className="space-y-4 text-xs" onSubmit={handleStandardLogin}>
            {error && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-[11px] font-bold">
                {error}
              </div>
            )}

            <div>
              <label className="text-[10px] text-slate-600 uppercase block mb-1 font-bold">
                OPERATOR ID // EMAIL
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@kujanastock.co.ke"
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 py-2 px-3 font-mono font-bold focus:border-orange-500 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-600 uppercase block mb-1 font-bold">
                ACCESS KEY // PASSWORD
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 py-2 px-3 font-mono font-bold focus:border-orange-500 focus:bg-white outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-black uppercase tracking-wider text-xs transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <span>{loading ? 'AUTHENTICATING...' : 'OPEN SESSION »'}</span>
            </button>
          </form>

          <div className="text-center pt-1 border-t border-slate-200">
            <Link href="/signup" className="text-xs text-slate-500 hover:text-orange-600 transition-colors">
              [NEW REGISTRATION // CREATE OPERATOR ACCOUNT]
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
