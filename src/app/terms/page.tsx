import type { Metadata } from 'next'
import { LegalPage } from '@/components/LegalPage'
import { BRAND_NAME, SUPPORT_EMAIL } from '@/lib/brand'
import { DELIVERY_WINDOW, FEE_PER_KM, ISSUE_REPORT_HOURS, MIN_DELIVERY_FEE, ORDER_CUTOFF_HOUR } from '@/lib/constants'

export const metadata: Metadata = { title: `Terms of use | ${BRAND_NAME}` }

export default function TermsPage() {
  return (
    <LegalPage title="Terms of use">
      <section>
        <h2>1. What {BRAND_NAME} is</h2>
        <p>
          {BRAND_NAME} is software that connects butcheries, slaughterhouses and meat wholesalers, and licensed meat
          carriers in Nairobi. We provide the ordering, scheduling and record-keeping. The sale of meat is between the
          butchery and the supplier, and the carriage is between the carrier and the parties on the run. We are not a
          party to those contracts and we do not handle, store or inspect meat.
        </p>
      </section>
      <section>
        <h2>2. Accounts</h2>
        <p>
          Accounts are for businesses. You must give accurate details, keep your password private, and tell us if you
          think someone else has used your account. You are responsible for what is done through it.
        </p>
      </section>
      <section>
        <h2>3. How orders work</h2>
        <ul>
          <li>Orders placed before {ORDER_CUTOFF_HOUR}:00 Nairobi time are for delivery the next morning; later orders are for the day after.</li>
          <li>Delivery is between {DELIVERY_WINDOW}. The window is a target, not a guarantee.</li>
          <li>A supplier may confirm or decline an order. Orders not confirmed by 03:30 on the delivery day are cancelled.</li>
          <li>
            The delivery fee is KSh {FEE_PER_KM} per road-km, minimum KSh {MIN_DELIVERY_FEE}, and is paid to the carrier.
            Prices and fees are shown before you order.
          </li>
          <li>The butchery gives the carrier its 4-digit code only once the delivery has been checked and accepted.</li>
          <li>Problems with a delivery must be reported in the app within {ISSUE_REPORT_HOURS} hours.</li>
        </ul>
      </section>
      <section>
        <h2>4. Payment</h2>
        <p>
          For now, payment is made directly to the carrier in cash or by M-Pesa, and the carrier records it in the app.
          {' '}{BRAND_NAME} does not hold your money.
        </p>
      </section>
      <section>
        <h2>5. Meat carriers and permits</h2>
        <p>
          Carriers must hold a valid meat transport permit and use a suitable vehicle, and must carry the certificate of
          transport for each consignment as the law requires. Carriers record their permit and vehicle details; we may
          check them and mark them as checked, but a check by us does not replace the carrier&apos;s own legal
          responsibility, and does not mean the meat or the vehicle has been inspected by us. We may stop a carrier
          from taking runs if the permit is expired, missing, or in doubt.
        </p>
      </section>
      <section>
        <h2>6. Suppliers and food safety</h2>
        <p>
          Suppliers are responsible for the quality, weight, labelling, licensing and inspection of the meat they sell,
          and for keeping it safe until the carrier collects it.
        </p>
      </section>
      <section>
        <h2>7. Acceptable use</h2>
        <p>
          Do not give false information, interfere with the service, use it to sell meat that is unfit or unlicensed, or
          use another person&apos;s account. We may suspend or close accounts that break these terms or put people at
          risk.
        </p>
      </section>
      <section>
        <h2>8. Our responsibility</h2>
        <p>
          We work to keep the service running, but it is provided as is. To the extent the law allows, we are not
          liable for late or failed deliveries, spoiled or short meat, or losses caused by SMS or network outages or
          by the acts of other users. Nothing here limits liability that cannot be limited by law.
        </p>
      </section>
      <section>
        <h2>9. Changes and contact</h2>
        <p>
          We may update these terms and will say so in the app. Continuing to use the service means you accept the
          update. Governing law: the laws of Kenya. Questions:{' '}
          <a className="underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        </p>
      </section>
    </LegalPage>
  )
}
