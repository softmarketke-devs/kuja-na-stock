import Link from 'next/link'
import { Moon, Sunrise, Truck } from 'lucide-react'
import { BRAND_NAME } from '@/lib/brand'

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen ember-glow flex flex-col justify-center px-4 py-10">
      <div className="w-full max-w-md mx-auto rise-in">
        <Link href="/" className="flex items-center gap-3 justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/logo-square.png" alt="" className="w-11 h-11 rounded-xl shadow-md" />
          <span className="font-display text-2xl font-extrabold tracking-tight">{BRAND_NAME}</span>
        </Link>
        <p className="text-center text-sm text-slate-600 mt-2 flex items-center justify-center gap-2">
          <Moon className="w-4 h-4 text-orange-600" aria-hidden /> {subtitle}
        </p>
        <div className="bg-white border border-slate-200 rounded-3xl shadow-[var(--shadow-lift)] p-6 sm:p-8 mt-6">
          <h1 className="font-display text-2xl font-extrabold tracking-tight mb-5">{title}</h1>
          {children}
        </div>
        <p className="mt-6 flex items-center justify-center gap-4 text-xs font-bold text-slate-500">
          <span className="flex items-center gap-1.5"><Moon className="w-3.5 h-3.5" /> Order by 9 PM</span>
          <span className="flex items-center gap-1.5"><Truck className="w-3.5 h-3.5" /> Carrier at 5 AM</span>
          <span className="flex items-center gap-1.5"><Sunrise className="w-3.5 h-3.5" /> Stocked by 7</span>
        </p>
      </div>
    </div>
  )
}
