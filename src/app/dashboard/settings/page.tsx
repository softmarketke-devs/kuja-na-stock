import { requireProfile } from '@/lib/auth'
import { BRAND_NAME } from '@/lib/brand'
import { formatDate, nairobiDate } from '@/lib/format'
import { permitStatus } from '@/lib/permit'
import { Badge, Card, PermitBadge, SectionTitle } from '@/components/ui'
import { SettingsForm } from './SettingsForm'

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>
}) {
  const profile = await requireProfile()
  const { welcome } = await searchParams
  const permit = permitStatus(profile.meat_permit_no, profile.meat_permit_expiry, nairobiDate())

  return (
    <div className="max-w-xl space-y-4">
      {welcome && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 text-sm">
          <p className="font-bold">Welcome to {BRAND_NAME}.</p>
          <p className="mt-1">
            One last step: set your{' '}
            {profile.role === 'retailer' ? 'butchery' : profile.role === 'supplier' ? 'pickup' : 'base'} location below.
            Stand at the spot and tap “Use my current location”.
          </p>
        </div>
      )}
      <h1 className="text-xl font-black uppercase tracking-tight">Account</h1>

      {profile.role === 'rider' && (
        <section>
          <SectionTitle aside={<PermitBadge status={permit} />}>Meat transport permit</SectionTitle>
          <Card className="p-4 text-sm space-y-1">
            <Row label="Permit number" value={profile.meat_permit_no ?? 'Not recorded'} />
            <Row
              label="Expires"
              value={profile.meat_permit_expiry ? formatDate(profile.meat_permit_expiry) : 'Not recorded'}
            />
            <Row label="Vehicle" value={profile.vehicle_reg ?? 'Not recorded'} />
            <Row label="Load capacity" value={profile.load_capacity_kg ? `${profile.load_capacity_kg} kg` : 'Not recorded'} />
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Checked by {BRAND_NAME}</span>
              <Badge color={profile.is_verified ? 'green' : 'slate'}>{profile.is_verified ? 'Checked' : 'Not yet checked'}</Badge>
            </div>
            <p className="text-xs text-slate-500 pt-2">
              {permit.state === 'expired'
                ? 'You cannot take runs until you renew the permit and update it below.'
                : permit.state === 'missing'
                  ? 'Add your permit below to start taking runs.'
                  : !profile.is_verified
                    ? 'We have to check your permit and vehicle before you can take runs. You will get an SMS when that is done.'
                    : 'You will get an SMS 30 days and 7 days before the permit expires, and on the day it expires.'}
            </p>
          </Card>
        </section>
      )}

      <SettingsForm profile={profile} />
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-slate-600">{label}</span>
      <span className="font-bold text-right">{value}</span>
    </div>
  )
}
