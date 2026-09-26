import { redirect } from 'next/navigation'
import { requireProfile } from '@/lib/auth'
import { DASHBOARD_HOME } from '@/lib/constants'

export default async function DashboardIndex() {
  const profile = await requireProfile()
  redirect(DASHBOARD_HOME[profile.role] ?? '/dashboard/settings')
}
