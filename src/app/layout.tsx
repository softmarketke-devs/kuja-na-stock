import type { Metadata, Viewport } from 'next'
import { Fraunces, Hanken_Grotesk, Inconsolata } from 'next/font/google'
import './globals.css'
import { RegisterServiceWorker } from '@/components/RegisterServiceWorker'
import { BRAND_NAME, BRAND_SHORT_NAME, BRAND_TAGLINE, SITE_URL } from '@/lib/brand'

const hanken = Hanken_Grotesk({
  subsets: ['latin'],
  variable: '--font-hanken',
  display: 'swap',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
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
  description: 'Premium steaks, ribs and offal, butchered properly and delivered sealed. Know your cut, then order it right. Butcheries, slaughterhouses and carriers in Nairobi can sign in to trade and deliver.',
  alternates: { canonical: '/' },
  twitter: { card: 'summary_large_image' },
  authors: [{ name: BRAND_NAME }],
  openGraph: {
    title: BRAND_NAME,
    description: `${BRAND_TAGLINE}.`,
    type: 'website',
    siteName: BRAND_NAME,
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
  themeColor: '#120e0c',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${hanken.variable} ${fraunces.variable} ${inconsolata.variable}`} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#120e0c" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={BRAND_SHORT_NAME} />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className={`font-sans min-h-screen bg-paper text-ink antialiased`}>
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  )
}