'use server'

import { perform, str } from '@/lib/actions'
import { isKenyanMobile, normalizePhone } from '@/lib/format'
import type { ActionResult } from '@/types'

export async function updateProfile(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return perform(async (supabase, userId) => {
    const phone = str(formData, 'phone')
    if (!isKenyanMobile(phone)) throw new Error('Enter a Kenyan mobile number, e.g. 0712 345 678')

    const lat = str(formData, 'lat')
    const lng = str(formData, 'lng')
    const latN = lat === '' ? null : Number(lat)
    const lngN = lng === '' ? null : Number(lng)
    if ((latN === null) !== (lngN === null)) throw new Error('Set both latitude and longitude, or neither')
    if (latN !== null && lngN !== null) {
      // Rough bounding box for Kenya; catches swapped or mistyped coordinates.
      if (latN < -5 || latN > 5.5 || lngN < 33.5 || lngN > 42) {
        throw new Error('That location is outside Kenya. Check the latitude and longitude')
      }
    }

    const radius = Number(str(formData, 'service_radius_km') || 10)
    if (!(radius >= 1 && radius <= 50)) throw new Error('Range must be between 1 and 50 km')

    const update: Record<string, unknown> = {
      full_name: str(formData, 'full_name'),
      phone: normalizePhone(phone),
      business_name: str(formData, 'business_name') || null,
      address: str(formData, 'address') || null,
      lat: latN,
      lng: lngN,
      service_radius_km: radius,
    }
    const supplierType = str(formData, 'supplier_type')
    if (supplierType === 'farm' || supplierType === 'depot') update.supplier_type = supplierType

    const { error } = await supabase.from('profiles').update(update).eq('id', userId)
    if (error) throw new Error(error.message)
    return 'Saved'
  })
}
