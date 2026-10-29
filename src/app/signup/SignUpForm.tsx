'use client'

import Link from 'next/link'
import { useState } from 'react'
import { clsx } from 'clsx'
import { Store, Truck, Warehouse } from 'lucide-react'
import { signUp } from '@/app/actions/auth'
import { ActionForm, SubmitButton } from '@/components/ActionForm'
import { inputClass, labelClass } from '@/components/ui'

const ROLES = [
  { value: 'retailer', label: 'Butchery', hint: 'I order meat for my butchery', icon: Store },
  { value: 'supplier', label: 'Supplier', hint: 'I sell from a slaughterhouse or as a meat wholesaler', icon: Warehouse },
  {
    value: 'rider',
    label: 'Meat carrier',
    hint: 'I hold a meat transport permit and deliver early-morning runs',
    icon: Truck,
  },
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
            {role === 'retailer' ? 'Butchery name' : 'Business name'}
          </label>
          <input id="business_name" name="business_name" className={inputClass} />
        </div>
      )}
      {role === 'supplier' && (
        <div>
          <label className={labelClass} htmlFor="supplier_type">Supplier type</label>
          <select id="supplier_type" name="supplier_type" defaultValue="wholesaler" className={inputClass}>
            <option value="slaughterhouse">Slaughterhouse</option>
            <option value="wholesaler">Meat wholesaler</option>
          </select>
        </div>
      )}
      {role === 'rider' && (
        <fieldset className="border border-slate-200 p-3 space-y-3">
          <legend className={labelClass + ' px-1'}>Meat transport permit and vehicle</legend>
          <p className="text-xs text-slate-500">
            Needed to carry meat. Enter them once; your account page shows the permit status and reminds you before it
            expires.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="meat_permit_no">Permit number</label>
              <input id="meat_permit_no" name="meat_permit_no" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="meat_permit_expiry">Permit expiry date</label>
              <input id="meat_permit_expiry" name="meat_permit_expiry" type="date" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="vehicle_reg">Vehicle registration</label>
              <input id="vehicle_reg" name="vehicle_reg" required placeholder="e.g. KMFA 123B" className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="load_capacity_kg">Load capacity (kg)</label>
              <input
                id="load_capacity_kg"
                name="load_capacity_kg"
                type="number"
                min={1}
                max={5000}
                step={1}
                required
                className={inputClass}
              />
            </div>
          </div>
        </fieldset>
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
      <p className="text-xs text-slate-500">
        By creating an account you agree to the{' '}
        <Link href="/terms" className="underline" target="_blank">Terms</Link> and the{' '}
        <Link href="/privacy" className="underline" target="_blank">Privacy Policy</Link>.
      </p>
      <SubmitButton pendingText="Creating account…">Create account</SubmitButton>
    </ActionForm>
  )
}
