import { requireProfile } from '@/lib/auth'
import { BRAND_NAME } from '@/lib/brand'
import { SettingsForm } from './SettingsForm'

export default async function AccountPage({
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
          <p className="font-bold">Welcome to {BRAND_NAME}.</p>
          <p className="mt-1">Check your details below. You can order from the home page whenever you are ready.</p>
        </div>
      )}
      <h1 className="font-display text-2xl font-bold">Account</h1>
      <SettingsForm profile={profile} />
    </div>
  )
}
