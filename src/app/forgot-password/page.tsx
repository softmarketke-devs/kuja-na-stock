import type { Metadata } from 'next'
import Link from 'next/link'
import { pageMetadata } from '@/lib/seo'
import { requestPasswordReset } from '@/app/actions/auth'
import { ActionForm, SubmitButton } from '@/components/ActionForm'
import { AuthShell } from '@/components/AuthShell'
import { inputClass, labelClass } from '@/components/ui'

export const metadata: Metadata = pageMetadata({
  title: 'Forgot password',
  description: 'Get a link to choose a new password.',
  path: '/forgot-password',
  noindex: true,
})

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Forgot password" subtitle="Know your cut, then order it right.">
      <p className="text-sm text-slate-600 mb-4">Enter your email and we will send you a link to choose a new password.</p>
      <ActionForm action={requestPasswordReset} className="space-y-4">
        <div>
          <label className={labelClass} htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required className={inputClass} />
        </div>
        <SubmitButton pendingText="Sending…">Send reset link</SubmitButton>
      </ActionForm>
      <p className="text-sm text-slate-600 mt-5">
        Remembered it?{' '}
        <Link href="/login" className="font-bold text-orange-700 underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}
