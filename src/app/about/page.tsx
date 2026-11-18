import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { LegalPage } from '@/components/LegalPage'
import { pageMetadata } from '@/lib/seo'
import { BRAND_NAME, INSTAGRAM_HANDLE, INSTAGRAM_URL } from '@/lib/brand'

export const metadata: Metadata = pageMetadata({
  title: 'About us',
  description: `${BRAND_NAME}: premium steaks, ribs and offal, butchered properly and delivered sealed in Nairobi.`,
  path: '/about',
})

export default function AboutPage() {
  return (
    <LegalPage title="About us" draft={false}>
      <section className="space-y-3">
        <h2>Welcome to {BRAND_NAME}</h2>
        <p className="italic">“Where quality is not a promise, it’s our identity.”</p>
        <p>
          At BIG PREMIUM CUTS, we believe that meat is more than food: it is heritage, craft and excellence served with pride.
          We deal with top-grade meat, responsibly sourced, professionally slaughtered, with a standard that speaks for itself.
        </p>
        <p>
          Whether you are buying for your home, your butchery, your event, or your business, you deserve nothing less than the
          finest quality Kenya can offer. This is the beginning of a new chapter. Welcome to BIG PREMIUM CUTS, where excellence
          meets your plate.
        </p>
        <Image src="/brand/big-packs-tomahawk.png" alt="BIG Premium Cuts tomahawk steaks, sealed and ready for delivery" width={500} height={835} className="w-full max-w-xs h-auto rounded-sm" />
        <p>
          Follow us on{' '}
          <a href={INSTAGRAM_URL} rel="noopener" className="underline">
            {INSTAGRAM_HANDLE}
          </a>{' '}
          for cooking tips and new cuts.
        </p>
      </section>
      <section>
        <h2>Buying for your table</h2>
        <p>
          Use the steak map on the <Link href="/" className="underline">home page</Link> to see where each cut comes from, add
          cuts to your cart and place your order. We confirm the price and delivery with you, then you pay.{' '}
          <Link href="/signup" className="underline">Create an account</Link> or{' '}
          <Link href="/login" className="underline">log in</Link>, and read{' '}
          <Link href="/faq" className="underline">the FAQs</Link> and{' '}
          <Link href="/delivery-and-payment" className="underline">how delivery and payment work</Link>.
        </p>
      </section>
    </LegalPage>
  )
}
