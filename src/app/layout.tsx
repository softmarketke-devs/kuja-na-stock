import type { Metadata, Viewport } from 'next'
import { Geist, Inconsolata } from 'next/font/google'
import './globals.css'
import { RegisterServiceWorker } from '@/components/RegisterServiceWorker'

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
  metadataBase: new URL('https://supplier-hub-rouge.vercel.app'),
  title: 'Kuja Na Stock | Order tonight, stocked by 7 AM',
  description: 'Nairobi butcheries order meat in the evening from nearby slaughterhouses and wholesalers, and a licensed meat carrier delivers it before opening.',
  keywords: ['kuja na stock', 'butchery', 'meat delivery', 'nairobi', 'slaughterhouse', 'meat wholesaler', 'meat carrier'],
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
        <meta name="apple-mobile-web-app-title" content="KujaNaStock" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className={`${geist.variable} ${inconsolata.variable} font-sans min-h-screen bg-[#f8fafc] text-[#0f172a] antialiased selection:bg-orange-500 selection:text-white`}>
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  )
}