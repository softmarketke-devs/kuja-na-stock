import Link from 'next/link'
import { signIn } from '@/app/actions/auth'
import { ActionForm, SubmitButton } from '@/components/ActionForm'
import { AuthShell } from '@/components/AuthShell'
import { inputClass, labelClass } from '@/components/ui'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams

  return (
    <AuthShell title="Sign in" subtitle="Order tonight. Stocked by 7 AM.">
      {error === 'confirm' && (
        <p role="alert" className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2">
          That confirmation link is invalid or has expired. Sign in, or sign up again to get a new link.
        </p>
      )}
      <ActionForm action={signIn} className="space-y-4">
        <input type="hidden" name="next" value={next ?? ''} />
        <div>
          <label className={labelClass} htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required className={inputClass} />
        </div>
        <SubmitButton pendingText="Signing in…">Sign in</SubmitButton>
      </ActionForm>
      <p className="text-sm text-slate-600 mt-5">
        New here?{' '}
        <Link href="/signup" className="font-bold text-orange-700 underline">
          Create an account
        </Link>
      </p>
    </AuthShell>
  )
}
