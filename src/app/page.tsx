import Link from 'next/link'
import { ArrowRight, FileCheck, KeyRound, Moon, Scale, ShieldCheck, Store, Sunrise, Truck, Warehouse } from 'lucide-react'
import { BRAND_NAME, BRAND_TAGLINE, SITE_URL, SUPPORT_EMAIL } from '@/lib/brand'
import { DELIVERY_WINDOW, FEE_PER_KM, ISSUE_REPORT_HOURS, MIN_DELIVERY_FEE, ORDER_CUTOFF_HOUR } from '@/lib/constants'
import { ContactButtons } from '@/components/ContactButtons'
import { CutoffCountdown } from '@/components/landing/CutoffCountdown'
import { DeliveryCodeDemo } from '@/components/landing/DeliveryCodeDemo'
import { FeeCalculator } from '@/components/landing/FeeCalculator'
import { primaryButton, secondaryButton } from '@/components/ui'

// The story runs from night to dawn: each step has its own time on the clock.
const STEPS = [
  {
    icon: Moon,
    time: '21:00',
    title: 'Order by 9 PM',
    body: 'After closing, compare nearby slaughterhouses and meat wholesalers side by side: price per kg, distance and delivery fee, all shown before you order.',
  },
  {
    icon: Warehouse,
    time: 'Overnight',
    title: 'Supplier confirms',
    body: 'The supplier reserves your meat overnight and packs it. You get an SMS when it’s confirmed.',
  },
  {
    icon: Truck,
    time: '05:00',
    title: 'Carrier collects',
    body: 'A licensed meat carrier collects the morning’s orders with the certificate of transport and delivers them along one route. You can follow the carrier on a live map.',
  },
  {
    icon: KeyRound,
    time: 'By 07:00',
    title: 'Check, pay, give the code',
    body: 'Check the weight and the inspection stamp, pay the carrier (cash or M-Pesa) and give them your 4-digit code. Your stock count updates automatically.',
  },
]

// Sample rows for the example card in the hero. Clearly labelled "Example" on the page.
const EXAMPLE_ROWS = [
  { name: 'Supplier A', km: '4.2 km', price: 'KSh 780/kg', total: 'KSh 8,010', tag: 'Best total' },
  { name: 'Supplier B', km: '9.8 km', price: 'KSh 760/kg', total: 'KSh 8,090', tag: '' },
  { name: 'Supplier C', km: '2.1 km', price: 'KSh 820/kg', total: 'KSh 8,310', tag: 'Nearest' },
]

const ORG_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: BRAND_NAME,
  url: SITE_URL,
  description: BRAND_TAGLINE,
  areaServed: { '@type': 'City', name: 'Nairobi' },
  email: SUPPORT_EMAIL,
}

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSON_LD).replace(/</g, '\\u003c') }} />
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/logo-square.png" alt="" className="w-8 h-8 border border-orange-200" />
            <span className="font-black uppercase tracking-tight">{BRAND_NAME}</span>
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
        <section
          className="relative isolate border-b border-slate-200 bg-[#0B1020] bg-cover bg-[position:50%_85%] text-white"
          style={{ backgroundImage: "url('/hero-beef-cuts.jpg')" }}
        >
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0B1020]/90 via-[#0B1020]/65 to-[#0B1020]/30" aria-hidden />
          <div className="max-w-5xl mx-auto px-4 py-16 sm:py-24 grid gap-10 lg:grid-cols-[1.2fr_1fr] items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-orange-400 flex items-center gap-2">
                <Sunrise className="w-4 h-4" /> For Nairobi butcheries
              </p>
              <h1 className="text-[2.6rem] sm:text-6xl font-extrabold leading-[1] text-balance mt-4 max-w-3xl">
                Order tonight.{' '}
                <span className="text-orange-400">Stocked by 7 AM.</span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-200 mt-5 max-w-xl leading-relaxed">
                Order meat in the evening from slaughterhouses and wholesalers near you, and a licensed meat carrier brings it
                to your butchery {DELIVERY_WINDOW}, before you open.
              </p>
              <div className="mt-6">
                <CutoffCountdown />
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-3 mt-6">
                <Link href="/signup" className={primaryButton + ' !min-h-14 !px-6 !text-base'}>
                  <Store className="w-5 h-5" /> I own a butchery <ArrowRight className="w-5 h-5" />
                </Link>
                <p className="text-sm text-slate-300">
                  Or join as a{' '}
                  <Link href="/signup" className="font-bold text-white underline underline-offset-4">supplier</Link>
                  {' '}or a{' '}
                  <Link href="/signup" className="font-bold text-white underline underline-offset-4">meat carrier</Link>
                </p>
              </div>
            </div>

            <div className="hidden lg:block" aria-hidden>
              <div className="bg-white text-slate-900 border border-slate-200 rounded-3xl shadow-2xl p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-slate-500">Compare suppliers</span>
                  <span className="text-[11px] font-bold bg-slate-100 border border-slate-200 px-2 py-0.5">Example</span>
                </div>
                <div className="font-black mt-2">10 kg beef, boneless</div>
                <ul className="mt-2 divide-y divide-slate-100 border-y border-slate-100">
                  {EXAMPLE_ROWS.map((r) => (
                    <li key={r.name} className="py-2 flex items-center justify-between gap-3 text-sm">
                      <div>
                        <div className="font-bold">
                          {r.name}{' '}
                          {r.tag && <span className="ml-1 text-[11px] font-bold bg-orange-100 text-orange-800 border border-orange-200 px-1.5 py-0.5">{r.tag}</span>}
                        </div>
                        <div className="text-xs text-slate-500">{r.price} · {r.km}</div>
                      </div>
                      <div className="font-black tabular-nums">{r.total}</div>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-slate-500 mt-2">Totals include delivery to your butchery.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white border-b border-slate-200">
          <dl className="max-w-5xl mx-auto px-4 py-5 grid grid-cols-2 gap-4 sm:grid-cols-4 text-sm">
            <div>
              <dt className="text-xs font-bold uppercase text-slate-500">Order by</dt>
              <dd className="font-black tabular-nums">{ORDER_CUTOFF_HOUR}:00 daily</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-slate-500">Delivered</dt>
              <dd className="font-black tabular-nums">{DELIVERY_WINDOW}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-slate-500">Delivery fee</dt>
              <dd className="font-black tabular-nums">KSh {FEE_PER_KM}/km, min {MIN_DELIVERY_FEE}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-slate-500">Problems</dt>
              <dd className="font-black tabular-nums">Report within {ISSUE_REPORT_HOURS} h</dd>
            </div>
          </dl>
        </section>

        {/* Night to dawn: midnight navy, through ember orange, into morning cream. */}
        <section className="bg-gradient-to-b from-[#0B1020] via-[#7c2d12] to-[#FFF7ED]">
          <div className="max-w-5xl mx-auto px-4 pt-14 pb-16">
            <h2 className="text-xs font-black uppercase tracking-wider text-orange-300">How it works: from 9 PM to 7 AM</h2>
            <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mt-6">
              {STEPS.map((s, i) => (
                <li key={s.title} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-[var(--shadow-soft)] hover:-translate-y-1 hover:shadow-[var(--shadow-lift)] transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <span className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center"><s.icon className="w-6 h-6 text-orange-600" /></span>
                    <span className="text-sm font-black tabular-nums text-orange-700 bg-orange-50 border border-orange-200 rounded-full px-2.5 py-0.5">{s.time}</span>
                  </div>
                  <div className="text-[13px] font-bold text-slate-400 mt-3">STEP {i + 1}</div>
                  <h3 className="font-display text-lg font-extrabold leading-tight">{s.title}</h3>
                  <p className="text-sm text-slate-600 mt-1">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="bg-[#FFF7ED]">
          <div className="max-w-5xl mx-auto px-4 pb-14 grid gap-5 md:grid-cols-2">
            <FeeCalculator />
            <DeliveryCodeDemo />
          </div>
        </section>

        <section className="bg-white border-y border-slate-200">
          <div className="max-w-5xl mx-auto px-4 py-12 grid gap-8 sm:grid-cols-3">
            <div>
              <span className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center"><Scale className="w-6 h-6 text-orange-600" /></span>
              <h3 className="font-black mt-2">Prices you can see</h3>
              <p className="text-sm text-slate-600 mt-1">
                Every supplier’s price per kg, distance and delivery fee, side by side, before you order.
              </p>
            </div>
            <div>
              <span className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center"><FileCheck className="w-6 h-6 text-orange-600" /></span>
              <h3 className="font-black mt-2">Licensed carriers only</h3>
              <p className="text-sm text-slate-600 mt-1">
                We check each carrier’s meat transport permit and vehicle before they can take runs, and they enter the
                certificate of transport at pickup. Delivery is KSh {FEE_PER_KM} per km (minimum KSh {MIN_DELIVERY_FEE}), paid to the carrier.
              </p>
            </div>
            <div>
              <span className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center"><ShieldCheck className="w-6 h-6 text-orange-600" /></span>
              <h3 className="font-black mt-2">Problems get resolved</h3>
              <p className="text-sm text-slate-600 mt-1">
                A delivery counts only once you give the carrier your code. Short weight or poor quality? Report it within{' '}
                {ISSUE_REPORT_HOURS} hours and the supplier is told by SMS.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-[#0B1020] text-white">
          <div className="max-w-5xl mx-auto px-4 py-12 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight">Stock up tonight, open tomorrow with a full counter.</h2>
              <p className="text-slate-300 mt-1">Order before {ORDER_CUTOFF_HOUR}:00 for delivery {DELIVERY_WINDOW}.</p>
            </div>
            <Link href="/signup" className={primaryButton + ' !min-h-14 !px-6 !text-base shrink-0'}>
              <Store className="w-5 h-5" /> I own a butchery
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto w-full px-4 py-6 space-y-3 text-xs text-slate-500">
          <ContactButtons />
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span>
              © {new Date().getFullYear()} {BRAND_NAME} · Nairobi
            </span>
            <Link href="/delivery-and-payment" className="underline">Delivery and payment</Link>
            <Link href="/faq" className="underline">FAQs</Link>
            <Link href="/terms" className="underline">Terms</Link>
            <Link href="/privacy" className="underline">Privacy</Link>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="underline">{SUPPORT_EMAIL}</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
