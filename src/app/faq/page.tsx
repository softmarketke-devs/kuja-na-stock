import type { Metadata } from 'next'
import { ContactButtons } from '@/components/ContactButtons'
import { LegalPage } from '@/components/LegalPage'
import { BRAND_NAME } from '@/lib/brand'
import { DELIVERY_WINDOW, FEE_PER_KM, ISSUE_REPORT_HOURS, MIN_DELIVERY_FEE, ORDER_CUTOFF_HOUR } from '@/lib/constants'

export const metadata: Metadata = { title: `FAQs | ${BRAND_NAME}` }

const FAQS: { q: string; a: string }[] = [
  {
    q: 'Who is this for?',
    a: 'Butcheries that buy meat, slaughterhouses and meat wholesalers that sell it, and licensed meat carriers that deliver it. Every account is a business.',
  },
  {
    q: 'By what time must I order?',
    a: `Before ${ORDER_CUTOFF_HOUR}:00 Nairobi time for delivery tomorrow morning, between ${DELIVERY_WINDOW}. After ${ORDER_CUTOFF_HOUR}:00 it is for the day after.`,
  },
  {
    q: 'What if my supplier does not confirm?',
    a: 'Unconfirmed orders are cancelled at 03:30 on the delivery day and you get an SMS, so you can arrange stock another way. A supplier can also decline an order, and you are told why.',
  },
  {
    q: 'How much is delivery?',
    a: `KSh ${FEE_PER_KM} per road-kilometre, minimum KSh ${MIN_DELIVERY_FEE}. It is shown with each supplier's price before you order, so you can compare the full cost.`,
  },
  {
    q: 'How do I pay?',
    a: 'You pay the carrier on delivery, in cash or by M-Pesa. Online payment is planned but not available yet.',
  },
  {
    q: 'How do I know the carrier is licensed?',
    a: 'Carriers record their meat transport permit and vehicle, and we check them before they can take any run. They must also enter the certificate of transport number at pickup.',
  },
  {
    q: 'What is the 4-digit code?',
    a: 'We SMS it to you when the carrier picks up. Give it to the carrier only after you have checked the weight and the inspection stamp. It proves you accepted the delivery.',
  },
  {
    q: 'What if the meat is short or not good?',
    a: `Report it in the app within ${ISSUE_REPORT_HOURS} hours of delivery. The supplier is notified and records how they resolved it.`,
  },
  {
    q: 'Which cuts can I order?',
    a: 'Beef, goat and mutton, offal and carcass cuts, all priced per kilogram. Search or filter by section on the order screen. Suppliers decide what they list.',
  },
  {
    q: 'Can I ask for a particular cut size or trim?',
    a: 'Yes. Add a note to your order, for example "thin cut" or "trimmed". The supplier sees it with your order.',
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
