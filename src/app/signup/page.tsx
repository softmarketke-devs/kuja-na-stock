'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Terminal } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useAppStore } from '@/store'
import { UserRole } from '@/types'

export default function SignUpPage() {
  const router = useRouter()
  const { signUp } = useAuth()
  const { switchRole } = useAppStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<UserRole>('retailer')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleStandardSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data, error: err } = await signUp(email, password, role, fullName)
      if (err) throw err
      switchRole(role)
      router.push(`/dashboard/${role}`)
    } catch (err: any) {
      setError(err.message || 'Registration failed.')
    } finally {
      setLoading(false)
    }
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
          REGISTER NEW OPERATOR NODE // NAIROBI NETWORK
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white border border-slate-200 shadow-xs p-6 sm:p-8 space-y-5">
          <form className="space-y-4 text-xs" onSubmit={handleStandardSignUp}>
            {error && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-[11px] font-bold">
                {error}
              </div>
            )}

            <div>
              <label className="text-[10px] text-slate-600 uppercase block mb-1 font-bold">
                OPERATOR / BUSINESS IDENTIFIER
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Mama Sarah Fresh Kiosk"
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 py-2 px-3 font-mono font-bold focus:border-orange-500 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-600 uppercase block mb-1 font-bold">
                NODE ROLE ASSIGNMENT
              </label>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                {[
                  { r: 'retailer' as const, label: '[01] RETAILER', desc: 'Kiosk / Shop' },
                  { r: 'wholesaler' as const, label: '[02] WHOLESALE', desc: 'Bulk Depot' },
                  { r: 'farmer' as const, label: '[03] FARM GATE', desc: 'Direct Crop' },
                  { r: 'boda_rider' as const, label: '[04] BODA', desc: 'Carrier' },
                ].map(({ r, label, desc }) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`p-2 border text-left transition-all ${
                      role === r
                        ? 'border-orange-500 bg-orange-50 text-orange-950 font-black shadow-2xs'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <span className="block font-bold">{label}</span>
                    <span className="text-[9px] text-slate-400 block">{desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-600 uppercase block mb-1 font-bold">
                OPERATOR EMAIL // TRANSMISSION ADDRESS
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@domain.co.ke"
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 py-2 px-3 font-mono font-bold focus:border-orange-500 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-600 uppercase block mb-1 font-bold">
                SECURE ACCESS KEY
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
              <span>{loading ? 'REGISTERING...' : 'INITIALIZE NODE ACCESS »'}</span>
            </button>
          </form>

          <div className="text-center pt-2 border-t border-slate-200">
            <Link href="/login" className="text-xs text-slate-500 hover:text-orange-600 transition-colors">
              [EXISTING OPERATOR? PROCEED TO AUTHENTICATION]
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
