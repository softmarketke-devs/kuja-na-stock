import type { Metadata } from 'next'
import { ContactButtons } from '@/components/ContactButtons'
import { LegalPage } from '@/components/LegalPage'
import { pageMetadata } from '@/lib/seo'
import { BRAND_NAME } from '@/lib/brand'

export const metadata: Metadata = pageMetadata({
  title: 'FAQs',
  description: `Answers about ordering premium cuts from ${BRAND_NAME}: how to order, delivery, payment and problems.`,
  path: '/faq',
})

const FAQS: { q: string; a: string }[] = [
  {
    q: 'How do I order?',
    a: 'Create a customer account, add cuts to your cart and place the order with your delivery address. We confirm the final price and delivery, then you pay. You can also send your cart to us on WhatsApp.',
  },
  {
    q: 'Do I need an account?',
    a: 'To order in the app, yes. It lets you track your orders and pay. Without one, you can message us on WhatsApp.',
  },
  {
    q: 'Which cuts do you sell?',
    a: 'Steaks, ribs, offal, mutura and more. See the list on the home page or use the search. Prices are per kilogram and we confirm them when you order.',
  },
  {
    q: 'How much is delivery?',
    a: 'It depends on where you are. We confirm the delivery fee together with the price before you pay.',
  },
  {
    q: 'How do I pay?',
    a: 'You choose at checkout: M-Pesa, or pay on delivery. You only pay after we have confirmed the price.',
  },
  {
    q: 'Can I change or cancel my order?',
    a: 'You can cancel it yourself from My orders until it is paid. After that, message us and we will help.',
  },
  {
    q: 'Something was wrong with my order. What now?',
    a: 'Message us on WhatsApp with your order number and a photo. We will put it right.',
  },
]

export default function FaqPage() {
  return (
    <LegalPage title="Frequently asked questions" draft={false}>
      <div className="divide-y divide-slate-200 border-y border-slate-200">
        {FAQS.map((f) => (
          <details key={f.q} className="py-3 group">
            <summary className="font-bold text-slate-900 cursor-pointer list-none flex justify-between gap-3">
              {f.q}
              <span className="text-orange-600 group-open:rotate-45 transition-transform" aria-hidden>
                +
              </span>
            </summary>
            <p className="mt-2">{f.a}</p>
          </details>
        ))}
      </div>
      <ContactButtons />
    </LegalPage>
  )
}
