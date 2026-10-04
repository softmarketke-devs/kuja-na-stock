import Link from 'next/link'
import { FileCheck, KeyRound, Moon, Scale, Store, Sunrise, Truck, Warehouse } from 'lucide-react'
import { DELIVERY_WINDOW, FEE_PER_KM, MIN_DELIVERY_FEE } from '@/lib/constants'
import { primaryButton, secondaryButton } from '@/components/ui'

const STEPS = [
  {
    icon: Moon,
    title: 'Order by 9 PM',
    body: 'After closing, compare nearby slaughterhouses and meat wholesalers side by side: price per kg, distance and delivery fee, all shown before you order.',
  },
  {
    icon: Warehouse,
    title: 'Supplier confirms',
    body: 'The supplier reserves your meat overnight and packs it. You get an SMS when it’s confirmed.',
  },
  {
    icon: Truck,
    title: 'Carrier collects at 5 AM',
    body: 'A licensed meat carrier collects the morning’s orders with the certificate of transport and delivers them along one route.',
  },
  {
    icon: KeyRound,
    title: 'Check, pay, give the code',
    body: 'Check the weight and the inspection stamp, pay the carrier (cash or M-Pesa) and give them your 4-digit code. Your stock count updates automatically.',
  },
]

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/logo-square.png" alt="" className="w-8 h-8 border border-orange-200" />
            <span className="font-black uppercase tracking-tight">Kuja Na Stock</span>
          </Link>
          <div className="flex gap-2">
            <Link href="/login" className={secondaryButton + ' !py-2'}>
              Sign in
            </Link>
            <Link href="/signup" className={primaryButton + ' !py-2 hidden sm:inline-flex'}>
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="tactical-grid border-b border-slate-200">
          <div className="max-w-5xl mx-auto px-4 py-14 sm:py-20">
            <p className="text-xs font-black uppercase tracking-wider text-orange-700 flex items-center gap-2">
              <Sunrise className="w-4 h-4" /> For Nairobi butcheries
            </p>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight mt-3 max-w-2xl">
              Order tonight. Stocked by 7 AM.
            </h1>
            <p className="text-lg text-slate-700 mt-4 max-w-xl">
              Order meat in the evening from slaughterhouses and wholesalers near you, and a licensed meat carrier brings it
              to your butchery {DELIVERY_WINDOW}, before you open.
            </p>
            <div className="flex flex-wrap gap-2 mt-6">
              <Link href="/signup" className={primaryButton}>
                <Store className="w-4 h-4" /> I own a butchery
              </Link>
              <Link href="/signup" className={secondaryButton}>
                <Warehouse className="w-4 h-4" /> I’m a supplier
              </Link>
              <Link href="/signup" className={secondaryButton}>
                <Truck className="w-4 h-4" /> I’m a meat carrier
              </Link>
            </div>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 py-12">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">How it works</h2>
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mt-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="bg-white border border-slate-200 p-4">
                <s.icon className="w-6 h-6 text-orange-600" />
                <div className="text-[13px] font-bold text-slate-400 mt-3">STEP {i + 1}</div>
                <h3 className="font-black">{s.title}</h3>
                <p className="text-sm text-slate-600 mt-1">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="bg-white border-y border-slate-200">
          <div className="max-w-5xl mx-auto px-4 py-12 grid gap-8 sm:grid-cols-3">
            <div>
              <Scale className="w-6 h-6 text-orange-600" />
              <h3 className="font-black mt-2">Prices you can see</h3>
              <p className="text-sm text-slate-600 mt-1">
                Every supplier’s price per kg, distance and delivery fee, side by side, before you order.
              </p>
            </div>
            <div>
              <FileCheck className="w-6 h-6 text-orange-600" />
              <h3 className="font-black mt-2">Licensed carriers only</h3>
              <p className="text-sm text-slate-600 mt-1">
                Carriers must record a valid meat transport permit to take runs, and enter the certificate of transport at
                pickup. Delivery is KSh {FEE_PER_KM} per km (minimum KSh {MIN_DELIVERY_FEE}), paid to the carrier.
              </p>
            </div>
            <div>
              <KeyRound className="w-6 h-6 text-orange-600" />
              <h3 className="font-black mt-2">Nothing changes hands without your code</h3>
              <p className="text-sm text-slate-600 mt-1">
                A delivery counts only once you give the carrier your code. Short weight or poor quality? Report it within
                24 hours.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="max-w-5xl mx-auto w-full px-4 py-6 text-xs text-slate-500">
        © {new Date().getFullYear()} Kuja Na Stock · Nairobi
      </footer>
    </div>
  )
}
