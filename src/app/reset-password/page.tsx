import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { pageMetadata } from '@/lib/seo'
import { createClient } from '@/lib/supabase/server'
import { updatePassword } from '@/app/actions/auth'
import { ActionForm, SubmitButton } from '@/components/ActionForm'
import { AuthShell } from '@/components/AuthShell'
import { PasswordInput } from '@/components/PasswordInput'
import { labelClass } from '@/components/ui'

export const metadata: Metadata = pageMetadata({
  title: 'Choose a new password',
  description: 'Choose a new password for your account.',
  path: '/reset-password',
  noindex: true,
})

export default async function ResetPasswordPage() {
  // Only reachable through the emailed link, which signs you in for this one step.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/forgot-password')

  return (
    <AuthShell title="Choose a new password" subtitle="Know your cut, then order it right.">
      <ActionForm action={updatePassword} className="space-y-4">
        <div>
          <label className={labelClass} htmlFor="password">New password (8+ characters)</label>
          <PasswordInput id="password" name="password" required minLength={8} autoComplete="new-password" />
        </div>
        <div>
          <label className={labelClass} htmlFor="confirm">Repeat new password</label>
          <PasswordInput id="confirm" name="confirm" required minLength={8} autoComplete="new-password" />
        </div>
        <SubmitButton pendingText="Saving…">Save password</SubmitButton>
      </ActionForm>
    </AuthShell>
  )
}
