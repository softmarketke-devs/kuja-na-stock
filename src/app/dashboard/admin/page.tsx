import { redirect } from 'next/navigation'
import { requireProfile } from '@/lib/auth'

export default async function AdminIndex() {
  await requireProfile('admin')
  redirect('/dashboard/admin/customer-orders')
}
