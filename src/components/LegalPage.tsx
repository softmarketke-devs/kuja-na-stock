import Link from 'next/link'
import Image from 'next/image'
import { BRAND_NAME } from '@/lib/brand'

export function LegalPage({
  title,
  children,
  draft = true,
}: {
  title: string
  children: React.ReactNode
  draft?: boolean
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-[#120e0c] text-[#efe6d3] border-b border-[#2f2721]">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center">
          <Link href="/" aria-label={`${BRAND_NAME}, home`}>
            <Image src="/brand/big-logo.png" alt={BRAND_NAME} width={52} height={52} className="h-[52px] w-auto" />
          </Link>
        </div>
      </header>
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8">
        {draft && (
          <div className="bg-orange-50 border border-orange-200 text-sm p-3 mb-6">
            Draft for the pilot. Not yet reviewed by a lawyer.
          </div>
        )}
        <h1 className="font-display text-3xl font-bold">{title}</h1>
        {draft && <p className="text-xs text-slate-500 mt-1">Last updated 28 October 2026</p>}
        <div className="mt-6 space-y-6 text-sm leading-relaxed text-slate-700 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-slate-900 [&_h2]:mb-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
          {children}
        </div>
      </main>
    </div>
  )
}
