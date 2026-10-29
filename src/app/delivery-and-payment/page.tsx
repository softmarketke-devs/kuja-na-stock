import type { Metadata } from 'next'
import { ContactButtons } from '@/components/ContactButtons'
import { LegalPage } from '@/components/LegalPage'
import { BRAND_NAME } from '@/lib/brand'
import { DELIVERY_WINDOW, FEE_PER_KM, ISSUE_REPORT_HOURS, MAX_DROPS_PER_RUN, MIN_DELIVERY_FEE, ORDER_CUTOFF_HOUR } from '@/lib/constants'

export const metadata: Metadata = {
  title: `Delivery and payment | ${BRAND_NAME}`,
  description: `How ordering, delivery and payment work: order by ${ORDER_CUTOFF_HOUR}:00, delivered ${DELIVERY_WINDOW}.`,
}

export default function DeliveryAndPaymentPage() {
  return (
    <LegalPage title="Delivery and payment" draft={false}>
      <section>
        <h2>When to order</h2>
        <p>
          Order before {ORDER_CUTOFF_HOUR}:00 Nairobi time and your meat arrives the next morning between {DELIVERY_WINDOW}.
          Orders after {ORDER_CUTOFF_HOUR}:00 are for the day after. The supplier confirms your order overnight. If they
          have not confirmed by 03:30 on the delivery day, it is cancelled and you are told by SMS.
        </p>
      </section>
      <section>
        <h2>What delivery costs</h2>
        <p>
          KSh {FEE_PER_KM} per road-kilometre from the supplier to your butchery, with a minimum of KSh {MIN_DELIVERY_FEE}.
          The fee is shown before you order and goes to the carrier. Ordering several items from one supplier means one
          delivery fee. Up to {MAX_DROPS_PER_RUN} butcheries share one carrier run.
        </p>
      </section>
      <section>
        <h2>Who delivers</h2>
        <p>
          Carriers hold a meat transport permit. We check the permit and vehicle before a carrier can take runs, and
          carriers must enter the certificate of transport number when they collect the meat.
        </p>
      </section>
      <section>
        <h2>Paying</h2>
        <p>
          You pay the carrier when the meat arrives, in cash or by M-Pesa. The total is the price of the meat plus the
          delivery fee, shown in the app before you order.
        </p>
      </section>
      <section>
        <h2>Checking and accepting</h2>
        <ul>
          <li>You get an SMS when the carrier is on the way, with your 4-digit code.</li>
          <li>Check the weight and the inspection stamp before you pay.</li>
          <li>Give the carrier the code once you accept the delivery. A delivery only counts when the code is entered.</li>
          <li>After 5 wrong code attempts the order locks and the supplier is asked to confirm it.</li>
          <li>Short weight or poor quality: report it in the app within {ISSUE_REPORT_HOURS} hours of delivery.</li>
        </ul>
      </section>
      <ContactButtons />
    </LegalPage>
  )
}
