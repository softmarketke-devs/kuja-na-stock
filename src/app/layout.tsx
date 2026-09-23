import type { Metadata, Viewport } from 'next'
import { Inconsolata } from 'next/font/google'
import './globals.css'

const inconsolata = Inconsolata({
  subsets: ['latin'],
  variable: '--font-inconsolata',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://supplier-hub-rouge.vercel.app'),
  title: 'KUJA NA STOCK // Nairobi B2B Supply & Boda Logistics Terminal',
  description: 'Industrial-grade PWA dispatch network connecting retailers, wholesalers, farmers, and boda riders across East Africa.',
  keywords: ['kuja na stock', 'nairobi supply chain', 'retailer kiosk', 'wholesaler', 'farmer', 'boda delivery', 'PWA'],
  authors: [{ name: 'Kuja Na Stock Logistics' }],
  openGraph: {
    title: 'KUJA NA STOCK // B2B Terminal',
    description: 'Direct commodity supply & boda dispatch system for East Africa',
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
      </body>
    </html>
  )
}