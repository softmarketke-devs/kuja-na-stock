import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { BRAND_NAME, BRAND_TAGLINE } from '@/lib/brand'

// 1200x630 share image for WhatsApp, Facebook and LinkedIn previews.
export const alt = `${BRAND_NAME}: ${BRAND_TAGLINE}`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OpengraphImage() {
  const logo = `data:image/png;base64,${(await readFile(join(process.cwd(), 'public/brand/big-logo.png'))).toString('base64')}`
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
          background: 'radial-gradient(70% 80% at 80% 40%, #3a110d, #120e0c)',
          color: '#efe6d3',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt="" width={150} height={151} style={{ marginBottom: 28 }} />
        <div style={{ fontSize: 28, fontWeight: 800, color: '#c8a25a', letterSpacing: 4, textTransform: 'uppercase' }}>
          Premium steaks, ribs and offal
        </div>
        <div style={{ fontSize: 92, fontWeight: 900, marginTop: 20, lineHeight: 1.05 }}>{BRAND_NAME}</div>
        <div style={{ fontSize: 44, marginTop: 24, color: '#a79c8b' }}>{BRAND_TAGLINE}</div>
      </div>
    ),
    size,
  )
}
