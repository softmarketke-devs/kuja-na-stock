import type { Metadata } from 'next'
import Link from 'next/link'
import { pageMetadata } from '@/lib/seo'
import { signIn, signOut } from '@/app/actions/auth'
import { ActionForm, SubmitButton } from '@/components/ActionForm'
import { AuthShell } from '@/components/AuthShell'
import { GoogleButton } from '@/components/GoogleButton'
import { PasswordInput } from '@/components/PasswordInput'
import { inputClass, labelClass } from '@/components/ui'

export const metadata: Metadata = pageMetadata({
  title: 'Sign in',
  description: 'Sign in to order, supply or deliver meat.',
  path: '/login',
  noindex: true,
})

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams

  return (
    <AuthShell title="Sign in" subtitle="Know your cut, then order it right.">
      {error === 'timeout' && (
        <p role="alert" className="mb-4 text-sm text-slate-700 bg-orange-50 border border-orange-200 px-3 py-2">
          You were signed out because you were away for a while. Sign in again to continue.
        </p>
      )}
      {error === 'confirm' && (
        <p role="alert" className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2">
          That confirmation link is invalid or has expired. Sign in, or sign up again to get a new link.
        </p>
      )}
      {error === 'profile' && (
        <div role="alert" className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 space-y-2">
          <p>You are signed in, but your account setup is incomplete, so we cannot open your dashboard. Please contact support.</p>
          <form action={signOut}>
            <button type="submit" className="font-bold underline">
              Sign out
            </button>
          </form>
        </div>
      )}
      <ActionForm action={signIn} className="space-y-4">
        <input type="hidden" name="next" value={next ?? ''} />
        <div>
          <label className={labelClass} htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="password">Password</label>
          <PasswordInput id="password" name="password" autoComplete="current-password" required />
          <Link href="/forgot-password" className="inline-block mt-1.5 text-sm font-bold text-orange-700 underline">
            Forgot password?
          </Link>
        </div>
        <SubmitButton pendingText="Signing in…">Sign in</SubmitButton>
      </ActionForm>
      <GoogleButton />
      <p className="text-sm text-slate-600 mt-5">
        New here?{' '}
        <Link href="/signup" className="font-bold text-orange-700 underline">
          Create an account
        </Link>
      </p>
    </AuthShell>
  )
}
