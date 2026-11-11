import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/brand'

// Public, indexable pages only (login, signup and the dashboard are excluded).
const PAGES = [
  { path: '', priority: 1 },
  { path: '/delivery-and-payment', priority: 0.7 },
  { path: '/faq', priority: 0.7 },
  { path: '/terms', priority: 0.3 },
  { path: '/privacy', priority: 0.3 },
]

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map((p) => ({ url: `${SITE_URL}${p.path}`, priority: p.priority }))
}
