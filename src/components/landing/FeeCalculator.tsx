'use client'

import { useState } from 'react'
import { FEE_PER_KM, MIN_DELIVERY_FEE } from '@/lib/constants'

/** Same rule as delivery_fee_for() in the database: KSh 50/km rounded to the nearest 10, minimum KSh 100. */
const feeFor = (km: number) => Math.max(MIN_DELIVERY_FEE, Math.round((km * FEE_PER_KM) / 10) * 10)

export function FeeCalculator() {
  const [km, setKm] = useState(8)
  const fee = feeFor(km)

  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-[var(--shadow-soft)] p-6">
      <h3 className="font-display font-extrabold text-xl">What will delivery cost?</h3>
      <p className="text-sm text-slate-600 mt-1">
        KSh {FEE_PER_KM} per km, minimum KSh {MIN_DELIVERY_FEE}, paid to the carrier. Slide to your supplier’s distance.
      </p>
      <label htmlFor="fee-km" className="block text-sm font-bold mt-4">
        Distance: <span className="tabular-nums">{km} km</span>
      </label>
      <input
        id="fee-km"
        type="range"
        min={1}
        max={30}
        step={1}
        value={km}
        onChange={(e) => setKm(Number(e.target.value))}
        className="w-full h-11 accent-orange-600"
      />
      <div className="flex items-end justify-between mt-2">
        <span className="text-xs text-slate-500">1 km</span>
        <span className="text-xs text-slate-500">30 km</span>
      </div>
      <div className="mt-3 bg-orange-50 border border-orange-200 px-4 py-3" aria-live="polite">
        <div className="text-xs font-bold uppercase text-orange-800">Delivery fee</div>
        <div className="font-display text-4xl font-extrabold tabular-nums">KSh {fee.toLocaleString('en-KE')}</div>
        {fee === MIN_DELIVERY_FEE && <div className="text-xs text-slate-600">Minimum fee applies</div>}
      </div>
    </div>
  )
}
