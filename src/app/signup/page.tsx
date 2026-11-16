import type { Metadata } from 'next'
import Link from 'next/link'
import { pageMetadata } from '@/lib/seo'
import { AuthShell } from '@/components/AuthShell'
import { SignUpForm } from './SignUpForm'

export const metadata: Metadata = pageMetadata({
  title: 'Create account',
  description: 'Create an account to order meat, or register as a butchery, supplier or meat carrier.',
  path: '/signup',
  noindex: true,
})

export default function SignUpPage() {
  return (
    <AuthShell title="Create account" subtitle="Know your cut, then order it right.">
      <SignUpForm />
      <p className="text-sm text-slate-600 mt-5">
        Already registered?{' '}
        <Link href="/login" className="font-bold text-orange-700 underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}
