'use client'

import dynamic from 'next/dynamic'

// Leaflet touches `window`, so the map is client-only.
export const TrackingMapLoader = dynamic(() => import('@/components/TrackingMap').then((m) => m.TrackingMap), {
  ssr: false,
  loading: () => <div className="h-[60vh] min-h-80 border border-slate-300 bg-slate-100 animate-pulse" />,
})
