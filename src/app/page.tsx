import Link from 'next/link'
import Image from 'next/image'
import { BRAND_NAME, BRAND_TAGLINE, INSTAGRAM_HANDLE, INSTAGRAM_URL, SITE_URL, SUPPORT_EMAIL, SUPPORT_WHATSAPP } from '@/lib/brand'
import { ALL_CUTS, FEATURED } from '@/lib/steak-map'
import { priceFor } from '@/lib/catalogue'
import { SteakMap } from '@/components/landing/SteakMap'
import { AccountMenu } from '@/components/AccountMenu'
import { HeaderActions } from '@/components/storefront/HeaderActions'
import { AddToCart } from '@/components/storefront/AddToCart'
import { CartProvider } from '@/lib/cart'
import { StoreAssistant } from '@/components/storefront/StoreAssistant'
import { getProfile } from '@/lib/auth'

const wa = (text: string) => `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(`Hello ${BRAND_NAME}, ${text}`)}`
// 254716280493 -> 0716 280 493
const phoneDisplay = SUPPORT_WHATSAPP.startsWith('254') ? `0${SUPPORT_WHATSAPP.slice(3, 6)} ${SUPPORT_WHATSAPP.slice(6, 9)} ${SUPPORT_WHATSAPP.slice(9)}` : SUPPORT_WHATSAPP
const price = (name: string) => {
  const p = priceFor(name)
  return p ? `KSh ${p.perKg.toLocaleString('en-KE')}/kg` : 'Ask for price'
}

const FAQ = [
  { q: 'How do I order?', a: 'Create a customer account, add your cuts to the cart and place the order with your delivery address. We confirm the final price and delivery time. You can also send your cart to us on WhatsApp. Paying in the app is coming.' },
  { q: 'Do you deliver?', a: 'Yes. Tell us your area in your message and we’ll confirm the fee and timing.' },
]

const ORG_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: BRAND_NAME,
  url: SITE_URL,
  description: BRAND_TAGLINE,
  areaServed: { '@type': 'City', name: 'Nairobi' },
  email: SUPPORT_EMAIL,
  sameAs: [INSTAGRAM_URL],
}

export default async function Home() {
  const profile = await getProfile()
  return (
    <CartProvider>
    <div className="min-h-screen flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSON_LD).replace(/</g, '\\u003c') }} />

      <header className="sticky top-0 z-20 h-16 bg-[#120e0c] text-[#efe6d3] border-b border-[#2f2721]">
        <div className="max-w-[1160px] mx-auto px-5 h-16 flex items-center gap-6">
          <Link href="/" aria-label={`${BRAND_NAME}, home`}>
            <Image src="/brand/big-logo.png" alt={BRAND_NAME} width={52} height={52} preload className="h-[52px] w-auto" />
          </Link>
          <nav className="ml-auto hidden md:flex gap-6 text-[15px] text-[#a79c8b]">
            <a href="#order" className="hover:text-[#efe6d3]">Order</a>
            <Link href="/about" className="hover:text-[#efe6d3]">About us</Link>
          </nav>
          <div className="ml-auto md:ml-0 flex items-center gap-1">
            <HeaderActions role={profile?.role ?? null}>
              <AccountMenu profile={profile ? { role: profile.role, full_name: profile.full_name } : null} />
            </HeaderActions>
            <a href={wa('I’d like to order.')} rel="noopener" aria-label="Order on WhatsApp" title="Order on WhatsApp" className="relative w-10 h-10 flex items-center justify-center rounded-sm text-[#efe6d3] hover:bg-[#c8a25a22]">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden>
                <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.22-8.23 8.22Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28Z" />
              </svg>
            </a>
          </div>
        </div>
      </header>

      <main id="top" className="flex-1">
        <section className="text-[#efe6d3] pt-10 pb-14" style={{ background: 'radial-gradient(70% 60% at 70% 45%, #3a110d, transparent 70%), #120e0c' }}>
          <div className="max-w-[1160px] mx-auto px-5">
            <SteakMap />
          </div>
        </section>

        <section id="order" className="py-14 md:py-[72px]">
          <div className="max-w-[1160px] mx-auto px-5">
            <h2 className="font-display font-bold text-[clamp(28px,3.4vw,40px)] leading-tight mb-2">Order your cuts</h2>
            <p className="text-slate-500 max-w-[34em] mb-7">
              Add cuts to your cart and place the order in the app with a customer account, or send the cart to us on WhatsApp. We confirm the price and delivery. Prices move with the market. Paying in the app is coming next.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
              {FEATURED.map((f) => (
                <figure key={f.name} className="m-0">
                  <Image src={f.image} alt={f.name} width={560} height={420} className="w-full aspect-[4/3] object-cover rounded-sm" />
                  <h3 className="font-display font-semibold text-[19px] mt-2.5">{f.name}</h3>
                  <p className="text-sm text-slate-500">{f.blurb}</p>
                  <p className="text-sm font-semibold text-orange-600">{price(f.name)}</p>
                  <div className="mt-2"><AddToCart name={f.name} /></div>
                </figure>
              ))}
            </div>
            <details className="mt-6 border-t border-slate-200 pt-3">
              <summary className="font-display font-semibold text-lg cursor-pointer">See all our cuts</summary>
              <div className="mt-3 md:columns-2 gap-10">
                {ALL_CUTS.map((n) => (
                  <div key={n} className="break-inside-avoid flex justify-between gap-3 py-2 border-b border-slate-200 text-[15px]">
                    <span>
                      {n}
                      {priceFor(n) && <small className="block text-slate-500">{price(n)}</small>}
                    </span>
                    <AddToCart name={n} />
                  </div>
                ))}
              </div>
            </details>
          </div>
        </section>

        <section id="faq" className="pb-14 md:pb-[72px]">
          <div className="max-w-[1160px] mx-auto px-5">
            {FAQ.map((f) => (
              <details key={f.q} className="border-b border-slate-200 py-3.5">
                <summary className="font-display font-semibold text-lg cursor-pointer">{f.q}</summary>
                <p className="text-slate-500 mt-2 max-w-[40em]">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 text-slate-500 text-[15px]">
        <div className="max-w-[1160px] mx-auto px-5 py-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
            <span>© {new Date().getFullYear()} {BRAND_NAME} · Nairobi</span>
            <span>WhatsApp <a href={wa('I have a question.')} rel="noopener" className="underline">{phoneDisplay}</a></span>
            <a href={INSTAGRAM_URL} rel="noopener" className="underline">{INSTAGRAM_HANDLE}</a>
            {!profile && <Link href="/signup" className="underline">Create an account</Link>}
            <Link href="/about" className="underline">About us</Link>
            <Link href="/faq" className="underline">FAQs</Link>
            <Link href="/delivery-and-payment" className="underline">Delivery and payment</Link>
            <Link href="/terms" className="underline">Terms</Link>
            <Link href="/privacy" className="underline">Privacy</Link>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="underline">{SUPPORT_EMAIL}</a>
          </div>
        </div>
      </footer>
      <StoreAssistant />
    </div>
    </CartProvider>
  )
}
