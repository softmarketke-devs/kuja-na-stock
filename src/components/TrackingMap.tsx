'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { createClient } from '@/lib/supabase/client'

type Point = { lat: number; lng: number }
export type CarrierPosition = Point & { updated_at: string; speed_kmh?: number | null }

const STALE_AFTER_MS = 2 * 60 * 1000

/** Square, flat markers to match the app's look (no rounded corners). */
function squareIcon(label: string, color: string, pulse = false) {
  return L.divIcon({
    className: '',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    html: `<div style="width:34px;height:34px;background:${color};color:#fff;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;font:900 14px/1 system-ui;${
      pulse ? 'outline:3px solid ' + color + '55;' : ''
    }">${label}</div>`,
  })
}

/**
 * OpenStreetMap view of a delivery run: supplier pickup (P), your butchery (B)
 * and the carrier's live position (truck). Updates through Supabase Realtime.
 *
 * Note: tile.openstreetmap.org is for light use only (see its tile usage policy).
 * Set NEXT_PUBLIC_MAP_TILE_URL to a commercial provider before heavy production use.
 */
export function TrackingMap({
  runId,
  pickup,
  dropoff,
  initial,
}: {
  runId: string
  pickup: Point | null
  dropoff: Point
  initial: CarrierPosition | null
}) {
  const el = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const carrier = useRef<L.Marker | null>(null)
  const [pos, setPos] = useState<CarrierPosition | null>(initial)
  const [now, setNow] = useState(() => Date.now())

  // Build the map once.
  useEffect(() => {
    if (!el.current || map.current) return
    const m = L.map(el.current, { zoomControl: false, attributionControl: true }).setView([dropoff.lat, dropoff.lng], 14)
    L.control.zoom({ position: 'bottomright' }).addTo(m)
    L.tileLayer(process.env.NEXT_PUBLIC_MAP_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(m)

    L.marker([dropoff.lat, dropoff.lng], { icon: squareIcon('B', '#ea580c'), title: 'Your butchery' }).addTo(m)
    const bounds = L.latLngBounds([[dropoff.lat, dropoff.lng]])
    if (pickup) {
      L.marker([pickup.lat, pickup.lng], { icon: squareIcon('P', '#0f172a'), title: 'Supplier pickup' }).addTo(m)
      L.polyline([[pickup.lat, pickup.lng], [dropoff.lat, dropoff.lng]], {
        color: '#ea580c', weight: 4, opacity: 0.6, dashArray: '2 8',
      }).addTo(m)
      bounds.extend([pickup.lat, pickup.lng])
    }
    if (initial) bounds.extend([initial.lat, initial.lng])
    m.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 })
    map.current = m
    return () => {
      m.remove()
      map.current = null
      carrier.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Live position from Realtime, plus a slow poll as a safety net.
  useEffect(() => {
    const supabase = createClient()
    const apply = (row: { lat: number; lng: number; updated_at: string; speed_kmh?: number | null }) =>
      setPos({ lat: row.lat, lng: row.lng, updated_at: row.updated_at, speed_kmh: row.speed_kmh })

    const channel = supabase
      .channel(`track:${runId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'run_locations', filter: `run_id=eq.${runId}` },
        (payload) => {
          if (payload.eventType !== 'DELETE') apply(payload.new as never)
        },
      )
      .subscribe()

    const poll = async () => {
      const { data } = await supabase.from('run_locations').select('lat,lng,speed_kmh,updated_at').eq('run_id', runId).maybeSingle()
      if (data) apply(data)
    }
    const interval = setInterval(poll, 20000)
    const tick = setInterval(() => setNow(Date.now()), 15000)
    return () => {
      clearInterval(interval)
      clearInterval(tick)
      supabase.removeChannel(channel)
    }
  }, [runId])

  // Move the carrier marker.
  useEffect(() => {
    const m = map.current
    if (!m || !pos) return
    const ll: L.LatLngExpression = [pos.lat, pos.lng]
    if (!carrier.current) {
      carrier.current = L.marker(ll, { icon: squareIcon('🚚', '#16a34a', true), title: 'Carrier', zIndexOffset: 1000 }).addTo(m)
      m.panTo(ll)
    } else {
      carrier.current.setLatLng(ll)
      if (!m.getBounds().pad(-0.2).contains(ll)) m.panTo(ll, { animate: true })
    }
  }, [pos])

  const ageSec = pos ? Math.max(0, Math.round((now - new Date(pos.updated_at).getTime()) / 1000)) : null
  const stale = pos ? now - new Date(pos.updated_at).getTime() > STALE_AFTER_MS : false

  return (
    <div className="relative border border-slate-300 bg-slate-100">
      <div
        ref={el}
        className="h-[60vh] min-h-80 w-full [&_.leaflet-tile-pane]:grayscale-[35%] [&_.leaflet-tile-pane]:contrast-[1.05]"
        role="application"
        aria-label="Live map of your delivery"
      />
      <div className="absolute left-2 top-2 z-[500] bg-white/95 border border-slate-300 px-3 py-2 text-xs shadow">
        {!pos ? (
          <span className="font-bold text-slate-700">Waiting for the carrier to start driving…</span>
        ) : (
          <>
            <span className={stale ? 'font-black text-amber-700' : 'font-black text-emerald-700'}>
              {stale ? 'Signal lost' : 'Live'}
            </span>
            <span className="text-slate-600">
              {' '}· updated {ageSec! < 60 ? `${ageSec}s` : `${Math.round(ageSec! / 60)} min`} ago
              {pos.speed_kmh != null && !stale && ` · ${Math.round(pos.speed_kmh)} km/h`}
            </span>
          </>
        )}
      </div>
    </div>
  )
}
