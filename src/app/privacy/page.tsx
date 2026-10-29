import type { Metadata } from 'next'
import { LegalPage } from '@/components/LegalPage'
import { BRAND_NAME, SUPPORT_EMAIL } from '@/lib/brand'

export const metadata: Metadata = { title: `Privacy policy | ${BRAND_NAME}` }

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy">
      <section>
        <h2>1. Who we are</h2>
        <p>
          {BRAND_NAME} is the data controller for the information described here. Contact:{' '}
          <a className="underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. We handle personal data under
          Kenya&apos;s Data Protection Act, 2019.
        </p>
      </section>
      <section>
        <h2>2. What we collect</h2>
        <ul>
          <li>Account details: name, business name, email, mobile number, role and password (stored hashed by our authentication provider).</li>
          <li>Location: the address and coordinates you set for your butchery, pickup point or base. We use them to work out distances, delivery fees and which carriers to offer a run.</li>
          <li>Carriers: meat transport permit number and expiry, vehicle registration, load capacity, and whether we have checked them.</li>
          <li>Activity: orders, listings, stock counts, delivery runs, certificate of transport numbers, delivery codes, payment records (method and M-Pesa code, not card or PIN details) and problem reports.</li>
          <li>Messages: the SMS we send you and whether it was delivered.</li>
        </ul>
      </section>
      <section>
        <h2>3. Why we use it</h2>
        <p>
          To run the service you asked for: take and fulfil orders, match carriers, send SMS about your orders, remind
          carriers before a permit expires, resolve problems, keep records, and keep the service safe. We do not sell
          your data or use it for advertising.
        </p>
      </section>
      <section>
        <h2>4. Who sees it</h2>
        <ul>
          <li>Other users on the same order or run see what they need to complete it: your business name, phone, address and location, and for carriers the permit and vehicle details. Suppliers&apos; business details are visible to signed-in users so butcheries can compare them.</li>
          <li>Your delivery code is visible only to you, the butchery, and is entered by the carrier.</li>
          <li>Service providers that process data for us: Supabase (database and sign-in), Vercel (hosting) and Africa&apos;s Talking (SMS). Some of them process data outside Kenya.</li>
          <li>Authorities, where the law requires.</li>
        </ul>
      </section>
      <section>
        <h2>5. How long we keep it</h2>
        <p>
          While your account is active, and afterwards as long as needed for order, payment and compliance records.
          Ask us to delete your account and we will, except for records we must keep.
        </p>
      </section>
      <section>
        <h2>6. Your rights</h2>
        <p>
          You can ask to see, correct or delete your data, object to how we use it, or withdraw consent, by emailing us.
          You can also complain to the Office of the Data Protection Commissioner.
        </p>
      </section>
      <section>
        <h2>7. Security</h2>
        <p>
          Access to data is restricted by role in the database, connections are encrypted, and the delivery code is
          stored separately from order data. No system is perfectly secure; tell us at once if you think your account
          has been misused.
        </p>
      </section>
    </LegalPage>
  )
}
