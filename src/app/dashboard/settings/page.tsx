import { requireProfile } from '@/lib/auth'
import { SettingsForm } from './SettingsForm'

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>
}) {
  const profile = await requireProfile()
  const { welcome } = await searchParams

  return (
    <div className="max-w-xl space-y-4">
      {welcome && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 text-sm">
          <p className="font-bold">Welcome to Kuja Na Stock.</p>
          <p className="mt-1">
            One last step: set your{' '}
            {profile.role === 'retailer' ? 'shop' : profile.role === 'supplier' ? 'pickup' : 'stage'} location below.
            Stand at the spot and tap “Use my current location”.
          </p>
        </div>
      )}
      <h1 className="text-xl font-black uppercase tracking-tight">Settings</h1>
      <SettingsForm profile={profile} />
    </div>
  )
}
