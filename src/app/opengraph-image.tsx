import { ImageResponse } from 'next/og'
import { BRAND_NAME, BRAND_TAGLINE } from '@/lib/brand'

// 1200x630 share image for WhatsApp, Facebook and LinkedIn previews.
export const alt = `${BRAND_NAME}: ${BRAND_TAGLINE}`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 80,
          background: 'linear-gradient(120deg, #0f172a 0%, #7c2d12 100%)',
          color: 'white',
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 800, color: '#fb923c', letterSpacing: 4, textTransform: 'uppercase' }}>
          For Nairobi butcheries
        </div>
        <div style={{ fontSize: 92, fontWeight: 900, marginTop: 20, lineHeight: 1.05 }}>{BRAND_NAME}</div>
        <div style={{ fontSize: 44, marginTop: 24, color: '#e2e8f0' }}>{BRAND_TAGLINE}</div>
      </div>
    ),
    size,
  )
}
