import type { Metadata } from 'next'
import { LegalPage } from '@/components/LegalPage'
import { pageMetadata } from '@/lib/seo'
import { BRAND_NAME, SUPPORT_EMAIL } from '@/lib/brand'

export const metadata: Metadata = pageMetadata({
  title: 'Terms of use',
  description: `The rules for ordering meat from ${BRAND_NAME}.`,
  path: '/terms',
})

export default function TermsPage() {
  return (
    <LegalPage title="Terms of use">
      <section>
        <h2>1. What {BRAND_NAME} is</h2>
        <p>
          {BRAND_NAME} sells meat to customers in Nairobi. This website and app let you choose cuts, place an order,
          pay and follow your delivery. These terms apply when you use them.
        </p>
      </section>
      <section>
        <h2>2. Your account</h2>
        <p>
          Give true details, keep your password private and tell us if someone else has used your account. You are
          responsible for what happens under your account. We may sign you out automatically after a period of
          inactivity to keep it safe.
        </p>
      </section>
      <section>
        <h2>3. Orders and prices</h2>
        <ul>
          <li>Prices are per kilogram. Because weights vary, we confirm the price of your order and the delivery fee before you pay.</li>
          <li>An order is accepted when we confirm its price. We may decline or cancel an order, for example when a cut is out of stock, and we will tell you.</li>
          <li>You can cancel an order yourself until it is paid. After that, contact us.</li>
        </ul>
      </section>
      <section>
        <h2>4. Payment</h2>
        <p>
          You can pay by M-Pesa or on delivery, as shown at checkout. We do not see or store your M-Pesa PIN. You are
          only charged after we have confirmed the price.
        </p>
      </section>
      <section>
        <h2>5. Delivery and food safety</h2>
        <p>
          We deliver to the address you give us. Please be available to receive the meat and store it cold as soon as
          it arrives. Check the order when it arrives and tell us straight away if anything is wrong.
        </p>
      </section>
      <section>
        <h2>6. Acceptable use</h2>
        <p>
          Do not give false information, interfere with the service or use another person&apos;s account. We may suspend
          or close accounts that break these terms.
        </p>
      </section>
      <section>
        <h2>7. Our responsibility</h2>
        <p>
          We work to keep the service running, but it is provided as is. To the extent the law allows, we are not liable
          for losses caused by network or SMS outages. Nothing here limits liability that cannot be limited by law, or
          your rights as a consumer.
        </p>
      </section>
      <section>
        <h2>8. Changes and contact</h2>
        <p>
          We may update these terms and will say so on the site. Governing law: the laws of Kenya. Questions:{' '}
          <a className="underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        </p>
      </section>
    </LegalPage>
  )
}
