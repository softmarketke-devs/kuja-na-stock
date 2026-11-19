import type { Metadata } from 'next'
import { ContactButtons } from '@/components/ContactButtons'
import { LegalPage } from '@/components/LegalPage'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata({
  title: 'Delivery and payment',
  description: 'How ordering, delivery and payment work for BIG Premium Cuts customers.',
  path: '/delivery-and-payment',
})

export default function DeliveryAndPaymentPage() {
  return (
    <LegalPage title="Delivery and payment" draft={false}>
      <section>
        <h2>How an order works</h2>
        <ul>
          <li>Add cuts to your cart and place the order with your delivery address.</li>
          <li>If every cut has a price, your total (cuts plus the standard delivery fee) is ready straight away under My orders. If a cut has no price yet, we confirm it and tell you by SMS.</li>
          <li>You pay with the method you chose, or on delivery.</li>
          <li>We deliver, sealed, and mark the order delivered.</li>
        </ul>
      </section>
      <section>
        <h2>Delivery</h2>
        <p>
          One standard delivery fee applies to each order, shown in your cart before you order. We tell you the delivery
          time when we confirm your order.
        </p>
      </section>
      <section>
        <h2>Payment</h2>
        <ul>
          <li>M-Pesa: you get a payment prompt on your phone once the price is ready.</li>
          <li>Pay on delivery: pay in cash or by M-Pesa when the meat arrives.</li>
          <li>You are never charged before the price is shown to you.</li>
        </ul>
      </section>
      <section>
        <h2>Problems</h2>
        <p>If something is short or not right, message us on WhatsApp with your order number and a photo.</p>
      </section>
      <ContactButtons />
    </LegalPage>
  )
}
