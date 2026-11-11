import type { NextConfig } from 'next'

const isDev = process.env.NODE_ENV !== 'production'

// Origins the app talks to: Supabase (API + realtime), OpenStreetMap tiles (or the
// provider set in NEXT_PUBLIC_MAP_TILE_URL) and Fish Audio (called from the server only).
const tileOrigin = (() => {
  try {
    return process.env.NEXT_PUBLIC_MAP_TILE_URL ? new URL(process.env.NEXT_PUBLIC_MAP_TILE_URL.replace(/\{[a-z]\}/g, 'x')).origin : ''
  } catch {
    return ''
  }
})()

// Next.js injects inline scripts and styles, so 'unsafe-inline' stays until a nonce-based CSP is set up.
// The rest of the policy still blocks framing, plugins, foreign form posts and third-party connections.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://*.supabase.co https://*.tile.openstreetmap.org https://tile.openstreetmap.org ${tileOrigin}`.trim(),
  "font-src 'self' data:",
  `connect-src 'self' https://*.supabase.co wss://*.supabase.co${isDev ? ' ws://localhost:*' : ''}`,
  "media-src 'self' blob:",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Location (carrier tracking) and microphone (assistant) are used by this site only.
  { key: 'Permissions-Policy', value: 'geolocation=(self), microphone=(self), camera=(), payment=()' },
]

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  turbopack: {},
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}

export default nextConfig
