'use client'

import { useState } from 'react'
import { clsx } from 'clsx'
import { Bike, Store, Truck } from 'lucide-react'
import { signUp } from '@/app/actions/auth'
import { ActionForm, SubmitButton } from '@/components/ActionForm'
import { inputClass, labelClass } from '@/components/ui'

const ROLES = [
  { value: 'retailer', label: 'Shop owner', hint: 'I order stock for my duka or kibanda', icon: Store },
  { value: 'supplier', label: 'Supplier', hint: 'I sell from a farm or wholesale depot', icon: Truck },
  { value: 'rider', label: 'Boda rider', hint: 'I deliver early-morning runs', icon: Bike },
] as const

export function SignUpForm() {
  const [role, setRole] = useState<(typeof ROLES)[number]['value']>('retailer')

  return (
    <ActionForm action={signUp} className="space-y-4">
      <fieldset>
        <legend className={labelClass}>I am a…</legend>
        <div className="grid grid-cols-3 gap-2">
          {ROLES.map((r) => (
            <label
              key={r.value}
              className={clsx(
                'border p-2.5 cursor-pointer text-center flex flex-col items-center gap-1',
                role === r.value ? 'border-orange-500 bg-orange-50' : 'border-slate-300 bg-white',
              )}
            >
              <input
                type="radio"
                name="role"
                value={r.value}
                checked={role === r.value}
                onChange={() => setRole(r.value)}
                className="sr-only"
              />
              <r.icon className="w-5 h-5 text-orange-700" />
              <span className="text-xs font-bold">{r.label}</span>
            </label>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-1.5">{ROLES.find((r) => r.value === role)?.hint}</p>
      </fieldset>

      <div>
        <label className={labelClass} htmlFor="full_name">Your name</label>
        <input id="full_name" name="full_name" required autoComplete="name" className={inputClass} />
      </div>
      {role !== 'rider' && (
        <div>
          <label className={labelClass} htmlFor="business_name">
            {role === 'retailer' ? 'Shop name' : 'Business / farm name'}
          </label>
          <input id="business_name" name="business_name" className={inputClass} />
        </div>
      )}
      {role === 'supplier' && (
        <div>
          <label className={labelClass} htmlFor="supplier_type">Supplier type</label>
          <select id="supplier_type" name="supplier_type" defaultValue="farm" className={inputClass}>
            <option value="farm">Farm (sells own produce)</option>
            <option value="depot">Wholesale depot</option>
          </select>
        </div>
      )}
      <div>
        <label className={labelClass} htmlFor="phone">Mobile number</label>
        <input id="phone" name="phone" type="tel" required placeholder="0712 345 678" autoComplete="tel" className={inputClass} />
        <p className="text-xs text-slate-500 mt-1">Order updates and delivery codes come by SMS.</p>
      </div>
      <div>
        <label className={labelClass} htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" className={inputClass} />
      </div>
      <div>
        <label className={labelClass} htmlFor="password">Password (8+ characters)</label>
        <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className={inputClass} />
      </div>
      <SubmitButton pendingText="Creating account…">Create account</SubmitButton>
    </ActionForm>
  )
}
