import type { Metadata, Viewport } from 'next'
import { Inconsolata } from 'next/font/google'
import './globals.css'
import { RegisterServiceWorker } from '@/components/RegisterServiceWorker'

const inconsolata = Inconsolata({
  subsets: ['latin'],
  variable: '--font-inconsolata',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://supplier-hub-rouge.vercel.app'),
  title: 'Kuja Na Stock | Order tonight, stocked by 7 AM',
  description: 'Nairobi shop owners order stock in the evening from nearby farms and depots, and a boda rider delivers it before opening. No 4 AM market trip.',
  keywords: ['kuja na stock', 'duka stock delivery', 'nairobi', 'mama mboga', 'boda delivery', 'wholesale', 'farm gate'],
  authors: [{ name: 'Kuja Na Stock Logistics' }],
  openGraph: {
    title: 'Kuja Na Stock',
    description: 'Order tonight, stocked by 7 AM.',
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
  maximumScale: 1,
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
        <meta name="apple-mobile-web-app-title" content="KujaNaStock" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className={`${inconsolata.variable} font-mono min-h-screen bg-[#f8fafc] text-[#0f172a] antialiased selection:bg-orange-500 selection:text-white`}>
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  )
}