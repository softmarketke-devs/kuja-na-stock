'use client'

import Link from 'next/link'
import { signUp } from '@/app/actions/auth'
import { ActionForm, SubmitButton } from '@/components/ActionForm'
import { PasswordInput } from '@/components/PasswordInput'
import { inputClass, labelClass } from '@/components/ui'

export function SignUpForm() {
  return (
    <ActionForm action={signUp} className="space-y-4">
      <div>
        <label className={labelClass} htmlFor="full_name">Your name</label>
        <input id="full_name" name="full_name" required autoComplete="name" className={inputClass} />
      </div>
      <div>
        <label className={labelClass} htmlFor="phone">Mobile number</label>
        <input id="phone" name="phone" type="tel" required placeholder="0712 345 678" autoComplete="tel" className={inputClass} />
        <p className="text-xs text-slate-500 mt-1">Order updates come by SMS.</p>
      </div>
      <div>
        <label className={labelClass} htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" className={inputClass} />
      </div>
      <div>
        <label className={labelClass} htmlFor="password">Password (8+ characters)</label>
        <PasswordInput id="password" name="password" required minLength={8} autoComplete="new-password" />
      </div>
      <p className="text-xs text-slate-500">
        By creating an account you agree to the{' '}
        <Link href="/terms" className="underline" target="_blank">Terms</Link> and the{' '}
        <Link href="/privacy" className="underline" target="_blank">Privacy Policy</Link>.
      </p>
      <SubmitButton pendingText="Creating account…">Create account</SubmitButton>
    </ActionForm>
  )
}
