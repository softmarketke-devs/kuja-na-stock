import type { Metadata } from 'next'
import { LegalPage } from '@/components/LegalPage'
import { pageMetadata } from '@/lib/seo'
import { BRAND_NAME, SUPPORT_EMAIL } from '@/lib/brand'

export const metadata: Metadata = pageMetadata({
  title: 'Privacy policy',
  description: `How ${BRAND_NAME} collects, uses and protects your personal data in Kenya.`,
  path: '/privacy',
})

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
          <li>Account details: name, email, mobile number and password (stored hashed by our sign-in provider). If you use Google sign-in, we receive your name and email from Google.</li>
          <li>Orders: the cuts you order, delivery address, notes, prices and order status.</li>
          <li>Payments: the method you chose and the M-Pesa transaction code. We never see your M-Pesa PIN or card details.</li>
          <li>Messages: the SMS we send you and whether it was delivered.</li>
        </ul>
      </section>
      <section>
        <h2>3. Why we use it</h2>
        <p>
          To run the service you asked for: take and deliver your orders, confirm prices, take payment, send SMS about
          your orders, resolve problems, keep records and keep the service safe. We do not sell your data or use it for
          advertising.
        </p>
      </section>
      <section>
        <h2>4. Who sees it</h2>
        <ul>
          <li>Our staff who prepare and deliver orders see your name, phone, address and order.</li>
          <li>Service providers that process data for us: Supabase (database and sign-in), Vercel (hosting), Africa&apos;s Talking (SMS), Safaricom (M-Pesa) and Google (if you use Google sign-in). Some process data outside Kenya.</li>
          <li>Authorities, where the law requires.</li>
        </ul>
      </section>
      <section>
        <h2>5. How long we keep it</h2>
        <p>
          While your account is active, and afterwards as long as needed for order, payment and legal records. Ask us to
          delete your account and we will, except for records we must keep.
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
          Access to data is restricted by role in the database, connections are encrypted, and sessions end
          automatically after a period of inactivity. No system is perfectly secure; tell us at once if you think your
          account has been misused.
        </p>
      </section>
    </LegalPage>
  )
}
