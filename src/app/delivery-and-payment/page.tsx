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
          <li>We confirm the price of your cuts and the delivery fee. You get an SMS and see it under My orders.</li>
          <li>You pay with the method you chose, or on delivery.</li>
          <li>We deliver, sealed, and mark the order delivered.</li>
        </ul>
      </section>
      <section>
        <h2>Delivery</h2>
        <p>
          The delivery fee depends on your address and is confirmed with the price, before you pay. We tell you the
          delivery time when we confirm.
        </p>
      </section>
      <section>
        <h2>Payment</h2>
        <ul>
          <li>M-Pesa: you get a payment prompt on your phone once the price is confirmed.</li>
          <li>Pay on delivery: pay in cash or by M-Pesa when the meat arrives.</li>
          <li>You are never charged before we have confirmed the price.</li>
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
