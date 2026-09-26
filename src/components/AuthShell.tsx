import Link from 'next/link'

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
    <div className="min-h-screen tactical-grid flex flex-col justify-center px-4 py-10">
      <div className="w-full max-w-md mx-auto">
        <Link href="/" className="flex items-center gap-2.5 justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/logo-square.png" alt="" className="w-10 h-10 border border-orange-200" />
          <span className="text-xl font-black uppercase tracking-tight">Kuja Na Stock</span>
        </Link>
        <p className="text-center text-sm text-slate-500 mt-2">{subtitle}</p>
        <div className="bg-white border border-slate-200 shadow-xs p-6 mt-6">
          <h1 className="text-lg font-black uppercase tracking-tight mb-4">{title}</h1>
          {children}
        </div>
      </div>
    </div>
  )
}
