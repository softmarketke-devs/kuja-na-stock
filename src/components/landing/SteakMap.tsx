'use client'

import { useState } from 'react'
import Image from 'next/image'
import { MessageCircle } from 'lucide-react'
import { HOTSPOTS, SLIDES } from '@/lib/steak-map'
import { BRAND_NAME, SUPPORT_WHATSAPP } from '@/lib/brand'

const wa = (text: string) => `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(`Hello ${BRAND_NAME}, ${text}`)}`

/**
 * The hero: the client's own steak-map art, animated. The active tab's progress bar
 * (a CSS animation) drives autoplay; tapping any tab or region stops it for the visit.
 */
export function SteakMap() {
  const [n, setN] = useState(0)
  const [auto, setAuto] = useState(true)
  const slide = SLIDES[n]

  const go = (i: number, user = false) => {
    if (user) setAuto(false)
    setN(i)
  }

  return (
    <div className="grid gap-9 lg:grid-cols-[0.8fr_1.2fr] items-center">
      <div>
        <h1 className="font-display font-bold text-[clamp(34px,4.6vw,58px)] leading-[1.06] tracking-tight mb-3.5">
          Know your cut, then order it right.
        </h1>
        <p className="text-[#a79c8b] mb-6 max-w-[26em]">
          Premium steaks, ribs and offal, butchered properly and delivered sealed. Start with the map.
        </p>
        <div aria-live="polite" className="border-t-2 border-[#c8a25a] pt-4 min-h-[270px] max-lg:min-h-0">
          <div key={n} className="rise-in">
            <h2 className="font-display font-bold text-3xl leading-tight mb-2">{slide.title}</h2>
            <p className="text-[#cfc3ae] text-base mb-3.5">{slide.notes}</p>
            {slide.cuts.length > 0 && (
              <ul className="flex flex-wrap gap-2 mb-4 p-0 list-none">
                {slide.cuts.map((c) => (
                  <li key={c} className="border border-[#2f2721] rounded-full px-3.5 py-1 text-sm">{c}</li>
                ))}
              </ul>
            )}
            <a
              className="inline-flex items-center gap-2 rounded-sm bg-[#c8a25a] hover:bg-[#dcbb78] text-[#14100c] font-semibold text-sm px-5 py-3"
              href={wa(slide.cuts.length ? `I’m interested in: ${slide.cuts.join(', ')}.` : 'I’d like to order.')}
              rel="noopener"
            >
              <MessageCircle className="w-4 h-4" />
              {slide.cuts.length ? 'Ask about these cuts' : 'Order on WhatsApp'}
            </a>
          </div>
        </div>
      </div>

      <div className={`group ${auto ? '' : 'map-still'}`}>
        <div className="map-stage relative" style={{ aspectRatio: '800/697' }}>
          <Image
            key={slide.art}
            src={slide.art}
            alt="Hand-drawn steak map of a cow showing where each cut comes from"
            width={800}
            height={697}
            preload
            className="map-art w-full h-full block"
          />
          {n === 0 &&
            HOTSPOTS.map(([label, to, x, y]) => (
              <button
                key={label}
                type="button"
                aria-label={label}
                onClick={() => go(to, true)}
                className="map-hotspot"
                style={{ left: `${x}%`, top: `${y}%` }}
              />
            ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5 mt-2.5">
          {SLIDES.map((s, i) => (
            <button
              key={s.title}
              type="button"
              aria-pressed={i === n}
              onClick={() => go(i, true)}
              onAnimationEnd={(e) => {
                if (auto && i === n && e.animationName.includes('map-progress')) go((n + 1) % SLIDES.length)
              }}
              className={`map-tab text-left text-[11px] sm:text-[13px] font-medium ${i === n ? 'text-[#efe6d3]' : 'text-[#a79c8b]'}`}
            >
              <i className={`map-bar ${i < n ? 'done' : ''} ${i === n ? 'active' : ''}`} />
              <span>{i ? s.title.replace('The ', '') : 'All'}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
