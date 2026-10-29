import { requireProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { formatDate, nairobiDate } from '@/lib/format'
import { permitStatus } from '@/lib/permit'
import { setCarrierVerified } from '@/app/actions/admin'
import { ActionForm, SubmitButton } from '@/components/ActionForm'
import { Badge, Card, Empty, PermitBadge, PhoneLink, SectionTitle, dangerButton, primaryButton } from '@/components/ui'
import type { Profile } from '@/types'

type Carrier = Pick<
  Profile,
  'id' | 'full_name' | 'phone' | 'meat_permit_no' | 'meat_permit_expiry' | 'vehicle_reg' | 'load_capacity_kg' | 'is_verified' | 'created_at'
>

export default async function AdminPage() {
  await requireProfile('admin')
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, phone, meat_permit_no, meat_permit_expiry, vehicle_reg, load_capacity_kg, is_verified, created_at')
    .eq('role', 'rider')
    .order('created_at', { ascending: false })

  const today = nairobiDate()
  const carriers = (data ?? []) as Carrier[]
  const pending = carriers.filter((c) => !c.is_verified)
  const checked = carriers.filter((c) => c.is_verified)

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-black uppercase tracking-tight">Carrier permits</h1>
      <p className="text-sm text-slate-600 max-w-2xl">
        A carrier can only be offered or accept runs once you mark them as checked. Compare the permit number, expiry and
        vehicle below with the permit document before you do. Changing any of them on their account clears the check.
      </p>

      <section>
        <SectionTitle aside={<Badge color={pending.length ? 'orange' : 'slate'}>{pending.length}</Badge>}>
          Waiting to be checked
        </SectionTitle>
        {pending.length === 0 ? (
          <Empty>No carriers are waiting.</Empty>
        ) : (
          <div className="space-y-3">
            {pending.map((c) => (
              <CarrierCard key={c.id} carrier={c} today={today} />
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionTitle aside={<Badge color="green">{checked.length}</Badge>}>Checked</SectionTitle>
        {checked.length === 0 ? (
          <Empty>No carriers have been checked yet.</Empty>
        ) : (
          <div className="space-y-3">
            {checked.map((c) => (
              <CarrierCard key={c.id} carrier={c} today={today} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function CarrierCard({ carrier: c, today }: { carrier: Carrier; today: string }) {
  const permit = permitStatus(c.meat_permit_no, c.meat_permit_expiry, today)
  const canCheck = permit.state !== 'missing' && !!c.vehicle_reg
  return (
    <Card className="p-4 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="font-bold">{c.full_name || 'Unnamed carrier'}</div>
          <PhoneLink phone={c.phone} />
        </div>
        <PermitBadge status={permit} />
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3 sm:grid-cols-4">
        <Field label="Permit no." value={c.meat_permit_no} />
        <Field label="Expires" value={c.meat_permit_expiry ? formatDate(c.meat_permit_expiry) : null} />
        <Field label="Vehicle" value={c.vehicle_reg} />
        <Field label="Capacity" value={c.load_capacity_kg ? `${c.load_capacity_kg} kg` : null} />
      </dl>
      <ActionForm action={setCarrierVerified} className="mt-3">
        <input type="hidden" name="carrier_id" value={c.id} />
        <input type="hidden" name="verified" value={c.is_verified ? 'false' : 'true'} />
        {c.is_verified ? (
          <SubmitButton className={dangerButton}>Remove check</SubmitButton>
        ) : (
          <SubmitButton className={primaryButton}>{canCheck ? 'Mark as checked' : 'Details missing'}</SubmitButton>
        )}
      </ActionForm>
    </Card>
  )
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="font-mono">{value || <span className="text-slate-400">not recorded</span>}</dd>
    </div>
  )
}
