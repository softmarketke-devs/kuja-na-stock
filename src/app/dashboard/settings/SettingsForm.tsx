'use client'

import { updateProfile } from '@/app/actions/profile'
import { ActionForm, SubmitButton } from '@/components/ActionForm'
import { Card, inputClass, labelClass } from '@/components/ui'
import type { Profile } from '@/types'

export function SettingsForm({ profile }: { profile: Profile }) {
  return (
    <Card className="p-4">
      <ActionForm action={updateProfile} className="space-y-4">
        <div>
          <label className={labelClass} htmlFor="full_name">Your name</label>
          <input id="full_name" name="full_name" defaultValue={profile.full_name} required className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="phone">Mobile number (for SMS updates and M-Pesa)</label>
          <input id="phone" name="phone" type="tel" defaultValue={profile.phone ?? ''} placeholder="0712 345 678" required className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="address">Usual delivery address</label>
          <input id="address" name="address" defaultValue={profile.address ?? ''} placeholder="e.g. Kilimani, Argwings Kodhek Rd, Gate 3" className={inputClass} />
        </div>
        <SubmitButton pendingText="Saving…">Save</SubmitButton>
      </ActionForm>
    </Card>
  )
}
