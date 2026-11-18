import type { Metadata } from 'next'
import Link from 'next/link'
import { pageMetadata } from '@/lib/seo'
import { AuthShell } from '@/components/AuthShell'
import { GoogleButton } from '@/components/GoogleButton'
import { SignUpForm } from './SignUpForm'

export const metadata: Metadata = pageMetadata({
  title: 'Create account',
  description: 'Create a customer account to order premium cuts and track your delivery.',
  path: '/signup',
  noindex: true,
})

export default function SignUpPage() {
  return (
    <AuthShell title="Create account" subtitle="Know your cut, then order it right.">
      <SignUpForm />
      <GoogleButton />
      <p className="text-sm text-slate-600 mt-5">
        Already registered?{' '}
        <Link href="/login" className="font-bold text-orange-700 underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}
