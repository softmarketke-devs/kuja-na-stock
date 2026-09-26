'use client'

import { useState } from 'react'
import { LocateFixed } from 'lucide-react'
import { updateProfile } from '@/app/actions/profile'
import { ActionForm, SubmitButton } from '@/components/ActionForm'
import { Card, inputClass, labelClass, secondaryButton } from '@/components/ui'
import type { Profile } from '@/types'

export function SettingsForm({ profile }: { profile: Profile }) {
  const [lat, setLat] = useState(profile.lat?.toString() ?? '')
  const [lng, setLng] = useState(profile.lng?.toString() ?? '')
  const [geoError, setGeoError] = useState('')
  const [locating, setLocating] = useState(false)

  const locate = () => {
    setGeoError('')
    if (!navigator.geolocation) {
      setGeoError('This phone cannot share its location. Enter the coordinates by hand.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6))
        setLng(pos.coords.longitude.toFixed(6))
        setLocating(false)
      },
      (err) => {
        setGeoError(err.message || 'Could not get your location')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 15000 },
    )
  }

  const radiusLabel =
    profile.role === 'supplier'
      ? 'Deliver to shops within (km)'
      : profile.role === 'rider'
        ? 'Take pickups within (km of your stage)'
        : null

  return (
    <Card className="p-4">
      <ActionForm action={updateProfile} className="space-y-4">
        <div>
          <label className={labelClass} htmlFor="full_name">Your name</label>
          <input id="full_name" name="full_name" defaultValue={profile.full_name} required className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="phone">Mobile number (for SMS updates)</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={profile.phone ?? ''}
            placeholder="0712 345 678"
            required
            className={inputClass}
          />
        </div>
        {profile.role !== 'rider' && (
          <div>
            <label className={labelClass} htmlFor="business_name">
              {profile.role === 'retailer' ? 'Shop name' : 'Business / farm name'}
            </label>
            <input id="business_name" name="business_name" defaultValue={profile.business_name ?? ''} className={inputClass} />
          </div>
        )}
        {profile.role === 'supplier' && (
          <div>
            <label className={labelClass} htmlFor="supplier_type">Supplier type</label>
            <select id="supplier_type" name="supplier_type" defaultValue={profile.supplier_type ?? 'depot'} className={inputClass}>
              <option value="farm">Farm (sells own produce)</option>
              <option value="depot">Wholesale depot</option>
            </select>
          </div>
        )}
        <div>
          <label className={labelClass} htmlFor="address">
            {profile.role === 'rider' ? 'Stage name / area' : 'Directions for the rider'}
          </label>
          <input
            id="address"
            name="address"
            defaultValue={profile.address ?? ''}
            placeholder={profile.role === 'rider' ? 'e.g. Ruaka stage' : 'e.g. Kipande Rd, next to Total petrol station'}
            className={inputClass}
          />
        </div>

        <fieldset className="border border-slate-200 p-3 space-y-3">
          <legend className={labelClass + ' px-1'}>
            {profile.role === 'retailer' ? 'Shop location' : profile.role === 'supplier' ? 'Pickup location' : 'Stage location'}
          </legend>
          <button type="button" onClick={locate} disabled={locating} className={secondaryButton + ' w-full'}>
            <LocateFixed className="w-4 h-4" />
            {locating ? 'Getting location…' : 'Use my current location'}
          </button>
          {geoError && <p className="text-sm text-red-700">{geoError}</p>}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass} htmlFor="lat">Latitude</label>
              <input id="lat" name="lat" inputMode="decimal" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="-1.2650" className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="lng">Longitude</label>
              <input id="lng" name="lng" inputMode="decimal" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="36.8070" className={inputClass} />
            </div>
          </div>
          {lat && lng && (
            <a
              href={`https://www.google.com/maps?q=${lat},${lng}`}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-orange-700 underline"
            >
              Check this spot on Google Maps
            </a>
          )}
        </fieldset>

        {radiusLabel ? (
          <div>
            <label className={labelClass} htmlFor="service_radius_km">{radiusLabel}</label>
            <input
              id="service_radius_km"
              name="service_radius_km"
              type="number"
              min={1}
              max={50}
              step={0.5}
              defaultValue={profile.service_radius_km}
              className={inputClass}
            />
          </div>
        ) : (
          <input type="hidden" name="service_radius_km" value={profile.service_radius_km} />
        )}

        <SubmitButton pendingText="Saving…">Save</SubmitButton>
      </ActionForm>
    </Card>
  )
}
