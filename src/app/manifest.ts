import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Kuja Na Stock PWA',
    short_name: 'KujaNaStock',
    description: 'B2B commodity supply & boda dispatch platform connecting retailers, wholesalers, farmers, and boda riders across East Africa.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#ea580c',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
