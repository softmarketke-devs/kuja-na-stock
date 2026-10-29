import Link from 'next/link'
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
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <Link href="/" className="font-black uppercase tracking-tight">
            {BRAND_NAME}
          </Link>
        </div>
      </header>
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8">
        {draft && (
          <div className="bg-orange-50 border border-orange-200 text-sm p-3 mb-6">
            Draft for the pilot. Not yet reviewed by a lawyer.
          </div>
        )}
        <h1 className="text-2xl font-black uppercase tracking-tight">{title}</h1>
        {draft && <p className="text-xs text-slate-500 mt-1">Last updated 28 October 2026</p>}
        <div className="mt-6 space-y-6 text-sm leading-relaxed text-slate-700 [&_h2]:text-base [&_h2]:font-black [&_h2]:text-slate-900 [&_h2]:mb-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
          {children}
        </div>
      </main>
    </div>
  )
}
