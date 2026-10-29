import type { Metadata, Viewport } from 'next'
import { Geist, Inconsolata } from 'next/font/google'
import './globals.css'
import { RegisterServiceWorker } from '@/components/RegisterServiceWorker'
import { BRAND_NAME, BRAND_SHORT_NAME, BRAND_TAGLINE, SITE_URL } from '@/lib/brand'

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
})

const inconsolata = Inconsolata({
  subsets: ['latin'],
  variable: '--font-inconsolata',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `${BRAND_NAME} | ${BRAND_TAGLINE}`,
  description: 'Nairobi butcheries order meat in the evening from nearby slaughterhouses and wholesalers, and a licensed meat carrier delivers it before opening.',
  keywords: [BRAND_NAME.toLowerCase(), 'butchery', 'meat delivery', 'nairobi', 'slaughterhouse', 'meat wholesaler', 'meat carrier'],
  authors: [{ name: BRAND_NAME }],
  openGraph: {
    title: BRAND_NAME,
    description: `${BRAND_TAGLINE}.`,
    type: 'website',
    images: ['/logo.jpg'],
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#ea580c',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ea580c" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={BRAND_SHORT_NAME} />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className={`${geist.variable} ${inconsolata.variable} font-sans min-h-screen bg-[#f8fafc] text-[#0f172a] antialiased selection:bg-orange-500 selection:text-white`}>
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  )
}