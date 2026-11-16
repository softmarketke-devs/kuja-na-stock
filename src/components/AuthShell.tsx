import Link from 'next/link'
import Image from 'next/image'
import { BRAND_NAME, BRAND_TAGLINE } from '@/lib/brand'

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
    <div
      className="min-h-screen flex flex-col justify-center px-4 py-10 text-[#efe6d3]"
      style={{ background: 'radial-gradient(70% 60% at 70% 20%, #3a110d, transparent 70%), #120e0c' }}
    >
      <div className="w-full max-w-md mx-auto rise-in">
        <Link href="/" className="flex flex-col items-center gap-2" aria-label={`${BRAND_NAME}, home`}>
          <Image src="/brand/big-logo.png" alt={BRAND_NAME} width={72} height={72} preload className="h-[72px] w-auto" />
        </Link>
        <p className="text-center text-sm text-[#a79c8b] mt-3">{subtitle}</p>
        <div className="bg-[#f6f0e3] text-[#1c1612] border border-[#e2d6bf] rounded-sm shadow-[var(--shadow-lift)] p-6 sm:p-8 mt-6">
          <h1 className="font-display text-2xl font-bold mb-5">{title}</h1>
          {children}
        </div>
        <p className="mt-6 text-center text-xs text-[#a79c8b]">{BRAND_TAGLINE}</p>
      </div>
    </div>
  )
}
